import { mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { createApp } from "../apps/api/src/app.js";
import { signAccessToken } from "../apps/api/src/utils/jwt.js";
import { benchmarkEndpoints } from "./endpoints.mjs";

const args = new Set(process.argv.slice(2));
const smokeMode = args.has("--smoke");
const repoRoot = path.resolve(import.meta.dirname, "..");
const outputDir = path.resolve(
  repoRoot,
  process.env.BENCHMARK_OUTPUT_DIR ?? "benchmarks/results"
);
const thresholdsPath = path.resolve(
  repoRoot,
  process.env.BENCHMARK_THRESHOLDS ?? "benchmarks/thresholds.json"
);

function numberFromEnv(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function percentile(values, percentileValue) {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((percentileValue / 100) * sorted.length) - 1)
  );
  return sorted[index];
}

function round(value, digits = 2) {
  return Number(value.toFixed(digits));
}

function statusCounts(samples) {
  return samples.reduce((counts, sample) => {
    const key = String(sample.status);
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
}

function peakRps(samples) {
  const buckets = new Map();

  for (const sample of samples) {
    const second = Math.floor(sample.completedAtMs / 1000);
    buckets.set(second, (buckets.get(second) ?? 0) + 1);
  }

  return Math.max(0, ...buckets.values());
}

async function startLocalServer() {
  const app = createApp();
  const server = app.listen(0, "127.0.0.1");

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const address = server.address();
  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: () => new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    })
  };
}

function resolveConfig() {
  const prefix = smokeMode ? "BENCHMARK_SMOKE_" : "BENCHMARK_";
  const fallbackRequests = smokeMode ? 2 : 8;
  const fallbackConcurrency = smokeMode ? 1 : 2;

  return {
    mode: smokeMode ? "smoke" : "full",
    requestsPerEndpoint: numberFromEnv(`${prefix}REQUESTS_PER_ENDPOINT`, fallbackRequests),
    concurrency: numberFromEnv(`${prefix}CONCURRENCY`, fallbackConcurrency),
    warmupRequests: smokeMode ? 0 : numberFromEnv("BENCHMARK_WARMUP_REQUESTS", 1),
    failOnThreshold: process.env.BENCHMARK_FAIL_ON_THRESHOLD !== "false"
  };
}

async function resolveTarget() {
  if (process.env.BENCHMARK_TARGET_URL) {
    return {
      baseUrl: process.env.BENCHMARK_TARGET_URL.replace(/\/$/, ""),
      close: async () => {}
    };
  }

  return startLocalServer();
}

function benchmarkToken() {
  if (process.env.BENCHMARK_AUTH_TOKEN) {
    return process.env.BENCHMARK_AUTH_TOKEN;
  }

  return signAccessToken({
    sub: "usr_benchmark_admin",
    role: "admin",
    scope: "benchmark"
  });
}

async function sendRequest(endpoint, baseUrl, authToken, index, endpointStartedAt) {
  const url = new URL(endpoint.path, `${baseUrl}/`);
  const request = endpoint.buildRequest?.({ index }) ?? {};
  const headers = new Headers(request.headers ?? {});

  if (endpoint.auth === "benchmark-admin") {
    headers.set("authorization", `Bearer ${authToken}`);
  }

  const startedAt = performance.now();

  try {
    const response = await fetch(url, {
      method: endpoint.method,
      headers,
      body: request.body
    });
    const ttfbMs = performance.now() - startedAt;
    const body = await response.arrayBuffer();
    const totalMs = performance.now() - startedAt;
    const expected = endpoint.expectedStatuses.includes(response.status);

    return {
      status: response.status,
      ok: expected,
      error: expected ? null : `expected ${endpoint.expectedStatuses.join("/")} but received ${response.status}`,
      bytes: body.byteLength,
      totalMs,
      ttfbMs,
      completedAtMs: performance.now() - endpointStartedAt
    };
  } catch (error) {
    return {
      status: 0,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      bytes: 0,
      totalMs: performance.now() - startedAt,
      ttfbMs: performance.now() - startedAt,
      completedAtMs: performance.now() - endpointStartedAt
    };
  }
}

