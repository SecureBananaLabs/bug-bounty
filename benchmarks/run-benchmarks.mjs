import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { performance } from "node:perf_hooks";
import { createApp } from "../apps/api/src/app.js";
import { signAccessToken } from "../apps/api/src/utils/jwt.js";
import { benchmarkEndpoints } from "./endpoints.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const isSmoke = process.argv.includes("--smoke");

await loadEnvFile(path.join(repoRoot, ".env.benchmark"));

const thresholdsPath = path.join(__dirname, "thresholds.json");
const thresholds = JSON.parse(await fs.readFile(thresholdsPath, "utf8"));
const resultsDir = path.resolve(
  repoRoot,
  process.env.BENCHMARK_RESULTS_DIR || "benchmarks/results"
);

const config = {
  mode: isSmoke ? "smoke" : "full",
  requestsPerEndpoint: numberFromEnv(
    isSmoke ? "BENCHMARK_SMOKE_REQUESTS_PER_ENDPOINT" : "BENCHMARK_REQUESTS_PER_ENDPOINT",
    isSmoke ? 2 : 8
  ),
  concurrency: numberFromEnv(
    isSmoke ? "BENCHMARK_SMOKE_CONCURRENCY" : "BENCHMARK_CONCURRENCY",
    isSmoke ? 1 : 4
  )
};

let server;
let baseUrl = process.env.BENCHMARK_TARGET_URL?.replace(/\/$/, "");

if (!baseUrl) {
  const app = createApp();
  server = app.listen(0);
  await once(server, "listening");
  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
}

const authToken =
  process.env.BENCHMARK_AUTH_TOKEN ||
  signAccessToken({ sub: "usr_benchmark_admin", role: "admin", scope: "benchmark" });

try {
  await fs.mkdir(resultsDir, { recursive: true });

  const startedAt = new Date();
  const endpointResults = [];

  for (const endpoint of benchmarkEndpoints) {
    endpointResults.push(await runEndpointBenchmark(endpoint, baseUrl, authToken, config));
  }

  const finishedAt = new Date();
  const failures = evaluateThresholds(endpointResults, thresholds);
  const report = {
    suite: "api-benchmark",
    mode: config.mode,
    target: baseUrl,
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationMs: finishedAt.getTime() - startedAt.getTime(),
    config,
    environment: getEnvironment(),
    endpoints: endpointResults,
    thresholds,
    failures
  };

  const timestamp = startedAt.toISOString().replace(/[:.]/g, "-");
  const jsonPath = path.join(resultsDir, `api-benchmark-${config.mode}-${timestamp}.json`);
  const markdownPath = path.join(resultsDir, `api-benchmark-${config.mode}-${timestamp}.md`);
  const markdown = renderMarkdown(report);

  await fs.writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
  await fs.writeFile(markdownPath, markdown);
  await fs.writeFile(path.join(resultsDir, "latest.json"), `${JSON.stringify(report, null, 2)}\n`);
  await fs.writeFile(path.join(resultsDir, "latest.md"), markdown);

  console.log(`Benchmark mode: ${config.mode}`);
  console.log(`Target: ${baseUrl}`);
  console.log(`Endpoints: ${endpointResults.length}`);
  console.log(`JSON report: ${path.relative(repoRoot, jsonPath)}`);
  console.log(`Markdown report: ${path.relative(repoRoot, markdownPath)}`);

  if (failures.length > 0) {
    console.error("\nThreshold failures:");
    for (const failure of failures) {
      console.error(`- ${failure.endpoint}: ${failure.metric} ${failure.actual} > ${failure.limit}`);
    }
    process.exitCode = 1;
  }
} finally {
  if (server) {
    await closeServer(server);
  }
}

async function runEndpointBenchmark(endpoint, baseUrl, authToken, settings) {
  const samples = [];
  let nextIteration = 0;
  const workerCount = Math.min(settings.concurrency, settings.requestsPerEndpoint);
  const endpointStartedAt = performance.now();

  await Promise.all(
    Array.from({ length: workerCount }, async () => {
      while (nextIteration < settings.requestsPerEndpoint) {
        const iteration = nextIteration++;
        samples.push(await runSingleRequest(endpoint, baseUrl, authToken, iteration));
      }
    })
  );

  const endpointDurationMs = performance.now() - endpointStartedAt;
  return summarizeEndpoint(endpoint, samples, endpointDurationMs);
}

async function runSingleRequest(endpoint, baseUrl, authToken, iteration) {
  const request = endpoint.request?.({ iteration }) || {};
  const headers = new Headers(request.headers || {});
  if (endpoint.auth) {
    headers.set("authorization", `Bearer ${authToken}`);
  }

  const startedAt = performance.now();
  try {
    const response = await fetch(`${baseUrl}${endpoint.path}`, {
      method: endpoint.method,
      headers,
      body: request.body
    });
    const ttfbMs = performance.now() - startedAt;
    await response.arrayBuffer();
    const totalMs = performance.now() - startedAt;
    return {
      status: response.status,
      ok: response.ok,
      latencyMs: round(totalMs),
      ttfbMs: round(ttfbMs),
      error: null,
      completedAtMs: performance.now()
    };
  } catch (error) {
    const totalMs = performance.now() - startedAt;
    return {
      status: 0,
      ok: false,
      latencyMs: round(totalMs),
      ttfbMs: round(totalMs),
      error: error instanceof Error ? error.message : String(error),
      completedAtMs: performance.now()
    };
  }
}

