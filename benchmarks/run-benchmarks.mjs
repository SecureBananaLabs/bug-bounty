import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";
import { endpoints } from "./endpoints.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

loadEnvFile(path.join(rootDir, ".env.benchmark"));

const args = new Set(process.argv.slice(2));
const isSmoke = args.has("--smoke");
const config = {
  mode: isSmoke ? "smoke" : "full",
  requestsPerEndpoint: numberFromEnv("BENCHMARK_REQUESTS", isSmoke ? 3 : 25),
  concurrency: numberFromEnv("BENCHMARK_CONCURRENCY", isSmoke ? 1 : 5),
  timeoutMs: numberFromEnv("BENCHMARK_TIMEOUT_MS", 5000),
  outputDir: path.resolve(rootDir, process.env.BENCHMARK_OUTPUT_DIR ?? "benchmarks/results"),
  targetHost: trimTrailingSlash(process.env.BENCHMARK_TARGET_HOST ?? ""),
  bypassRateLimit: process.env.BENCHMARK_BYPASS_RATE_LIMIT !== "false"
};

const thresholds = JSON.parse(
  fs.readFileSync(path.join(rootDir, "benchmarks", "thresholds.json"), "utf8")
);

let localServer;
let baseUrl = config.targetHost;

try {
  if (!baseUrl) {
    ({ server: localServer, baseUrl } = await startLocalServer(config.bypassRateLimit));
  }

  const authToken = await resolveAuthToken(baseUrl);
  const runStartedAt = new Date();
  const endpointResults = [];

  for (const endpoint of endpoints) {
    endpointResults.push(await benchmarkEndpoint(endpoint, baseUrl, authToken, config));
  }

  const report = buildReport({
    startedAt: runStartedAt,
    completedAt: new Date(),
    baseUrl,
    config,
    thresholds,
    endpointResults
  });

  writeReport(report, config.outputDir);

  console.log(renderConsoleSummary(report));

  if (!report.gate.passed) {
    console.error(`Benchmark gate failed: ${report.gate.failures.length} failure(s).`);
    process.exitCode = 1;
  }
} finally {
  if (localServer) {
    await closeServer(localServer);
  }
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^["']|["']$/g, "");
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

async function startLocalServer(bypassRateLimit) {
  process.env.NODE_ENV = process.env.NODE_ENV || "benchmark";
  if (bypassRateLimit) {
    process.env.BENCHMARK_BYPASS_RATE_LIMIT = "true";
  }

  const { createApp } = await import("../apps/api/src/app.js");
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  return { server, baseUrl: `http://127.0.0.1:${port}` };
}

async function resolveAuthToken(baseUrl) {
  if (process.env.BENCHMARK_AUTH_TOKEN) {
    return process.env.BENCHMARK_AUTH_TOKEN;
  }

  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email: "benchmark-user@example.com",
      password: "benchmark-pass"
    })
  });

  if (!response.ok) {
    throw new Error(`Unable to obtain benchmark auth token: HTTP ${response.status}`);
  }

  const payload = await response.json();
  const token = payload?.data?.token;
  if (!token) {
    throw new Error("Login response did not include a benchmark auth token.");
  }

  return token;
}

async function benchmarkEndpoint(endpoint, baseUrl, authToken, runConfig) {
  await runRequest(endpoint, baseUrl, authToken, runConfig, -1).catch(() => null);

  const startedAt = performance.now();
  const completedResults = [];
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < runConfig.requestsPerEndpoint) {
      const requestIndex = nextIndex;
      nextIndex += 1;
      const result = await runRequest(endpoint, baseUrl, authToken, runConfig, requestIndex);
      completedResults.push({
        ...result,
        completedAtMs: performance.now() - startedAt
      });
    }
  }

  const workerCount = Math.min(runConfig.concurrency, runConfig.requestsPerEndpoint);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  const wallMs = performance.now() - startedAt;

  return summarizeEndpoint(endpoint, completedResults, wallMs);
}

