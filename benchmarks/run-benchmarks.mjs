import { mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";
import { createApp } from "../apps/api/src/app.js";
import { signAccessToken } from "../apps/api/src/utils/jwt.js";
import { makeEndpointDefinitions } from "./endpoints.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const resultsDir = path.join(rootDir, "benchmarks", "results");
const smokeMode = process.argv.includes("--smoke");

await loadEnvFile(path.join(rootDir, ".env.benchmark"));

const config = {
  requestsPerEndpoint: numberFromEnv("BENCHMARK_REQUESTS_PER_ENDPOINT", smokeMode ? 2 : 5),
  concurrency: numberFromEnv("BENCHMARK_CONCURRENCY", smokeMode ? 1 : 2),
  timeoutMs: numberFromEnv("BENCHMARK_TIMEOUT_MS", 5000),
  resultBasename: process.env.BENCHMARK_RESULT_BASENAME ?? "latest",
  mode: smokeMode ? "smoke" : "full"
};

const serverContext = await resolveTarget();
const thresholds = await readJson(path.join(rootDir, "benchmarks", "thresholds.json"));

try {
  const authToken =
    process.env.BENCHMARK_AUTH_TOKEN ??
    signAccessToken({ sub: "benchmark_admin", role: "admin", scope: "benchmark" });
  const endpoints = makeEndpointDefinitions({ authToken });
  const startedAt = new Date();
  const endpointResults = [];

  for (const endpoint of endpoints) {
    endpointResults.push(await benchmarkEndpoint(endpoint, serverContext.baseUrl, config));
  }

  const report = buildReport({
    baseUrl: serverContext.baseUrl,
    config,
    endpointResults,
    generatedAt: startedAt.toISOString(),
    thresholds
  });

  await mkdir(resultsDir, { recursive: true });
  await writeFile(
    path.join(resultsDir, `${config.resultBasename}.json`),
    `${JSON.stringify(report, null, 2)}\n`
  );
  await writeFile(path.join(resultsDir, `${config.resultBasename}.md`), renderMarkdown(report));

  printConsoleSummary(report);

  if (report.thresholdViolations.length > 0) {
    console.error("\nThreshold violations:");
    for (const violation of report.thresholdViolations) {
      console.error(`- ${violation.endpoint}: ${violation.message}`);
    }
    process.exitCode = 1;
  }
} finally {
  await serverContext.close();
}

async function loadEnvFile(envPath) {
  try {
    const raw = await readFile(envPath, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
        continue;
      }
      const [key, ...valueParts] = trimmed.split("=");
      process.env[key] ??= valueParts.join("=").trim();
    }
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }
}

