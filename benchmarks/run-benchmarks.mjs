import { existsSync, readFileSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { performance } from "node:perf_hooks";
import { benchmarkEndpoints } from "./endpoints.mjs";

const benchmarkDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(benchmarkDir, "..");

loadEnvFile(path.join(repoRoot, ".env.benchmark"));

const isSmoke = boolEnv("BENCHMARK_SMOKE", false);
const runId = new Date().toISOString().replace(/[:.]/g, "-");
const targetUrl = readEnv("BENCHMARK_TARGET_URL", "");
const requestCount = numberEnv(
  isSmoke ? "BENCHMARK_SMOKE_REQUESTS_PER_ENDPOINT" : "BENCHMARK_REQUESTS_PER_ENDPOINT",
  isSmoke ? 2 : 8
);
const concurrency = numberEnv(
  isSmoke ? "BENCHMARK_SMOKE_CONCURRENCY" : "BENCHMARK_CONCURRENCY",
  isSmoke ? 1 : 2
);
const warmupRequests = numberEnv(
  isSmoke ? "BENCHMARK_SMOKE_WARMUP_REQUESTS" : "BENCHMARK_WARMUP_REQUESTS",
  isSmoke ? 0 : 1
);
const resultsDir = path.resolve(repoRoot, readEnv("BENCHMARK_RESULTS_DIR", "benchmarks/results"));

const thresholds = await readThresholds();
const thresholdProfile = {
  ...thresholds.default,
  ...(isSmoke ? thresholds.smoke : {})
};

const localTarget = !targetUrl;
const { baseUrl, close } = localTarget ? await startLocalServer() : { baseUrl: normaliseBaseUrl(targetUrl), close: async () => {} };
const tokenFactory = await createTokenFactory(localTarget);

try {
  const startedAt = new Date().toISOString();
  const started = performance.now();
  const endpointResults = [];

  console.log(`Benchmarking ${benchmarkEndpoints.length} endpoints against ${baseUrl}`);
  console.log(`Mode: ${isSmoke ? "smoke" : "full"}, requests/endpoint: ${requestCount}, concurrency: ${concurrency}`);

  for (const endpoint of benchmarkEndpoints) {
    const result = await benchmarkEndpoint(endpoint, {
      baseUrl,
      tokenFactory,
      requestCount,
      concurrency,
      warmupRequests,
      runId
    });
    endpointResults.push(result);
    console.log(formatConsoleResult(result));
  }

  const durationMs = performance.now() - started;
  const violations = checkThresholds(endpointResults, thresholds.endpoints ?? {}, thresholdProfile);
  const report = {
    run: {
      id: runId,
      startedAt,
      completedAt: new Date().toISOString(),
      durationMs: round(durationMs),
      mode: isSmoke ? "smoke" : "full",
      target: localTarget ? "local-loopback" : baseUrl,
      endpointCount: benchmarkEndpoints.length,
      requestsPerEndpoint: requestCount,
      concurrency,
      warmupRequests
    },
    environment: environmentMetadata(),
    thresholdProfile,
    summary: summarise(endpointResults),
    endpoints: endpointResults,
    violations
  };

  await writeReports(report);

  if (violations.length > 0) {
    console.error("\nBenchmark threshold violations:");
    for (const violation of violations) {
      console.error(`- ${violation.endpoint}: ${violation.metric} ${violation.actual} > ${violation.allowed}`);
    }
    process.exitCode = 1;
  }
} finally {
  await close();
}

async function benchmarkEndpoint(endpoint, options) {
  for (let index = 0; index < options.warmupRequests; index += 1) {
    await executeRequest(endpoint, makeContext(endpoint, options.runId, index, "warmup"), options);
  }

  const samples = [];
  let nextIndex = 0;
  const started = performance.now();
  const workers = Array.from({ length: Math.min(options.concurrency, options.requestCount) }, async () => {
    while (nextIndex < options.requestCount) {
      const index = nextIndex;
      nextIndex += 1;
      samples.push(await executeRequest(endpoint, makeContext(endpoint, options.runId, index, "measured"), options));
    }
  });

  await Promise.all(workers);
  const durationMs = performance.now() - started;

  return buildEndpointResult(endpoint, samples, durationMs);
}

async function executeRequest(endpoint, context, options) {
  const request = await buildRequest(endpoint, context, options);
  const startedAt = performance.now();
  let response;
  let responseStartedAt;
  let completedAt;
  let bodyBytes = 0;
  let error = null;

  try {
    response = await fetch(request.url, request.init);
    const headersReceivedAt = performance.now();
    const body = await readBody(response, headersReceivedAt);
    responseStartedAt = body.firstByteAt;
    bodyBytes = body.bytes;
    completedAt = performance.now();
  } catch (requestError) {
    completedAt = performance.now();
    responseStartedAt = completedAt;
    error = requestError instanceof Error ? requestError.message : String(requestError);
  }

  const status = response?.status ?? null;
  const expectedStatuses = Array.isArray(endpoint.expectedStatus) ? endpoint.expectedStatus : [endpoint.expectedStatus];
  const statusMatched = status !== null && expectedStatuses.includes(status);

  return {
    status,
    ok: !error && statusMatched,
    error: error ?? (statusMatched ? null : `Expected ${expectedStatuses.join(", ")} but received ${status}`),
    latencyMs: round(completedAt - startedAt),
    ttfbMs: round(responseStartedAt - startedAt),
    startedAt,
    completedAt,
    bodyBytes
  };
}

async function buildRequest(endpoint, context, options) {
  const headers = {
    "user-agent": "freelanceflow-api-benchmark/1.0"
  };

  if (endpoint.auth) {
    headers.authorization = `Bearer ${options.tokenFactory(endpoint.auth)}`;
  }

  const init = { method: endpoint.method, headers };

  if (endpoint.json) {
    headers["content-type"] = "application/json";
    init.body = JSON.stringify(endpoint.json(context));
  }

  if (endpoint.multipart) {
    const formData = new FormData();
    const multipart = endpoint.multipart(context);

    for (const [key, value] of Object.entries(multipart.fields ?? {})) {
      formData.append(key, value);
    }

    for (const file of multipart.files ?? []) {
      const blob = new Blob([file.content], { type: file.type ?? "application/octet-stream" });
      formData.append(file.field, blob, file.filename);
    }

    init.body = formData;
  }

  return {
    url: new URL(typeof endpoint.path === "function" ? endpoint.path(context) : endpoint.path, options.baseUrl).toString(),
    init
  };
}

function buildEndpointResult(endpoint, samples, durationMs) {
  const failures = samples.filter((sample) => !sample.ok);
  const latencies = samples.map((sample) => sample.latencyMs);
  const ttfb = samples.map((sample) => sample.ttfbMs);

  return {
    name: endpoint.name,
    method: endpoint.method,
    path: typeof endpoint.path === "string" ? endpoint.path : endpoint.name,
    scenario: endpoint.scenario,
    auth: endpoint.auth ?? "none",
    expectedStatus: endpoint.expectedStatus,
    requests: samples.length,
    successes: samples.length - failures.length,
    failures: failures.length,
    errorRate: round(failures.length / Math.max(samples.length, 1)),
    statusCounts: countStatuses(samples),
    latencyMs: metricSummary(latencies),
    ttfbMs: metricSummary(ttfb),
    rps: {
      sustained: round(samples.length / Math.max(durationMs / 1000, 0.001)),
      peak: round(calculatePeakRps(samples, durationMs))
    },
    bodyBytes: {
      min: Math.min(...samples.map((sample) => sample.bodyBytes)),
      max: Math.max(...samples.map((sample) => sample.bodyBytes)),
      total: samples.reduce((sum, sample) => sum + sample.bodyBytes, 0)
    },
    errors: failures.slice(0, 3).map((sample) => sample.error)
  };
}

function metricSummary(values) {
  return {
    min: round(Math.min(...values)),
    mean: round(values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1)),
    p50: percentile(values, 50),
    p95: percentile(values, 95),
    p99: percentile(values, 99),
    max: round(Math.max(...values))
  };
}