async function runRequest(endpoint, baseUrl, authToken, runConfig, requestIndex) {
  const requestStartedAt = performance.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), runConfig.timeoutMs);

  try {
    const { body, headers } = buildRequestPayload(endpoint, requestIndex, authToken);
    const response = await fetch(`${baseUrl}${endpoint.path}`, {
      method: endpoint.method,
      headers,
      body,
      signal: controller.signal
    });
    const ttfbMs = performance.now() - requestStartedAt;
    await response.arrayBuffer();
    const totalMs = performance.now() - requestStartedAt;
    const expectedStatuses = endpoint.expectedStatuses ?? [200];

    return {
      ok: expectedStatuses.includes(response.status),
      status: response.status,
      latencyMs: totalMs,
      ttfbMs,
      error: expectedStatuses.includes(response.status) ? null : `HTTP ${response.status}`
    };
  } catch (error) {
    const totalMs = performance.now() - requestStartedAt;
    return {
      ok: false,
      status: null,
      latencyMs: totalMs,
      ttfbMs: totalMs,
      error: error.name === "AbortError" ? "timeout" : error.message
    };
  } finally {
    clearTimeout(timeout);
  }
}

function buildRequestPayload(endpoint, requestIndex, authToken) {
  const headers = { ...(endpoint.headers ?? {}) };
  if (endpoint.auth) {
    headers.authorization = `Bearer ${authToken}`;
  }

  if (endpoint.formData) {
    return {
      body: endpoint.formData({ requestIndex }),
      headers
    };
  }

  const body = typeof endpoint.body === "function"
    ? endpoint.body({ requestIndex })
    : endpoint.body;

  if (body === undefined) {
    return { body: undefined, headers };
  }

  return {
    body: JSON.stringify(body),
    headers: {
      "content-type": "application/json",
      ...headers
    }
  };
}

function summarizeEndpoint(endpoint, results, wallMs) {
  const latencies = results.map((result) => result.latencyMs);
  const ttfbValues = results.map((result) => result.ttfbMs);
  const errors = results.filter((result) => !result.ok);
  const sustainedRps = results.length / Math.max(wallMs / 1000, 0.001);
  const peakRps = calculatePeakRps(results, wallMs, sustainedRps);

  return {
    id: endpoint.id,
    name: endpoint.name,
    method: endpoint.method,
    path: endpoint.path,
    requests: results.length,
    errors: errors.length,
    errorRatePct: round((errors.length / Math.max(results.length, 1)) * 100, 2),
    statusCodes: countBy(results.map((result) => result.status ?? "network-error")),
    latencyMs: {
      p50: percentile(latencies, 50),
      p95: percentile(latencies, 95),
      p99: percentile(latencies, 99),
      min: round(Math.min(...latencies), 2),
      max: round(Math.max(...latencies), 2)
    },
    ttfbMs: {
      p50: percentile(ttfbValues, 50),
      p95: percentile(ttfbValues, 95),
      p99: percentile(ttfbValues, 99)
    },
    rps: {
      sustained: round(sustainedRps, 2),
      peak: round(peakRps, 2)
    },
    sampleErrors: [...new Set(errors.map((result) => result.error).filter(Boolean))].slice(0, 3)
  };
}

function buildReport({ startedAt, completedAt, baseUrl, config, thresholds, endpointResults }) {
  const failures = [];
  for (const result of endpointResults) {
    const threshold = thresholdFor(result, thresholds, config.mode);
    if (result.latencyMs.p99 > threshold.p99Ms) {
      failures.push(`${result.method} ${result.path} p99 ${result.latencyMs.p99}ms > ${threshold.p99Ms}ms`);
    }
    if (result.errorRatePct > threshold.errorRatePct) {
      failures.push(`${result.method} ${result.path} error rate ${result.errorRatePct}% > ${threshold.errorRatePct}%`);
    }
  }

  const totalRequests = endpointResults.reduce((sum, result) => sum + result.requests, 0);
  const totalErrors = endpointResults.reduce((sum, result) => sum + result.errors, 0);

  return {
    generatedAt: completedAt.toISOString(),
    target: baseUrl,
    mode: config.mode,
    config: {
      requestsPerEndpoint: config.requestsPerEndpoint,
      concurrency: config.concurrency,
      timeoutMs: config.timeoutMs
    },
    environment: {
      node: process.version,
      platform: `${os.type()} ${os.release()} ${os.arch()}`,
      cpuModel: os.cpus()?.[0]?.model ?? "unknown",
      cpuCount: os.cpus()?.length ?? 0,
      totalMemoryMb: Math.round(os.totalmem() / 1024 / 1024),
      freeMemoryMb: Math.round(os.freemem() / 1024 / 1024)
    },
    summary: {
      endpoints: endpointResults.length,
      totalRequests,
      totalErrors,
      errorRatePct: round((totalErrors / Math.max(totalRequests, 1)) * 100, 2),
      worstP99Ms: round(Math.max(...endpointResults.map((result) => result.latencyMs.p99)), 2),
      slowestEndpoint: endpointResults.toSorted((a, b) => b.latencyMs.p99 - a.latencyMs.p99)[0]?.id ?? null,
      durationMs: round(completedAt.getTime() - startedAt.getTime(), 2)
    },
    gate: {
      passed: failures.length === 0,
      failures
    },
    endpoints: endpointResults
  };
}

