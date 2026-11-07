import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { cpus, freemem, platform, release, totalmem } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { performance } from "node:perf_hooks";
import { benchmarkRoutes } from "./routes.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");
const resultsDir = resolve(__dirname, "results");
const isSmoke = process.argv.includes("--smoke");

await loadEnvFile(resolve(__dirname, ".env.benchmark"));

const requestsPerEndpoint = Number(
  process.env[isSmoke ? "BENCHMARK_SMOKE_REQUESTS_PER_ENDPOINT" : "BENCHMARK_REQUESTS_PER_ENDPOINT"] ??
    (isSmoke ? 2 : 8)
);
const timeoutMs = Number(process.env.BENCHMARK_TIMEOUT_MS ?? 5000);
const thresholds = await readJson(resolve(__dirname, "thresholds.json"));
const localServer = await maybeStartLocalServer();
const baseUrl = trimTrailingSlash(process.env.BENCHMARK_TARGET_URL ?? localServer.baseUrl);
const authToken = process.env.BENCHMARK_AUTH_TOKEN || (await createBenchmarkToken());

const startedAt = new Date();
const endpointResults = [];

for (const route of benchmarkRoutes) {
  endpointResults.push(await runEndpointBenchmark(route));
}

if (localServer.close) {
  await localServer.close();
}

const finishedAt = new Date();
const report = {
  mode: isSmoke ? "smoke" : "full",
  startedAt: startedAt.toISOString(),
  finishedAt: finishedAt.toISOString(),
  targetUrl: baseUrl,
  requestsPerEndpoint,
  environment: environmentSnapshot(),
  summary: summarize(endpointResults),
  endpoints: endpointResults
};

await mkdir(resultsDir, { recursive: true });
const stamp = startedAt.toISOString().replace(/[:.]/g, "-");
const jsonPath = resolve(resultsDir, `api-benchmark-${stamp}.json`);
const mdPath = resolve(resultsDir, `api-benchmark-${stamp}.md`);
const markdown = renderMarkdown(report);

await writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
await writeFile(mdPath, markdown);
await writeFile(resolve(resultsDir, "latest.json"), `${JSON.stringify(report, null, 2)}\n`);
await writeFile(resolve(resultsDir, "latest.md"), markdown);

const failures = evaluateThresholds(endpointResults);
console.log(markdown);

if (failures.length > 0) {
  console.error("\nBenchmark threshold failures:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exitCode = 1;
}

async function maybeStartLocalServer() {
  if (process.env.BENCHMARK_TARGET_URL) {
    return { baseUrl: trimTrailingSlash(process.env.BENCHMARK_TARGET_URL), close: null };
  }

  process.env.NODE_ENV = process.env.NODE_ENV ?? "benchmark";
  process.env.JWT_SECRET = process.env.JWT_SECRET ?? "development-secret";
  const { createApp } = await import(resolve(repoRoot, "apps/api/src/app.js"));
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolveListen, rejectListen) => {
    server.once("listening", resolveListen);
    server.once("error", rejectListen);
  });

  const { port } = server.address();
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () =>
      new Promise((resolveClose, rejectClose) => {
        server.close((error) => (error ? rejectClose(error) : resolveClose()));
      })
  };
}

async function runEndpointBenchmark(route) {
  const samples = [];
  const statuses = {};
  const perSecondCounts = new Map();
  const endpointStart = performance.now();

  for (let i = 0; i < requestsPerEndpoint; i += 1) {
    const sample = await requestOnce(route);
    samples.push(sample);
    statuses[sample.status] = (statuses[sample.status] ?? 0) + 1;
    const second = Math.floor((performance.now() - endpointStart) / 1000);
    perSecondCounts.set(second, (perSecondCounts.get(second) ?? 0) + 1);
  }

  const durationMs = performance.now() - endpointStart;
  const latencies = samples.map((sample) => sample.latencyMs).sort((a, b) => a - b);
  const ttfb = samples.map((sample) => sample.ttfbMs).sort((a, b) => a - b);
  const errorCount = samples.filter((sample) => sample.error || sample.status >= 500).length;
  const non2xxCount = samples.filter((sample) => sample.status < 200 || sample.status >= 300).length;

  return {
    name: route.name,
    method: route.method,
    path: route.path,
    auth: route.auth,
    requests: samples.length,
    statusCounts: statuses,
    p50LatencyMs: round(percentile(latencies, 50)),
    p95LatencyMs: round(percentile(latencies, 95)),
    p99LatencyMs: round(percentile(latencies, 99)),
    p95TtfbMs: round(percentile(ttfb, 95)),
    sustainedRps: round(samples.length / Math.max(durationMs / 1000, 0.001)),
    peakRps: Math.max(...perSecondCounts.values(), samples.length),
    errorRatePercent: round((errorCount / samples.length) * 100),
    non2xxRatePercent: round((non2xxCount / samples.length) * 100),
    durationMs: round(durationMs)
  };
}