async function runEndpoint(endpoint, config, baseUrl, authToken) {
  for (let index = 0; index < config.warmupRequests; index += 1) {
    await sendRequest(endpoint, baseUrl, authToken, index, performance.now());
  }

  const endpointStartedAt = performance.now();
  const samples = [];
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < config.requestsPerEndpoint) {
      const index = nextIndex;
      nextIndex += 1;
      samples.push(await sendRequest(endpoint, baseUrl, authToken, index, endpointStartedAt));
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(config.concurrency, config.requestsPerEndpoint) }, worker)
  );

  const elapsedMs = performance.now() - endpointStartedAt;
  const latencies = samples.map((sample) => sample.totalMs);
  const ttfbs = samples.map((sample) => sample.ttfbMs);
  const errors = samples.filter((sample) => !sample.ok);

  return {
    id: endpoint.id,
    name: endpoint.name,
    method: endpoint.method,
    path: endpoint.path,
    payloadProfile: endpoint.payloadProfile,
    requestCount: samples.length,
    durationMs: round(elapsedMs),
    metrics: {
      latencyMs: {
        p50: round(percentile(latencies, 50)),
        p95: round(percentile(latencies, 95)),
        p99: round(percentile(latencies, 99))
      },
      ttfbMs: {
        p50: round(percentile(ttfbs, 50)),
        p95: round(percentile(ttfbs, 95)),
        p99: round(percentile(ttfbs, 99))
      },
      rps: {
        sustained: round(samples.length / Math.max(elapsedMs / 1000, 0.001)),
        peak: peakRps(samples)
      },
      errorRatePercent: round((errors.length / Math.max(samples.length, 1)) * 100, 3),
      statusCounts: statusCounts(samples),
      bytesRead: samples.reduce((total, sample) => total + sample.bytes, 0)
    },
    samples: samples.map((sample) => ({
      status: sample.status,
      ok: sample.ok,
      error: sample.error,
      latencyMs: round(sample.totalMs),
      ttfbMs: round(sample.ttfbMs),
      bytes: sample.bytes
    }))
  };
}

async function readThresholds() {
  return JSON.parse(await readFile(thresholdsPath, "utf8"));
}

function evaluateThresholds(endpointReports, thresholds) {
  const failures = [];

  for (const report of endpointReports) {
    const threshold = {
      ...thresholds.defaults,
      ...(thresholds.endpoints?.[report.id] ?? {})
    };

    if (report.metrics.latencyMs.p99 > threshold.p99Ms) {
      failures.push(`${report.id} p99 ${report.metrics.latencyMs.p99}ms > ${threshold.p99Ms}ms`);
    }
    if (report.metrics.ttfbMs.p99 > threshold.ttfbP99Ms) {
      failures.push(`${report.id} ttfb p99 ${report.metrics.ttfbMs.p99}ms > ${threshold.ttfbP99Ms}ms`);
    }
    if (report.metrics.errorRatePercent > threshold.errorRatePercent) {
      failures.push(`${report.id} error rate ${report.metrics.errorRatePercent}% > ${threshold.errorRatePercent}%`);
    }
  }

  return failures;
}

function summarize(endpointReports) {
  const requestCount = endpointReports.reduce((total, report) => total + report.requestCount, 0);
  const failedRequests = endpointReports.reduce(
    (total, report) => total + report.samples.filter((sample) => !sample.ok).length,
    0
  );
  const maxP99 = Math.max(...endpointReports.map((report) => report.metrics.latencyMs.p99));
  const maxTtfbP99 = Math.max(...endpointReports.map((report) => report.metrics.ttfbMs.p99));
  const slowest = [...endpointReports].sort(
    (a, b) => b.metrics.latencyMs.p99 - a.metrics.latencyMs.p99
  )[0];

  return {
    endpointCount: endpointReports.length,
    requestCount,
    failedRequests,
    errorRatePercent: round((failedRequests / Math.max(requestCount, 1)) * 100, 3),
    maxP99LatencyMs: round(maxP99),
    maxP99TtfbMs: round(maxTtfbP99),
    slowestEndpoint: slowest ? {
      id: slowest.id,
      method: slowest.method,
      path: slowest.path,
      p99LatencyMs: slowest.metrics.latencyMs.p99
    } : null
  };
}