function percentile(values, percentileValue) {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.min(sorted.length - 1, Math.ceil((percentileValue / 100) * sorted.length) - 1);
  return round(sorted[index]);
}

function calculatePeakRps(samples, durationMs) {
  if (samples.length === 0) {
    return 0;
  }

  if (durationMs < 1000) {
    return samples.length / Math.max(durationMs / 1000, 0.001);
  }

  const completions = samples.map((sample) => sample.completedAt).sort((left, right) => left - right);
  let left = 0;
  let peak = 0;

  for (let right = 0; right < completions.length; right += 1) {
    while (completions[right] - completions[left] > 1000) {
      left += 1;
    }
    peak = Math.max(peak, right - left + 1);
  }

  return peak;
}

async function readBody(response, headersReceivedAt) {
  if (!response.body) {
    return {
      bytes: Buffer.byteLength(await response.text()),
      firstByteAt: headersReceivedAt
    };
  }

  const reader = response.body.getReader();
  let bytes = 0;
  let firstByteAt = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    firstByteAt ??= performance.now();
    bytes += value.byteLength;
  }

  return {
    bytes,
    firstByteAt: firstByteAt ?? headersReceivedAt
  };
}

function countStatuses(samples) {
  return samples.reduce((counts, sample) => {
    const key = sample.status === null ? "network_error" : String(sample.status);
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
}

function summarise(results) {
  const requests = results.reduce((sum, endpoint) => sum + endpoint.requests, 0);
  const failures = results.reduce((sum, endpoint) => sum + endpoint.failures, 0);
  const p99Values = results.map((endpoint) => endpoint.latencyMs.p99);
  const ttfbP99Values = results.map((endpoint) => endpoint.ttfbMs.p99);

  return {
    requests,
    successes: requests - failures,
    failures,
    errorRate: round(failures / Math.max(requests, 1)),
    maxP99LatencyMs: round(Math.max(...p99Values)),
    maxP99TtfbMs: round(Math.max(...ttfbP99Values)),
    peakRps: round(Math.max(...results.map((endpoint) => endpoint.rps.peak))),
    sustainedRps: round(results.reduce((sum, endpoint) => sum + endpoint.rps.sustained, 0))
  };
}

function checkThresholds(results, endpointThresholds, defaults) {
  const violations = [];

  for (const result of results) {
    const threshold = {
      ...defaults,
      ...(endpointThresholds[result.name] ?? {})
    };

    if (result.errorRate > threshold.maxErrorRate) {
      violations.push({
        endpoint: result.name,
        metric: "errorRate",
        actual: result.errorRate,
        allowed: threshold.maxErrorRate
      });
    }

    if (result.latencyMs.p99 > threshold.maxP99LatencyMs) {
      violations.push({
        endpoint: result.name,
        metric: "p99LatencyMs",
        actual: result.latencyMs.p99,
        allowed: threshold.maxP99LatencyMs
      });
    }

    if (result.ttfbMs.p99 > threshold.maxP99TtfbMs) {
      violations.push({
        endpoint: result.name,
        metric: "p99TtfbMs",
        actual: result.ttfbMs.p99,
        allowed: threshold.maxP99TtfbMs
      });
    }
  }

  return violations;
}

async function startLocalServer() {
  const { createApp } = await import("../apps/api/src/app.js");
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  return {
    baseUrl,
    close: () =>
      new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      })
  };
}

