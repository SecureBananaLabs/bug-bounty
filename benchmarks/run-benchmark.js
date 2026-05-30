import { readFileSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { availableParallelism as getAvailableParallelism } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import autocannon from "autocannon";
import { apiBenchmarks } from "./routes.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const resultsDir = join(__dirname, "results");
const envFile = join(__dirname, ".env.benchmark");
const thresholdsFile = join(__dirname, "thresholds.json");
const autocannonVersion = readPackageVersion("autocannon");

loadBenchmarkEnv();

const args = new Set(process.argv.slice(2));
const smoke = args.has("--smoke");
const checkThresholds = args.has("--check-thresholds");

const config = {
  concurrency: readInteger("BENCHMARK_CONCURRENCY", smoke ? 2 : 20),
  requests: readInteger("BENCHMARK_REQUESTS", smoke ? 4 : 80),
  warmupRequests: readInteger("BENCHMARK_WARMUP_REQUESTS", smoke ? 1 : 3, { min: 0 }),
  timeoutMs: readInteger("BENCHMARK_TIMEOUT_MS", smoke ? 5000 : 10000),
  sampleIntervalMs: readInteger("BENCHMARK_SAMPLE_INTERVAL_MS", 1000),
  targetUrl: normalizeBaseUrl(process.env.BENCHMARK_TARGET_URL),
  disableRateLimit: readBoolean("BENCHMARK_DISABLE_RATE_LIMIT", true),
  runId: process.env.BENCHMARK_RUN_ID ?? makeRunId(),
  mode: smoke ? "smoke" : "default"
};

let localServer;

try {
  const { createApp } = await import("../apps/api/src/app.js");
  if (!config.targetUrl) {
    process.env.NODE_ENV = "benchmark";
    process.env.JWT_SECRET ??= "development-secret";
    if (config.disableRateLimit) {
      process.env.BENCHMARK_DISABLE_RATE_LIMIT = "1";
    }
    const app = createApp();
    assertApiBenchmarkCoverage(app);
    localServer = await listenOnRandomPort(app);
    config.targetUrl = `http://127.0.0.1:${localServer.address().port}`;
  } else {
    assertApiBenchmarkCoverage(createApp());
  }

  const benchmarkAuthToken = await getBenchmarkAuthToken();
  const thresholds = JSON.parse(await readFile(thresholdsFile, "utf8"));
  const startedAt = new Date();
  const environment = await collectEnvironment(config);
  const endpointResults = [];
  let nextSequence = 1;

  for (const endpoint of apiBenchmarks) {
    nextSequence += await warmupEndpoint(
      endpoint,
      config,
      benchmarkAuthToken,
      nextSequence
    );
    endpointResults.push(
      await runEndpoint(endpoint, config, benchmarkAuthToken, nextSequence)
    );
    nextSequence += config.requests;
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
      sampleIntervalMs: config.sampleIntervalMs
    },
    tool: {
      name: "autocannon",
      version: autocannonVersion
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

function readInteger(name, fallback, { min = 1 } = {}) {
  const raw = process.env[name];
  if (!raw) {
    return fallback;
  }
  const parsed = Number(raw);
  if (!Number.isSafeInteger(parsed) || parsed < min) {
    throw new Error(`${name} must be an integer greater than or equal to ${min}`);
  }
  return parsed;
}

function readBoolean(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === "") {
    return fallback;
  }
  return !["0", "false", "no", "off"].includes(raw.toLowerCase());
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

async function warmupEndpoint(endpoint, config, benchmarkAuthToken, sequenceStart) {
  const warmupConfig = {
    ...config,
    concurrency: 1,
    requests: config.warmupRequests
  };
  if (warmupConfig.requests <= 0) {
    return 0;
  }
  await runEndpoint(endpoint, warmupConfig, benchmarkAuthToken, sequenceStart, true);
  return warmupConfig.requests;
}

async function runEndpoint(
  endpoint,
  config,
  benchmarkAuthToken,
  sequenceStart,
  warmup = false
) {
  const responseRecords = [];
  const headerTimingsMs = [];
  let nextSequence = sequenceStart;

  const instance = autocannon({
    title: endpoint.name,
    url: config.targetUrl,
    connections: Math.min(config.concurrency, config.requests),
    amount: config.requests,
    timeout: Math.ceil(config.timeoutMs / 1000),
    sampleInt: config.sampleIntervalMs,
    pipelining: 1,
    requests: [
      {
        setupRequest: () => buildAutocannonRequest(
          endpoint,
          benchmarkAuthToken,
          nextSequence++,
          config.runId
        )
      }
    ],
    setupClient(client) {
      client.on("headers", () => {
        const pending = client.pipelinedRequests?.peek?.();
        if (!pending?.startTime) {
          return;
        }
        const [seconds, nanoseconds] = process.hrtime(pending.startTime);
        headerTimingsMs.push((seconds * 1000) + (nanoseconds / 1e6));
      });
    }
  });

  instance.on("response", (_client, status, bytes, latencyMs) => {
    responseRecords.push({ status, bytes, latencyMs });
  });

  const result = await instance;

  if (warmup) {
    return null;
  }

  return summarizeEndpoint(endpoint, result, responseRecords, headerTimingsMs);
}

function buildAutocannonRequest(endpoint, benchmarkAuthToken, sequence, runId) {
  const headers = {};
  const request = {
    method: endpoint.method,
    path: endpoint.path,
    headers
  };

  if (endpoint.auth === "benchmark") {
    headers.authorization = `Bearer ${benchmarkAuthToken}`;
  }

  if (endpoint.payloadKind === "json") {
    headers["content-type"] = "application/json";
    request.body = JSON.stringify(endpoint.buildRequest({ sequence, runId }));
  } else if (endpoint.payloadKind === "multipart") {
    const multipart = buildMultipartBody(endpoint.buildRequest({ sequence, runId }), runId, sequence);
    headers["content-type"] = multipart.contentType;
    request.body = multipart.body;
  }

  return request;
}

function buildMultipartBody(file, runId, sequence) {
  const boundary = `----securebanana-benchmark-${runId}-${sequence}`;
  const body = [
    `--${boundary}`,
    `Content-Disposition: form-data; name="${file.fieldName}"; filename="${file.filename}"`,
    `Content-Type: ${file.contentType}`,
    "",
    file.body,
    `--${boundary}--`,
    ""
  ].join("\r\n");
  return {
    body,
    contentType: `multipart/form-data; boundary=${boundary}`
  };
}

function summarizeEndpoint(endpoint, result, responseRecords, headerTimingsMs) {
  const statusCounts = normalizeStatusCounts(result.statusCodeStats);
  const completedResponses = Object.values(statusCounts).reduce((total, count) => total + count, 0);
  const successCount = Object.entries(statusCounts)
    .filter(([status]) => Number(status) >= 200 && Number(status) < 300)
    .reduce((total, [, count]) => total + count, 0);
  const requestCount = Math.max(result.requests?.sent ?? 0, completedResponses + result.errors);
  const errorCount = Math.max(0, requestCount - successCount);
  const elapsedSeconds = Math.max(result.duration, 0.001);

  return {
    name: endpoint.name,
    method: endpoint.method,
    path: endpoint.path,
    routeKey: routeKeyForEndpoint(endpoint),
    requests: requestCount,
    successes: successCount,
    errors: errorCount,
    errorRate: requestCount === 0 ? 1 : errorCount / requestCount,
    elapsedMs: round(elapsedSeconds * 1000),
    sustainedRps: round(completedResponses / elapsedSeconds),
    peakRps: round(result.requests?.max ?? 0),
    latencyMs: percentiles(responseRecords.map((record) => record.latencyMs)),
    ttfbMs: percentiles(headerTimingsMs),
    statuses: statusCounts,
    autocannon: {
      durationSeconds: result.duration,
      connections: result.connections,
      pipelining: result.pipelining,
      errors: result.errors,
      timeouts: result.timeouts,
      non2xx: result.non2xx,
      requests: pickHistogram(result.requests),
      latency: pickHistogram(result.latency),
      throughput: pickHistogram(result.throughput)
    }
  };
}

function routeKeyForEndpoint(endpoint) {
  return `${endpoint.method} ${endpoint.pathPattern ?? stripQuery(endpoint.path)}`;
}

function stripQuery(path) {
  return path.split("?")[0];
}

function percentiles(values) {
  if (values.length === 0) {
    return { min: 0, p50: 0, p95: 0, p99: 0, max: 0 };
  }
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
    benchmarkTool: `autocannon ${autocannonVersion}`,
    benchmarkTarget: process.env.BENCHMARK_TARGET_URL ? "external" : "local-app",
    rateLimiterDisabled: process.env.BENCHMARK_TARGET_URL ? false : config.disableRateLimit,
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
| Benchmark tool | ${report.environment.benchmarkTool} |
| Benchmark target | ${report.environment.benchmarkTarget} |
| Rate limiter disabled | ${report.environment.rateLimiterDisabled ? "yes" : "no"} |
| Requests per endpoint | ${report.config.requestsPerEndpoint} |
| Concurrency | ${report.config.concurrency} |
| Timeout | ${report.config.timeoutMs} ms |
| RPS sample interval | ${report.config.sampleIntervalMs} ms |

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

function normalizeStatusCounts(statusCodeStats) {
  return Object.fromEntries(
    Object.entries(statusCodeStats ?? {})
      .map(([status, value]) => [status, Number(value.count ?? 0)])
      .filter(([, count]) => count > 0)
  );
}

function pickHistogram(histogram) {
  if (!histogram) {
    return {};
  }
  return {
    min: histogram.min,
    max: histogram.max,
    average: histogram.average,
    p50: histogram.p50,
    p90: histogram.p90,
    p97_5: histogram.p97_5,
    p99: histogram.p99
  };
}

function assertApiBenchmarkCoverage(app) {
  const mountedRoutes = collectExpressRoutes(app)
    .filter((route) => route.includes(" /api/") || route.endsWith(" /api"))
    .sort();
  const benchmarkRoutes = apiBenchmarks.map(routeKeyForEndpoint).sort();
  const missing = mountedRoutes.filter((route) => !benchmarkRoutes.includes(route));
  const extra = benchmarkRoutes.filter((route) => !mountedRoutes.includes(route));

  if (missing.length > 0 || extra.length > 0) {
    throw new Error([
      "Benchmark route coverage mismatch.",
      missing.length ? `Missing benchmark routes: ${missing.join(", ")}` : "",
      extra.length ? `Extra benchmark routes: ${extra.join(", ")}` : ""
    ].filter(Boolean).join(" "));
  }
}

function collectExpressRoutes(app) {
  const routes = [];
  walkExpressStack(app._router?.stack ?? [], "");
  return routes;

  function walkExpressStack(stack, prefix) {
    for (const layer of stack) {
      if (layer.route) {
        for (const method of Object.keys(layer.route.methods)) {
          routes.push(`${method.toUpperCase()} ${normalizeRoutePath(prefix, layer.route.path)}`);
        }
      } else if (layer.name === "router" && layer.handle?.stack) {
        walkExpressStack(layer.handle.stack, `${prefix}${extractMountPath(layer.regexp)}`);
      }
    }
  }
}

function extractMountPath(regexp) {
  return regexp.source
    .replace(/^\^\\\//, "/")
    .replace(/\\\/\?\(\?=\\\/\|\$\)$/, "")
    .replaceAll("\\/", "/");
}

function normalizeRoutePath(prefix, routePath) {
  const path = `${prefix}/${String(routePath).replace(/^\/+/, "")}`;
  return path.replace(/\/+/g, "/").replace(/\/$/, "") || "/";
}

function readPackageVersion(packageName) {
  const packageJson = JSON.parse(
    readFileSync(join(__dirname, "..", "node_modules", packageName, "package.json"), "utf8")
  );
  return packageJson.version;
}

function makeRunId() {
  return new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
}