function environmentSnapshot() {
  return {
    node: process.version,
    platform: `${os.type()} ${os.release()} ${os.arch()}`,
    cpu: os.cpus()[0]?.model ?? "unknown",
    logicalCpus: os.cpus().length,
    totalMemoryMb: Math.round(os.totalmem() / 1024 / 1024),
    freeMemoryMb: Math.round(os.freemem() / 1024 / 1024)
  };
}

function markdownReport(report) {
  const rows = report.endpoints.map((endpoint) => [
    `${endpoint.method} \`${endpoint.path}\``,
    endpoint.requestCount,
    endpoint.metrics.latencyMs.p50,
    endpoint.metrics.latencyMs.p95,
    endpoint.metrics.latencyMs.p99,
    endpoint.metrics.ttfbMs.p99,
    endpoint.metrics.rps.sustained,
    endpoint.metrics.rps.peak,
    endpoint.metrics.errorRatePercent,
    Object.entries(endpoint.metrics.statusCounts).map(([status, count]) => `${status}:${count}`).join(", ")
  ]);

  return [
    `# API Benchmark Report (${report.mode})`,
    "",
    `Generated: ${report.generatedAt}`,
    `Target: \`${report.targetUrl}\``,
    "",
    "## Summary",
    "",
    `- Endpoints covered: ${report.summary.endpointCount}`,
    `- Requests measured: ${report.summary.requestCount}`,
    `- Error rate: ${report.summary.errorRatePercent}%`,
    `- Max p99 latency: ${report.summary.maxP99LatencyMs} ms`,
    `- Max p99 TTFB: ${report.summary.maxP99TtfbMs} ms`,
    `- Slowest endpoint: ${report.summary.slowestEndpoint?.method ?? "n/a"} \`${report.summary.slowestEndpoint?.path ?? "n/a"}\` (${report.summary.slowestEndpoint?.p99LatencyMs ?? 0} ms p99)`,
    `- Threshold gate: ${report.thresholdFailures.length === 0 ? "passed" : "failed"}`,
    "",
    "## Endpoint Metrics",
    "",
    "| Endpoint | Requests | p50 ms | p95 ms | p99 ms | TTFB p99 ms | Sustained RPS | Peak RPS | Error % | Statuses |",
    "|---|---:|---:|---:|---:|---:|---:|---:|---:|---|",
    ...rows.map((row) => `| ${row.join(" | ")} |`),
    "",
    "## Threshold Failures",
    "",
    ...(report.thresholdFailures.length === 0
      ? ["None."]
      : report.thresholdFailures.map((failure) => `- ${failure}`)),
    ""
  ].join("\n");
}

async function main() {
  const config = resolveConfig();
  const target = await resolveTarget();
  const thresholds = await readThresholds();
  const authToken = benchmarkToken();
  const runStartedAt = performance.now();

  try {
    const endpoints = [];

    for (const endpoint of benchmarkEndpoints) {
      endpoints.push(await runEndpoint(endpoint, config, target.baseUrl, authToken));
    }

    const thresholdFailures = evaluateThresholds(endpoints, thresholds);
    const report = {
      generatedAt: new Date().toISOString(),
      mode: config.mode,
      targetUrl: target.baseUrl,
      config,
      environment: environmentSnapshot(),
      durationMs: round(performance.now() - runStartedAt),
      summary: summarize(endpoints),
      thresholdFailures,
      endpoints
    };

    await mkdir(outputDir, { recursive: true });

    const prefix = smokeMode ? "smoke-latest" : "latest";
    const jsonPath = path.join(outputDir, `${prefix}.json`);
    const markdownPath = path.join(outputDir, `${prefix}.md`);

    await writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
    await writeFile(markdownPath, markdownReport(report));

    console.log(`Benchmarked ${report.summary.endpointCount} endpoints and ${report.summary.requestCount} requests.`);
    console.log(`Error rate: ${report.summary.errorRatePercent}%`);
    console.log(`Max p99 latency: ${report.summary.maxP99LatencyMs} ms`);
    console.log(`Wrote ${path.relative(repoRoot, jsonPath)} and ${path.relative(repoRoot, markdownPath)}.`);

    if (thresholdFailures.length > 0) {
      console.error("Threshold failures:");
      for (const failure of thresholdFailures) {
        console.error(`- ${failure}`);
      }
      if (config.failOnThreshold) {
        process.exitCode = 1;
      }
    }
  } finally {
    await target.close();
  }
}

await main();
