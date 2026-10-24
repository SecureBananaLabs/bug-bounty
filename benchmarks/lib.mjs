import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROUTE_METHOD = /\.(get|post|put|patch|delete|head|options)\(\s*["'`]([^"'`]+)["'`]/gi;
const MOUNT_ROUTE = /app\.use\(\s*["'`]([^"'`]+)["'`]\s*,\s*([A-Za-z0-9_]+)\s*\)/g;

export async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

export async function loadEnvironment(filePath) {
  try {
    const content = await readFile(filePath, "utf8");
    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const separator = line.indexOf("=");
      if (separator < 1) continue;
      const key = line.slice(0, separator).trim();
      const value = line.slice(separator + 1).trim().replace(/^['"]|['"]$/g, "");
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

export function validateTarget(rawTarget, allowRemote) {
  const target = new URL(rawTarget);
  const localHosts = new Set(["127.0.0.1", "localhost", "::1"]);
  if (!localHosts.has(target.hostname) && !allowRemote) {
    throw new Error(
      "Refusing a non-local benchmark target. Set BENCHMARK_ALLOW_REMOTE=true only for an isolated staging environment."
    );
  }
  return target.toString().replace(/\/$/, "");
}

export function discoverRoutes(appSource, routeSources) {
  const mounts = new Map();
  for (const match of appSource.matchAll(MOUNT_ROUTE)) mounts.set(match[2], match[1]);

  const endpoints = [];
  for (const [moduleName, source] of Object.entries(routeSources)) {
    const mount = mounts.get(moduleName);
    if (!mount) continue;

    for (const match of source.matchAll(ROUTE_METHOD)) {
      const method = match[1].toUpperCase();
      const childPath = match[2];
      const suffix = childPath === "/" ? "/" : childPath.startsWith("/") ? childPath : `/${childPath}`;
      endpoints.push({
        method,
        path: `${mount}${suffix}`.replace(/\/{2,}/g, "/")
      });
    }
  }

  return [...new Map(endpoints.map((endpoint) => [`${endpoint.method} ${endpoint.path}`, endpoint])).values()]
    .sort((a, b) => `${a.method} ${a.path}`.localeCompare(`${b.method} ${b.path}`));
}

export function endpointConfiguration(endpoint, manifest, token) {
  const id = `${endpoint.method} ${endpoint.path}`;
  const defaults = manifest.defaults ?? {};
  const override = (manifest.overrides ?? []).find((candidate) => new RegExp(candidate.match).test(id)) ?? {};
  const requiresAuth = override.requiresAuth ?? defaults.requiresAuth ?? false;

  if (requiresAuth && !token) {
    return { ...endpoint, id, skipped: "BENCHMARK_TOKEN is required for this authenticated route" };
  }

  const query = new URLSearchParams(override.query ?? {}).toString();
  const headers = {
    ...(defaults.headers ?? {}),
    ...(override.headers ?? {}),
    ...(requiresAuth ? { authorization: `Bearer ${token}` } : {})
  };

  let body;
  if (override.body !== undefined) {
    body = JSON.stringify(override.body);
    headers["content-type"] ??= "application/json";
  }

  return {
    ...endpoint,
    id,
    urlSuffix: `${endpoint.path}${query ? `?${query}` : ""}`,
    headers,
    body
  };
}

export function percentile(samples, ratio) {
  if (!samples.length) return null;
  const ordered = [...samples].sort((a, b) => a - b);
  const index = Math.min(ordered.length - 1, Math.ceil(ordered.length * ratio) - 1);
  return Number(ordered[index].toFixed(3));
}

export async function measureTtfb(target, endpoint, count) {
  const timings = [];
  for (let index = 0; index < count; index += 1) {
    const started = process.hrtime.bigint();
    const response = await fetch(`${target}${endpoint.urlSuffix}`, {
      method: endpoint.method,
      headers: endpoint.headers,
      body: endpoint.body,
      signal: AbortSignal.timeout(15_000)
    });
    await response.body?.cancel();
    timings.push(Number(process.hrtime.bigint() - started) / 1_000_000);
  }
  return {
    samples: timings.length,
    p50Ms: percentile(timings, 0.5),
    p95Ms: percentile(timings, 0.95),
    p99Ms: percentile(timings, 0.99)
  };
}

export function normaliseResult(endpoint, result, ttfb) {
  const total = result.requests?.total ?? 0;
  const errors = (result.errors ?? 0) + (result.timeouts ?? 0) + (result.non2xx ?? 0);
  return {
    endpoint: endpoint.id,
    method: endpoint.method,
    path: endpoint.path,
    latencyMs: {
      p50: result.latency?.p50 ?? null,
      p95: result.latency?.p95 ?? result.latency?.p97_5 ?? null,
      p99: result.latency?.p99 ?? null
    },
    requestsPerSecond: {
      sustained: result.requests?.average ?? 0,
      peak: result.requests?.max ?? 0
    },
    errorRatePercent: total === 0 ? 100 : Number(((errors / total) * 100).toFixed(3)),
    requestCount: total,
    errors: {
      connection: result.errors ?? 0,
      timeouts: result.timeouts ?? 0,
      non2xx: result.non2xx ?? 0
    },
    ttfbMs: ttfb,
    durationSeconds: result.duration ?? 0
  };
}

export function evaluateThresholds(results, thresholds, smoke) {
  const fallback = smoke ? thresholds.smoke : thresholds.default;
  const failures = [];

  for (const result of results) {
    if (result.skipped) continue;
    const threshold = thresholds.overrides?.[result.endpoint] ?? fallback;
    if (result.latencyMs.p99 !== null && result.latencyMs.p99 > threshold.p99Ms) {
      failures.push(`${result.endpoint}: p99 ${result.latencyMs.p99}ms exceeds ${threshold.p99Ms}ms`);
    }
    if (result.errorRatePercent > threshold.maxErrorRatePercent) {
      failures.push(
        `${result.endpoint}: error rate ${result.errorRatePercent}% exceeds ${threshold.maxErrorRatePercent}%`
      );
    }
  }
  return failures;
}

export function markdownReport(report) {
  const rows = report.results.map((result) => {
    if (result.skipped) return `| ${result.endpoint} | skipped | ${result.skipped} |`;
    return `| ${result.endpoint} | ${result.latencyMs.p50} / ${result.latencyMs.p95} / ${result.latencyMs.p99} | ${result.requestsPerSecond.sustained.toFixed(2)} / ${result.requestsPerSecond.peak.toFixed(2)} | ${result.errorRatePercent}% | ${result.ttfbMs.p50Ms} |`;
  });

  return [
    "# API Benchmark Report",
    "",
    `- Generated: ${report.generatedAt}`,
    `- Target: ${report.target}`,
    `- Profile: ${report.profile}`,
    `- Node: ${report.nodeVersion}`,
    "",
    "| Endpoint | p50 / p95 / p99 (ms) | Sustained / peak RPS | Error rate | TTFB p50 (ms) |",
    "|---|---:|---:|---:|---:|",
    ...rows,
    "",
    report.failures.length ? "## Regression failures\n\n" + report.failures.map((failure) => `- ${failure}`).join("\n") : "## Regression gate\n\nPassed."
  ].join("\n");
}

export async function persistReport(resultsDirectory, report) {
  await mkdir(resultsDirectory, { recursive: true });
  const stamp = report.generatedAt.replace(/[:.]/g, "-");
  const jsonPath = path.join(resultsDirectory, `benchmark-${stamp}.json`);
  const markdownPath = path.join(resultsDirectory, `benchmark-${stamp}.md`);
  await writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
  await writeFile(markdownPath, `${markdownReport(report)}\n`);
  return { jsonPath, markdownPath };
}