function numberFromEnv(name, fallback) {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be a positive number`);
  }
  return Math.floor(value);
}

async function resolveTarget() {
  if (process.env.BENCHMARK_TARGET_URL) {
    return {
      baseUrl: process.env.BENCHMARK_TARGET_URL.replace(/\/$/, ""),
      close: async () => {}
    };
  }

  const app = createApp();
  const server = await new Promise((resolve, reject) => {
    const candidate = app.listen(0, "127.0.0.1");
    candidate.once("listening", () => resolve(candidate));
    candidate.once("error", reject);
  });
  const { port } = server.address();

  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())))
  };
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function benchmarkEndpoint(endpoint, baseUrl, runConfig) {
  const started = performance.now();
  const results = [];
  let nextSequence = 0;
  const workerCount = Math.min(runConfig.concurrency, runConfig.requestsPerEndpoint);

  async function worker() {
    while (nextSequence < runConfig.requestsPerEndpoint) {
      const sequence = nextSequence;
      nextSequence += 1;
      results.push(await measureRequest(endpoint, baseUrl, runConfig, sequence));
    }
  }

  await Promise.all(Array.from({ length: workerCount }, () => worker()));

  const durationMs = Math.max(performance.now() - started, 1);
  const sustainedRps = round(results.length / (durationMs / 1000));
  const latencies = results.map((result) => result.latencyMs);
  const ttfbs = results.map((result) => result.ttfbMs);
  const failed = results.filter((result) => result.status < 200 || result.status >= 400 || result.error);
  const statusCounts = results.reduce((counts, result) => {
    const key = result.error ? "error" : String(result.status);
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});

  return {
    name: endpoint.name,
    method: endpoint.method,
    path: endpoint.path,
    description: endpoint.description,
    requests: results.length,
    durationMs: round(durationMs),
    latencyMs: {
      p50: percentile(latencies, 50),
      p95: percentile(latencies, 95),
      p99: percentile(latencies, 99)
    },
    ttfbMs: {
      p95: percentile(ttfbs, 95)
    },
    rps: {
      sustained: sustainedRps,
      peak: Math.max(sustainedRps, peakRps(results, started))
    },
    errorRatePercent: round((failed.length / results.length) * 100),
    statusCounts,
    sampleErrors: failed.slice(0, 3).map((result) => result.error ?? `HTTP ${result.status}`)
  };
}

async function measureRequest(endpoint, baseUrl, runConfig, sequence) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), runConfig.timeoutMs);
  const headers = { ...(endpoint.headers ?? {}) };
  let body;

  if (endpoint.json) {
    headers["content-type"] = "application/json";
    body = JSON.stringify(endpoint.json(sequence));
  } else if (endpoint.formData) {
    body = endpoint.formData(sequence);
  }

  const started = performance.now();
  try {
    const response = await fetch(`${baseUrl}${endpoint.path}`, {
      method: endpoint.method,
      headers,
      body,
      signal: controller.signal
    });
    const firstByteAt = performance.now();
    await response.arrayBuffer();
    const completedAt = performance.now();

    return {
      status: response.status,
      latencyMs: round(completedAt - started),
      ttfbMs: round(firstByteAt - started),
      completedAt
    };
  } catch (error) {
    const completedAt = performance.now();
    return {
      status: 0,
      latencyMs: round(completedAt - started),
      ttfbMs: round(completedAt - started),
      completedAt,
      error: error.name === "AbortError" ? `Timed out after ${runConfig.timeoutMs}ms` : error.message
    };
  } finally {
    clearTimeout(timeout);
  }
}

function percentile(values, percentileValue) {
  if (values.length === 0) {
    return 0;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((percentileValue / 100) * sorted.length) - 1);
  return round(sorted[index]);
}

function peakRps(results, started) {
  const buckets = new Map();
  for (const result of results) {
    const bucket = Math.floor((result.completedAt - started) / 1000);
    buckets.set(bucket, (buckets.get(bucket) ?? 0) + 1);
  }
  return Math.max(...buckets.values(), 0);
}

function buildReport({ baseUrl, config, endpointResults, generatedAt, thresholds }) {
  const totals = endpointResults.reduce(
    (accumulator, endpoint) => {
      accumulator.requests += endpoint.requests;
      accumulator.errors += Math.round((endpoint.errorRatePercent / 100) * endpoint.requests);
      accumulator.maxP99Ms = Math.max(accumulator.maxP99Ms, endpoint.latencyMs.p99);
      return accumulator;
    },
    { requests: 0, errors: 0, maxP99Ms: 0 }
  );
  totals.errorRatePercent = round((totals.errors / totals.requests) * 100);

  return {
    generatedAt,
    mode: config.mode,
    target: baseUrl,
    config,
    environment: environmentSnapshot(),
    totals,
    thresholds,
    thresholdViolations: thresholdViolations(endpointResults, thresholds),
    endpoints: endpointResults
  };
}

function environmentSnapshot() {
  const cpus = os.cpus();
  return {
    node: process.version,
    platform: `${os.type()} ${os.release()} ${os.arch()}`,
    cpuModel: cpus[0]?.model ?? "unknown",
    logicalCpuCount: cpus.length,
    totalMemoryMb: Math.round(os.totalmem() / 1024 / 1024),
    freeMemoryMbAtStart: Math.round(os.freemem() / 1024 / 1024),
    networkInterface: "loopback when BENCHMARK_TARGET_URL is unset"
  };
}

function thresholdViolations(endpointResults, thresholds) {
  const defaults = thresholds.defaults ?? {};
  return endpointResults.flatMap((endpoint) => {
    const endpointThreshold = { ...defaults, ...(thresholds.endpoints?.[endpoint.name] ?? {}) };
    const violations = [];

    if (endpointThreshold.p99Ms !== undefined && endpoint.latencyMs.p99 > endpointThreshold.p99Ms) {
      violations.push({
        endpoint: endpoint.name,
        message: `p99 ${endpoint.latencyMs.p99}ms exceeded ${endpointThreshold.p99Ms}ms`
      });
    }

    if (
      endpointThreshold.errorRatePercent !== undefined &&
      endpoint.errorRatePercent > endpointThreshold.errorRatePercent
    ) {
      violations.push({
        endpoint: endpoint.name,
        message: `error rate ${endpoint.errorRatePercent}% exceeded ${endpointThreshold.errorRatePercent}%`
      });
    }

    return violations;
  });
}

function renderMarkdown(report) {
  const rows = report.endpoints
    .map(
      (endpoint) =>
        `| ${endpoint.name} | ${endpoint.method} | \`${endpoint.path}\` | ${endpoint.requests} | ${endpoint.latencyMs.p50} | ${endpoint.latencyMs.p95} | ${endpoint.latencyMs.p99} | ${endpoint.ttfbMs.p95} | ${endpoint.rps.sustained} | ${endpoint.rps.peak} | ${endpoint.errorRatePercent}% |`
    )
    .join("\n");
  const violations =
    report.thresholdViolations.length === 0
      ? "None"
      : report.thresholdViolations
          .map((violation) => `- ${violation.endpoint}: ${violation.message}`)
          .join("\n");

  return `# API Benchmark Report

- Generated: ${report.generatedAt}
- Mode: ${report.mode}
- Target: ${report.target}
- Requests: ${report.totals.requests}
- Total error rate: ${report.totals.errorRatePercent}%
- Max p99 latency: ${report.totals.maxP99Ms}ms

## Environment

- Node.js: ${report.environment.node}
- Platform: ${report.environment.platform}
- CPU: ${report.environment.cpuModel}
- Logical CPUs: ${report.environment.logicalCpuCount}
- Memory: ${report.environment.totalMemoryMb}MB total, ${report.environment.freeMemoryMbAtStart}MB free at start
- Network: ${report.environment.networkInterface}

## Endpoint Metrics

| Endpoint | Method | Path | Requests | p50 ms | p95 ms | p99 ms | p95 TTFB ms | Sustained RPS | Peak RPS | Error Rate |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
${rows}

## Threshold Violations

${violations}
`;
}

function printConsoleSummary(report) {
  console.log(`API benchmark (${report.mode}) -> ${report.target}`);
  console.log(`Requests: ${report.totals.requests}; error rate: ${report.totals.errorRatePercent}%`);
  console.log(`Max p99 latency: ${report.totals.maxP99Ms}ms`);
  console.log(`Wrote benchmarks/results/${report.config.resultBasename}.json`);
  console.log(`Wrote benchmarks/results/${report.config.resultBasename}.md`);
}

function round(value) {
  return Math.round(value * 100) / 100;
}