function thresholdFor(result, thresholds, mode) {
  return {
    ...(thresholds.global ?? {}),
    ...(thresholds[mode] ?? {}),
    ...(thresholds.endpoints?.[result.id] ?? {})
  };
}

function writeReport(report, outputDir) {
  fs.mkdirSync(outputDir, { recursive: true });
  const timestamp = report.generatedAt.replace(/[:.]/g, "-");
  const json = JSON.stringify(report, null, 2);
  const markdown = renderMarkdownSummary(report);

  fs.writeFileSync(path.join(outputDir, `${timestamp}.json`), `${json}\n`);
  fs.writeFileSync(path.join(outputDir, `${timestamp}.md`), `${markdown}\n`);
  fs.writeFileSync(path.join(outputDir, "latest.json"), `${json}\n`);
  fs.writeFileSync(path.join(outputDir, "latest.md"), `${markdown}\n`);
}

function renderConsoleSummary(report) {
  return [
    `Benchmark ${report.gate.passed ? "passed" : "failed"} against ${report.target}`,
    `Endpoints: ${report.summary.endpoints}`,
    `Requests: ${report.summary.totalRequests}`,
    `Error rate: ${report.summary.errorRatePct}%`,
    `Worst p99: ${report.summary.worstP99Ms}ms (${report.summary.slowestEndpoint})`,
    `Report: ${path.join(config.outputDir, "latest.md")}`
  ].join("\n");
}

function renderMarkdownSummary(report) {
  const rows = report.endpoints.map((result) => [
    `\`${result.method} ${result.path}\``,
    result.requests,
    `${result.latencyMs.p50} ms`,
    `${result.latencyMs.p95} ms`,
    `${result.latencyMs.p99} ms`,
    `${result.rps.sustained}`,
    `${result.rps.peak}`,
    `${result.errorRatePct}%`,
    `${result.ttfbMs.p50} ms`
  ]);

  return [
    "# API Benchmark Summary",
    "",
    `- Generated: ${report.generatedAt}`,
    `- Target: ${report.target}`,
    `- Mode: ${report.mode}`,
    `- Requests per endpoint: ${report.config.requestsPerEndpoint}`,
    `- Concurrency: ${report.config.concurrency}`,
    `- Gate: ${report.gate.passed ? "passed" : "failed"}`,
    "",
    "| Endpoint | Requests | p50 | p95 | p99 | Sustained RPS | Peak RPS | Error Rate | TTFB p50 |",
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
    ...rows.map((row) => `| ${row.join(" | ")} |`),
    "",
    "## Environment",
    "",
    `- Node.js: ${report.environment.node}`,
    `- Platform: ${report.environment.platform}`,
    `- CPU: ${report.environment.cpuModel} (${report.environment.cpuCount} cores)`,
    `- Memory: ${report.environment.freeMemoryMb} MB free / ${report.environment.totalMemoryMb} MB total`,
    "",
    "## Gate",
    "",
    report.gate.passed
      ? "All endpoints were within configured thresholds."
      : report.gate.failures.map((failure) => `- ${failure}`).join("\n")
  ].join("\n");
}

function calculatePeakRps(results, wallMs, sustainedRps) {
  if (wallMs < 1000) {
    return sustainedRps;
  }

  const buckets = new Map();
  for (const result of results) {
    const bucket = Math.floor(result.completedAtMs / 1000);
    buckets.set(bucket, (buckets.get(bucket) ?? 0) + 1);
  }

  return Math.max(...buckets.values(), sustainedRps);
}

function countBy(values) {
  return values.reduce((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

function percentile(values, percentileValue) {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((percentileValue / 100) * sorted.length) - 1;
  return round(sorted[Math.max(index, 0)], 2);
}

function numberFromEnv(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function round(value, precision) {
  return Number(value.toFixed(precision));
}

function trimTrailingSlash(value) {
  return value.replace(/\/$/, "");
}

function closeServer(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}
