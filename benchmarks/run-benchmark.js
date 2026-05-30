import { readFileSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { availableParallelism as getAvailableParallelism } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { performance } from "node:perf_hooks";
import { apiBenchmarks } from "./routes.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const resultsDir = join(__dirname, "results");
const envFile = join(__dirname, ".env.benchmark");
const thresholdsFile = join(__dirname, "thresholds.json");
const peakRpsWindowMs = 100;

loadBenchmarkEnv();

const args = new Set(process.argv.slice(2));
const smoke = args.has("--smoke");
const checkThresholds = args.has("--check-thresholds");

const config = {
  concurrency: readNumber("BENCHMARK_CONCURRENCY", smoke ? 2 : 20),
  requests: readNumber("BENCHMARK_REQUESTS", smoke ? 4 : 80),
  warmupRequests: readNumber("BENCHMARK_WARMUP_REQUESTS", smoke ? 1 : 3),
  timeoutMs: readNumber("BENCHMARK_TIMEOUT_MS", smoke ? 5000 : 10000),
  targetUrl: normalizeBaseUrl(process.env.BENCHMARK_TARGET_URL),
  mode: smoke ? "smoke" : "default"
};

let localServer;

try {
  if (!config.targetUrl) {
    process.env.NODE_ENV = "benchmark";
    process.env.JWT_SECRET ??= "development-secret";
    const { createApp } = await import("../apps/api/src/app.js");
    const app = createApp();
    localServer = await listenOnRandomPort(app);
    config.targetUrl = `http://127.0.0.1:${localServer.address().port}`;
  }

  const benchmarkAuthToken = await getBenchmarkAuthToken();
  const thresholds = JSON.parse(await readFile(thresholdsFile, "utf8"));
  const startedAt = new Date();
  const environment = await collectEnvironment(config);
  const endpointResults = [];

  for (const endpoint of apiBenchmarks) {
    await warmupEndpoint(endpoint, config, benchmarkAuthToken);
    endpointResults.push(await runEndpoint(endpoint, config, benchmarkAuthToken));
  }

  const report = {
    benchmark: "SecureBanana API benchmark",
    mode: config.mode,
    startedAt: startedAt.toISOString(),
    finishedAt: new Date().toISOString(),
    targetUrl: config.targetUrl,
    config: {
      concurrency: config.concurrency,
      requestsPerEndpoint: config.requests,
      warmupRequestsPerEndpoint: config.warmupRequests,
      timeoutMs: config.timeoutMs,
      peakRpsWindowMs
    },
    environment,
    endpoints: endpointResults,
    summary: summarizeRun(endpointResults)
  };

  report.thresholds = evaluateThresholds(report, thresholds, smoke);

  await writeReports(report);
  printSummary(report);

  if (checkThresholds && report.thresholds.failures.length > 0) {
    process.exitCode = 1;
  }
} finally {
  if (localServer) {
    await closeServer(localServer);
  }
}

function loadBenchmarkEnv() {
  try {
    const contents = readFileSync(envFile, "utf8");
    for (const line of contents.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
        continue;
      }
      const [key, ...valueParts] = trimmed.split("=");
      const value = valueParts.join("=").trim().replace(/^['"]|['"]$/g, "");
      process.env[key.trim()] ??= value;
    }
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }
}

function readNumber(name, fallback) {
  const raw = process.env[name];
  if (!raw) {
    return fallback;
  }
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive number`);
  }
  return parsed;
}

function normalizeBaseUrl(value) {
  if (!value) {
    return "";
  }
  return value.replace(/\/+$/, "");
}

async function listenOnRandomPort(app) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, "127.0.0.1", () => resolve(server));
    server.on("error", reject);
  });
}

async function closeServer(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

async function getBenchmarkAuthToken() {
  if (process.env.BENCHMARK_AUTH_TOKEN) {
    return process.env.BENCHMARK_AUTH_TOKEN;
  }
  const { signAccessToken } = await import("../apps/api/src/utils/jwt.js");
  return signAccessToken({
    sub: "usr_benchmark_admin",
    role: "admin",
    scope: "benchmark:read"
  });
}

async function warmupEndpoint(endpoint, config, benchmarkAuthToken) {
  const warmupConfig = { ...config, concurrency: 1, requests: config.warmupRequests };
  if (warmupConfig.requests <= 0) {
    return;
  }
  await runEndpoint(endpoint, warmupConfig, benchmarkAuthToken, true);
}

async function runEndpoint(endpoint, config, benchmarkAuthToken, warmup = false) {
  const records = [];
  let nextIndex = 0;

  const workerCount = Math.min(config.concurrency, config.requests);
  const runStartedAt = performance.now();
  await Promise.all(Array.from({ length: workerCount }, async () => {
    while (nextIndex < config.requests) {
      const index = nextIndex;
      nextIndex += 1;
      records.push(await executeRequest(endpoint, config, benchmarkAuthToken, index));
    }
  }));
  const runFinishedAt = performance.now();

  if (warmup) {
    return null;
  }

  return summarizeEndpoint(endpoint, records, runFinishedAt - runStartedAt);
}

async function executeRequest(endpoint, config, benchmarkAuthToken, index) {
  const url = new URL(endpoint.path, `${config.targetUrl}/`);
  const headers = {};
  const request = {
    method: endpoint.method,
    headers
  };

  if (endpoint.auth === "benchmark") {
    headers.authorization = `Bearer ${benchmarkAuthToken}`;
  }

  if (endpoint.payloadKind === "json") {
    headers["content-type"] = "application/json";
    request.body = JSON.stringify(endpoint.buildRequest({ sequence: index + 1 }));
  } else if (endpoint.payloadKind === "multipart") {
    request.body = endpoint.buildRequest({ sequence: index + 1 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);
  const startedAt = performance.now();
  try {
    const response = await fetch(url, { ...request, signal: controller.signal });
    const headersAt = performance.now();
    await response.arrayBuffer();
    const finishedAt = performance.now();
    const success = response.status >= 200 && response.status < 300;

    return {
      status: response.status,
      ok: success,
      latencyMs: finishedAt - startedAt,
      ttfbMs: headersAt - startedAt,
      completedAtMs: finishedAt
    };
  } catch (error) {
    const finishedAt = performance.now();
    return {
      status: 0,
      ok: false,
      error: error.name === "AbortError" ? "timeout" : error.message,
      latencyMs: finishedAt - startedAt,
      ttfbMs: finishedAt - startedAt,
      completedAtMs: finishedAt
    };
  } finally {
    clearTimeout(timeout);
  }
}

function summarizeEndpoint(endpoint, records, elapsedMs) {
  const latencies = records.map((record) => record.latencyMs);
  const ttfb = records.map((record) => record.ttfbMs);
  const errors = records.filter((record) => !record.ok);
  const elapsedSeconds = Math.max(elapsedMs / 1000, 0.001);

  return {
    name: endpoint.name,
    method: endpoint.method,
    path: endpoint.path,
    routeKey: `${endpoint.method} ${stripQuery(endpoint.path)}`,
    requests: records.length,
    successes: records.length - errors.length,
    errors: errors.length,
    errorRate: errors.length / records.length,
    elapsedMs: round(elapsedMs),
    sustainedRps: round(records.length / elapsedSeconds),
    peakRps: calculatePeakRps(records),
    latencyMs: percentiles(latencies),
    ttfbMs: percentiles(ttfb),
    statuses: countBy(records.map((record) => String(record.status)))
  };
}

function stripQuery(path) {
  return path.split("?")[0];
}

function percentiles(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return {
    min: round(sorted[0]),
    p50: round(percentile(sorted, 50)),
    p95: round(percentile(sorted, 95)),
    p99: round(percentile(sorted, 99)),
    max: round(sorted[sorted.length - 1])
  };
}

function percentile(sorted, percentileValue) {
  if (sorted.length === 0) {
    return 0;
  }
  const index = Math.ceil((percentileValue / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
}

function calculatePeakRps(records) {
  const firstCompleted = Math.min(...records.map((record) => record.completedAtMs));
  const buckets = countBy(records.map((record) => String(Math.floor((record.completedAtMs - firstCompleted) / peakRpsWindowMs))));
  return round(Math.max(...Object.values(buckets)) * (1000 / peakRpsWindowMs));
}

function countBy(values) {
  return values.reduce((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

function summarizeRun(endpointResults) {
  const totalRequests = endpointResults.reduce((total, endpoint) => total + endpoint.requests, 0);
  const totalErrors = endpointResults.reduce((total, endpoint) => total + endpoint.errors, 0);
  const totalElapsedSeconds = endpointResults.reduce((total, endpoint) => total + (endpoint.elapsedMs / 1000), 0);
  const allLatencies = endpointResults.flatMap((endpoint) => [
    endpoint.latencyMs.p50,
    endpoint.latencyMs.p95,
    endpoint.latencyMs.p99
  ]);

  return {
    endpointCount: endpointResults.length,
    totalRequests,
    totalErrors,
    errorRate: totalErrors / totalRequests,
    sustainedRps: round(totalRequests / Math.max(totalElapsedSeconds, 0.001)),
    peakRps: Math.max(...endpointResults.map((endpoint) => endpoint.peakRps)),
    latencyMs: percentiles(allLatencies)
  };
}

async function collectEnvironment(config) {
  return {
    node: process.version,
    platform: `${process.platform} ${process.arch}`,
    pid: process.pid,
    cpuCount: availableParallelism(),
    benchmarkTarget: process.env.BENCHMARK_TARGET_URL ? "external" : "local-app",
    benchmarkMode: config.mode
  };
}

function availableParallelism() {
  try {
    return getAvailableParallelism();
  } catch {
    return null;
  }
}

function evaluateThresholds(report, thresholds, smoke) {
  const defaultThresholds = {
    ...thresholds.defaults,
    ...(smoke ? thresholds.smoke : {})
  };
  const failures = [];

  const results = report.endpoints.map((endpoint) => {
    const endpointThresholds = {
      ...defaultThresholds,
      ...(thresholds.endpoints?.[endpoint.routeKey] ?? {})
    };
    const checks = {
      p99Ms: endpoint.latencyMs.p99 <= endpointThresholds.p99Ms,
      ttfbP99Ms: endpoint.ttfbMs.p99 <= endpointThresholds.ttfbP99Ms,
      errorRate: endpoint.errorRate <= endpointThresholds.errorRate
    };

    for (const [check, passed] of Object.entries(checks)) {
      if (!passed) {
        failures.push({
          routeKey: endpoint.routeKey,
          check,
          actual: check === "errorRate" ? endpoint.errorRate : endpoint[check === "p99Ms" ? "latencyMs" : "ttfbMs"].p99,
          expected: endpointThresholds[check]
        });
      }
    }

    return {
      routeKey: endpoint.routeKey,
      thresholds: endpointThresholds,
      checks
    };
  });

  return { results, failures };
}

async function writeReports(report) {
  await mkdir(resultsDir, { recursive: true });
  const timestamp = report.startedAt.replace(/[:.]/g, "-");
  const json = JSON.stringify(report, null, 2);
  const markdown = renderMarkdown(report);

  await Promise.all([
    writeFile(join(resultsDir, `benchmark-${timestamp}.json`), `${json}\n`),
    writeFile(join(resultsDir, `benchmark-${timestamp}.md`), markdown),
    writeFile(join(resultsDir, "latest.json"), `${json}\n`),
    writeFile(join(resultsDir, "latest.md"), markdown)
  ]);
}

function renderMarkdown(report) {
  const rows = report.endpoints.map((endpoint) => (
    `| ${endpoint.routeKey} | ${endpoint.requests} | ${endpoint.latencyMs.p50} | ${endpoint.latencyMs.p95} | ${endpoint.latencyMs.p99} | ${endpoint.ttfbMs.p99} | ${endpoint.sustainedRps} | ${endpoint.peakRps} | ${formatPercent(endpoint.errorRate)} |`
  )).join("\n");

  const failures = report.thresholds.failures.length === 0
    ? "All configured thresholds passed."
    : report.thresholds.failures.map((failure) => (
      `- ${failure.routeKey}: ${failure.check} was ${round(failure.actual)}, expected <= ${failure.expected}`
    )).join("\n");

  return `# API Benchmark Report

Generated: ${report.startedAt}

Mode: ${report.mode}
Target: ${report.targetUrl}

## Environment

| Field | Value |
| --- | --- |
| Node.js | ${report.environment.node} |
| Platform | ${report.environment.platform} |
| CPU concurrency | ${report.environment.cpuCount ?? "unknown"} |
| Benchmark target | ${report.environment.benchmarkTarget} |
| Requests per endpoint | ${report.config.requestsPerEndpoint} |
| Concurrency | ${report.config.concurrency} |
| Timeout | ${report.config.timeoutMs} ms |
| Peak RPS window | ${report.config.peakRpsWindowMs} ms |

## Summary

| Endpoints | Requests | Errors | Error rate | Sustained RPS | Peak RPS |
| ---: | ---: | ---: | ---: | ---: | ---: |
| ${report.summary.endpointCount} | ${report.summary.totalRequests} | ${report.summary.totalErrors} | ${formatPercent(report.summary.errorRate)} | ${report.summary.sustainedRps} | ${report.summary.peakRps} |

## Endpoint Metrics

| Route | Requests | p50 ms | p95 ms | p99 ms | TTFB p99 ms | Sustained RPS | Peak RPS | Error rate |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
${rows}

## Thresholds

${failures}
`;
}

function printSummary(report) {
  const outputPath = join("benchmarks", "results", "latest.md");
  console.log(`Benchmarked ${report.summary.endpointCount} endpoints with ${report.summary.totalRequests} requests.`);
  console.log(`Error rate: ${formatPercent(report.summary.errorRate)}.`);
  console.log(`Report: ${outputPath}`);

  if (report.thresholds.failures.length > 0) {
    console.error("Threshold failures:");
    for (const failure of report.thresholds.failures) {
      console.error(`- ${failure.routeKey} ${failure.check}: ${round(failure.actual)} > ${failure.expected}`);
    }
  } else {
    console.log("All configured thresholds passed.");
  }
}

function formatPercent(value) {
  return `${round(value * 100)}%`;
}

function round(value) {
  return Math.round(value * 100) / 100;
}