function summarizeEndpoint(endpoint, samples, durationMs) {
  const latencies = samples.map((sample) => sample.latencyMs).sort((a, b) => a - b);
  const ttfb = samples.map((sample) => sample.ttfbMs).sort((a, b) => a - b);
  const errors = samples.filter((sample) => sample.error || sample.status >= 500 || sample.status === 0);
  const non2xx = samples.filter((sample) => sample.status < 200 || sample.status >= 300);
  const statusCounts = samples.reduce((acc, sample) => {
    acc[sample.status] = (acc[sample.status] || 0) + 1;
    return acc;
  }, {});

  return {
    name: endpoint.name,
    method: endpoint.method,
    path: endpoint.path,
    description: endpoint.description,
    requests: samples.length,
    durationMs: round(durationMs),
    p50LatencyMs: percentile(latencies, 50),
    p95LatencyMs: percentile(latencies, 95),
    p99LatencyMs: percentile(latencies, 99),
    p95TtfbMs: percentile(ttfb, 95),
    sustainedRps: round(samples.length / (durationMs / 1000)),
    peakRps: calculatePeakRps(samples),
    errorRate: round(errors.length / samples.length),
    non2xxRate: round(non2xx.length / samples.length),
    statusCounts
  };
}

function calculatePeakRps(samples) {
  if (samples.length === 0) return 0;
  const buckets = new Map();
  for (const sample of samples) {
    const bucket = Math.floor(sample.completedAtMs / 100);
    buckets.set(bucket, (buckets.get(bucket) || 0) + 1);
  }
  return Math.max(...buckets.values()) * 10;
}

function evaluateThresholds(results, thresholdConfig) {
  const failures = [];
  for (const result of results) {
    const limits = {
      ...thresholdConfig.defaults,
      ...(thresholdConfig.endpoints?.[result.name] || {})
    };

    for (const [metric, limit] of Object.entries(limits)) {
      const actual = result[metric];
      if (typeof actual === "number" && actual > limit) {
        failures.push({ endpoint: result.name, metric, actual, limit });
      }
    }
  }
  return failures;
}

function renderMarkdown(report) {
  const rows = report.endpoints
    .map(
      (endpoint) =>
        `| ${endpoint.method} | \`${endpoint.path}\` | ${endpoint.requests} | ${endpoint.p50LatencyMs} | ${endpoint.p95LatencyMs} | ${endpoint.p99LatencyMs} | ${endpoint.p95TtfbMs} | ${endpoint.sustainedRps} | ${endpoint.peakRps} | ${formatRate(endpoint.errorRate)} | ${formatRate(endpoint.non2xxRate)} |`
    )
    .join("\n");

  const failures =
    report.failures.length === 0
      ? "No threshold failures."
      : report.failures
          .map((failure) => `- ${failure.endpoint}: ${failure.metric} ${failure.actual} > ${failure.limit}`)
          .join("\n");

  return `# API Benchmark Report

- Mode: ${report.mode}
- Target: ${report.target}
- Started: ${report.startedAt}
- Finished: ${report.finishedAt}
- Requests per endpoint: ${report.config.requestsPerEndpoint}
- Concurrency: ${report.config.concurrency}
- Host: ${report.environment.platform} ${report.environment.release} (${report.environment.arch})
- CPU: ${report.environment.cpuModel}, ${report.environment.logicalCores} logical cores
- Memory: ${report.environment.totalMemoryMb} MB total, ${report.environment.freeMemoryMb} MB free at start
- Node.js: ${report.environment.nodeVersion}

| Method | Path | Requests | p50 ms | p95 ms | p99 ms | p95 TTFB ms | Sustained RPS | Peak RPS | Error Rate | Non-2xx Rate |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
${rows}

## Thresholds

${failures}
`;
}

async function loadEnvFile(filePath) {
  try {
    const content = await fs.readFile(filePath, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
      const [key, ...valueParts] = trimmed.split("=");
      if (!process.env[key]) {
        process.env[key] = valueParts.join("=").trim();
      }
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

function getEnvironment() {
  const cpus = os.cpus();
  return {
    platform: os.platform(),
    release: os.release(),
    arch: os.arch(),
    cpuModel: cpus[0]?.model || "unknown",
    logicalCores: cpus.length,
    totalMemoryMb: Math.round(os.totalmem() / 1024 / 1024),
    freeMemoryMb: Math.round(os.freemem() / 1024 / 1024),
    nodeVersion: process.version
  };
}

function numberFromEnv(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function percentile(sortedValues, percentileValue) {
  if (sortedValues.length === 0) return 0;
  const index = Math.ceil((percentileValue / 100) * sortedValues.length) - 1;
  return round(sortedValues[Math.min(Math.max(index, 0), sortedValues.length - 1)]);
}

function formatRate(value) {
  return `${round(value * 100)}%`;
}

function round(value) {
  return Math.round(value * 100) / 100;
}

function once(emitter, eventName) {
  return new Promise((resolve, reject) => {
    emitter.once(eventName, resolve);
    emitter.once("error", reject);
  });
}

function closeServer(openServer) {
  return new Promise((resolve, reject) => {
    openServer.close((error) => (error ? reject(error) : resolve()));
  });
}