async function createTokenFactory(localTarget) {
  const { signAccessToken } = await import("../apps/api/src/utils/jwt.js");
  const tokens = new Map();

  return (role) => {
    const envKey = `BENCHMARK_${role.toUpperCase()}_TOKEN`;
    const configuredToken = readEnv(envKey, "");

    if (configuredToken) {
      return configuredToken;
    }

    if (!localTarget) {
      throw new Error(`${envKey} is required when BENCHMARK_TARGET_URL targets a deployed API.`);
    }

    if (!tokens.has(role)) {
      tokens.set(role, signAccessToken({ sub: `benchmark_${role}`, role, benchmark: true }));
    }

    return tokens.get(role);
  };
}

async function readThresholds() {
  const thresholdPath = path.join(benchmarkDir, "thresholds.json");
  return JSON.parse(await readFile(thresholdPath, "utf8"));
}

async function writeReports(report) {
  await mkdir(resultsDir, { recursive: true });

  const json = `${JSON.stringify(report, null, 2)}\n`;
  const markdown = markdownReport(report);

  await writeFile(path.join(resultsDir, "latest.json"), json);
  await writeFile(path.join(resultsDir, "latest.md"), markdown);

  console.log(`\nWrote ${path.relative(repoRoot, path.join(resultsDir, "latest.json"))}`);
  console.log(`Wrote ${path.relative(repoRoot, path.join(resultsDir, "latest.md"))}`);
}