async function requestOnce(route) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const url = `${baseUrl}${route.path}`;
  const headers = {};
  const options = { method: route.method, headers, signal: controller.signal };

  if (route.auth) {
    headers.authorization = `Bearer ${authToken}`;
  }
  if (route.json) {
    headers["content-type"] = "application/json";
    options.body = JSON.stringify(route.json());
  }
  if (route.formData) {
    options.body = route.formData();
  }

  const start = performance.now();
  try {
    const response = await fetch(url, options);
    const ttfbMs = performance.now() - start;
    await response.arrayBuffer();
    return { status: response.status, ttfbMs, latencyMs: performance.now() - start };
  } catch (error) {
    const elapsed = performance.now() - start;
    return { status: 0, ttfbMs: elapsed, latencyMs: elapsed, error: error.name || "RequestError" };
  } finally {
    clearTimeout(timeout);
  }
}

async function createBenchmarkToken() {
  const jwt = await import("jsonwebtoken");
  return jwt.default.sign(
    { sub: "usr_benchmark_admin", role: "admin", purpose: "benchmark" },
    process.env.JWT_SECRET ?? "development-secret",
    { expiresIn: "15m" }
  );
}

function summarize(results) {
  const requests = results.reduce((sum, result) => sum + result.requests, 0);
  const errors = results.reduce((sum, result) => sum + (result.errorRatePercent / 100) * result.requests, 0);
  return {
    endpointCount: results.length,
    totalRequests: requests,
    overallErrorRatePercent: round((errors / requests) * 100),
    slowestByP99: [...results].sort((a, b) => b.p99LatencyMs - a.p99LatencyMs).slice(0, 5)
  };
}

function evaluateThresholds(results) {
  const failures = [];
  for (const result of results) {
    const endpointThreshold = thresholds.endpoints?.[result.name] ?? {};
    const limit = { ...thresholds.defaults, ...endpointThreshold };
    if (result.p99LatencyMs > limit.p99LatencyMs) {
      failures.push(`${result.name} p99 ${result.p99LatencyMs}ms > ${limit.p99LatencyMs}ms`);
    }
    if (result.p95TtfbMs > limit.p95TtfbMs) {
      failures.push(`${result.name} p95 TTFB ${result.p95TtfbMs}ms > ${limit.p95TtfbMs}ms`);
    }
    if (result.errorRatePercent > limit.errorRatePercent) {
      failures.push(`${result.name} error rate ${result.errorRatePercent}% > ${limit.errorRatePercent}%`);
    }
  }
  return failures;
}

function renderMarkdown(report) {
  const lines = [
    "# API benchmark report",
    "",
    `Mode: ${report.mode}`,
    `Target: ${report.targetUrl}`,
    `Started: ${report.startedAt}`,
    `Finished: ${report.finishedAt}`,
    `Requests per endpoint: ${report.requestsPerEndpoint}`,
    "",
    "## Environment",
    "",
    `- CPU: ${report.environment.cpuModel} (${report.environment.cpuCount} logical cores)`,
    `- Memory: ${report.environment.totalMemoryGb} GiB total, ${report.environment.freeMemoryGb} GiB free at start`,
    `- OS: ${report.environment.platform} ${report.environment.release}`,
    `- Node.js: ${report.environment.node}`,
    "",
    "## Summary",
    "",
    `- Endpoints benchmarked: ${report.summary.endpointCount}`,
    `- Total requests: ${report.summary.totalRequests}`,
    `- Overall error rate: ${report.summary.overallErrorRatePercent}%`,
    "",
    "## Endpoint metrics",
    "",
    "| Endpoint | Requests | p50 ms | p95 ms | p99 ms | p95 TTFB ms | Sustained RPS | Peak RPS | Error % | Non-2xx % |",
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |"
  ];

  for (const result of report.endpoints) {
    lines.push(
      `| ${result.name} | ${result.requests} | ${result.p50LatencyMs} | ${result.p95LatencyMs} | ${result.p99LatencyMs} | ${result.p95TtfbMs} | ${result.sustainedRps} | ${result.peakRps} | ${result.errorRatePercent} | ${result.non2xxRatePercent} |`
    );
  }

  lines.push("", "## Slowest endpoints by p99", "");
  for (const result of report.summary.slowestByP99) {
    lines.push(`- ${result.name}: p99 ${result.p99LatencyMs}ms, p95 TTFB ${result.p95TtfbMs}ms`);
  }
  return `${lines.join("\n")}\n`;
}

function percentile(sortedValues, p) {
  if (sortedValues.length === 0) return 0;
  const index = Math.ceil((p / 100) * sortedValues.length) - 1;
  return sortedValues[Math.max(0, Math.min(sortedValues.length - 1, index))];
}

function round(value) {
  return Math.round(value * 100) / 100;
}

function trimTrailingSlash(value) {
  return value.replace(/\/+$/, "");
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function loadEnvFile(path) {
  if (!existsSync(path)) return;
  const raw = await readFile(path, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    process.env[key] = process.env[key] ?? value;
  }
}

function environmentSnapshot() {
  return {
    cpuModel: cpus()[0]?.model ?? "unknown",
    cpuCount: cpus().length,
    totalMemoryGb: round(totalmem() / 1024 ** 3),
    freeMemoryGb: round(freemem() / 1024 ** 3),
    platform: platform(),
    release: release(),
    node: process.version
  };
}