function markdownReport(report) {
  const lines = [
    "# API Benchmark Results",
    "",
    `- Run: \`${report.run.id}\``,
    `- Mode: \`${report.run.mode}\``,
    `- Target: \`${report.run.target}\``,
    `- Endpoints: ${report.run.endpointCount}`,
    `- Requests per endpoint: ${report.run.requestsPerEndpoint}`,
    `- Concurrency: ${report.run.concurrency}`,
    `- Total requests: ${report.summary.requests}`,
    `- Error rate: ${percent(report.summary.errorRate)}`,
    `- Max p99 latency: ${report.summary.maxP99LatencyMs} ms`,
    `- Max p99 TTFB: ${report.summary.maxP99TtfbMs} ms`,
    `- Peak RPS: ${report.summary.peakRps}`,
    `- Sustained RPS total: ${report.summary.sustainedRps}`,
    "",
    "## Environment",
    "",
    `- Node: ${report.environment.node}`,
    `- Platform: ${report.environment.platform} ${report.environment.arch}`,
    `- CPU: ${report.environment.cpuModel}`,
    `- Cores: ${report.environment.cpuCount}`,
    `- Memory: ${report.environment.memoryMb} MB`,
    "",
    "## Endpoint Metrics",
    "",
    "| Endpoint | Method | Auth | Statuses | p50 ms | p95 ms | p99 ms | TTFB p99 ms | Sustained RPS | Peak RPS | Error rate |",
    "| --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |"
  ];

  for (const endpoint of report.endpoints) {
    lines.push(
      `| \`${endpoint.path}\` | ${endpoint.method} | ${endpoint.auth} | ${formatStatusCounts(endpoint.statusCounts)} | ${endpoint.latencyMs.p50} | ${endpoint.latencyMs.p95} | ${endpoint.latencyMs.p99} | ${endpoint.ttfbMs.p99} | ${endpoint.rps.sustained} | ${endpoint.rps.peak} | ${percent(endpoint.errorRate)} |`
    );
  }

  lines.push("", "## Thresholds", "");

  if (report.violations.length === 0) {
    lines.push("All configured benchmark thresholds passed.");
  } else {
    lines.push("| Endpoint | Metric | Actual | Allowed |", "| --- | --- | ---: | ---: |");
    for (const violation of report.violations) {
      lines.push(`| ${violation.endpoint} | ${violation.metric} | ${violation.actual} | ${violation.allowed} |`);
    }
  }

  return `${lines.join("\n")}\n`;
}

function environmentMetadata() {
  const cpus = os.cpus();
  return {
    node: process.version,
    platform: os.platform(),
    arch: os.arch(),
    cpuModel: cpus[0]?.model ?? "unknown",
    cpuCount: cpus.length,
    memoryMb: Math.round(os.totalmem() / 1024 / 1024)
  };
}

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return;
  }

  const content = readFileSync(filePath, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separator = line.indexOf("=");
    if (separator === -1) {
      continue;
    }

    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim().replace(/^["']|["']$/g, "");
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function readEnv(name, fallback) {
  const value = process.env[name];
  return value === undefined || value === "" ? fallback : value;
}

function numberEnv(name, fallback) {
  const value = Number(readEnv(name, String(fallback)));
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function boolEnv(name, fallback) {
  const value = readEnv(name, String(fallback)).toLowerCase();
  return ["1", "true", "yes", "on"].includes(value);
}

function makeContext(endpoint, runIdValue, index, phase) {
  return {
    endpoint,
    index,
    phase,
    runId: runIdValue,
    nextId: () => `${runIdValue}-${endpoint.name}-${phase}-${index}`.toLowerCase().replace(/[^a-z0-9]+/g, "-")
  };
}

function normaliseBaseUrl(url) {
  return url.endsWith("/") ? url : `${url}/`;
}

function formatConsoleResult(result) {
  return `${result.method.padEnd(4)} ${result.path.padEnd(32)} p99=${String(result.latencyMs.p99).padStart(6)}ms ttfb_p99=${String(result.ttfbMs.p99).padStart(6)}ms rps=${String(result.rps.sustained).padStart(6)} errors=${percent(result.errorRate)}`;
}

function formatStatusCounts(statusCounts) {
  return Object.entries(statusCounts)
    .map(([status, count]) => `${status}:${count}`)
    .join(", ");
}

function percent(value) {
  return `${round(value * 100)}%`;
}

function round(value) {
  return Math.round(value * 100) / 100;
}
