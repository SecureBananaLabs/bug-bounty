import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { createApp } from "../apps/api/src/app.js";
import { signAccessToken } from "../apps/api/src/utils/jwt.js";
import { endpoints } from "./endpoints.mjs";

const args = new Set(process.argv.slice(2));
const smoke = args.has("--smoke");
const failOnThreshold = args.has("--fail-on-threshold");
const resultsDir = path.resolve("benchmarks/results");
const thresholdsPath = path.resolve("benchmarks/thresholds.json");

function envNumber(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function percentile(values, pct) {
  if (values.length === 0) {
    return 0;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((pct / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(sorted.length - 1, index))];
}

function round(value) {
  return Math.round(value * 100) / 100;
}

function summarize(samples, wallMs) {
  const latency = samples.map((sample) => sample.latencyMs);
  const ttfb = samples.map((sample) => sample.ttfbMs);
  const errors = samples.filter((sample) => !sample.ok);
  const buckets = new Map();

  for (const sample of samples) {
    const bucket = Math.floor(sample.completedAtMs / 1000);
    buckets.set(bucket, (buckets.get(bucket) ?? 0) + 1);
  }

  return {
    requestCount: samples.length,
    okCount: samples.length - errors.length,
    errorCount: errors.length,
    errorRatePct: round((errors.length / samples.length) * 100),
    latencyMs: {
      p50: round(percentile(latency, 50)),
      p95: round(percentile(latency, 95)),
      p99: round(percentile(latency, 99))
    },
    ttfbMs: {
      p50: round(percentile(ttfb, 50)),
      p95: round(percentile(ttfb, 95)),
      p99: round(percentile(ttfb, 99))
    },
    rps: {
      sustained: round(samples.length / (wallMs / 1000)),
      peak: Math.max(...buckets.values(), 0)
    },
    statuses: samples.reduce((acc, sample) => {
      const status = String(sample.status ?? "error");
      acc[status] = (acc[status] ?? 0) + 1;
      return acc;
    }, {})
  };
}

async function startLocalServer() {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const { port } = server.address();
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())))
  };
}

function createBenchmarkToken(localServerStarted) {
  if (process.env.BENCHMARK_AUTH_TOKEN) {
    return process.env.BENCHMARK_AUTH_TOKEN;
  }
  if (localServerStarted) {
    return signAccessToken({
      sub: "usr_benchmark_admin",
      role: "admin",
      purpose: "benchmark"
    });
  }
  throw new Error("BENCHMARK_AUTH_TOKEN is required when BENCHMARK_TARGET_URL is set.");
}

async function executeRequest(endpoint, baseUrl, token) {
  const headers = {};
  const init = { method: endpoint.method, headers };

  if (endpoint.protected) {
    headers.authorization = `Bearer ${token}`;
  }

  if (endpoint.json) {
    headers["content-type"] = "application/json";
    init.body = JSON.stringify(endpoint.json());
  } else if (endpoint.body) {
    init.body = endpoint.body();
  }

  const startedAtMs = performance.now();
  try {
    const response = await fetch(`${baseUrl}${endpoint.path}`, init);
    const firstByteAtMs = performance.now();
    const text = await response.text();
    const completedAtMs = performance.now();
    return {
      status: response.status,
      ok: endpoint.expectedStatuses.includes(response.status),
      latencyMs: completedAtMs - startedAtMs,
      ttfbMs: firstByteAtMs - startedAtMs,
      bytes: Buffer.byteLength(text),
      completedAtMs
    };
  } catch (error) {
    const completedAtMs = performance.now();
    return {
      status: null,
      ok: false,
      latencyMs: completedAtMs - startedAtMs,
      ttfbMs: completedAtMs - startedAtMs,
      error: error.message,
      completedAtMs
    };
  }
}

async function benchmarkEndpoint(endpoint, baseUrl, token, requestCount, concurrency) {
  const samples = [];
  let next = 0;
  const wallStart = performance.now();

  async function worker() {
    while (next < requestCount) {
      next += 1;
      samples.push(await executeRequest(endpoint, baseUrl, token));
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, requestCount) }, () => worker())
  );

  const wallMs = performance.now() - wallStart;
  return {
    id: endpoint.id,
    method: endpoint.method,
    path: endpoint.path,
    protected: Boolean(endpoint.protected),
    expectedStatuses: endpoint.expectedStatuses,
    ...summarize(samples, wallMs)
  };
}

function evaluateThresholds(results, thresholds) {
  const failures = [];
  for (const result of results.endpoints) {
    const threshold = {
      ...thresholds.defaults,
      ...(thresholds.endpoints?.[result.id] ?? {})
    };

    if (result.latencyMs.p99 > threshold.p99LatencyMs) {
      failures.push(`${result.id} p99 latency ${result.latencyMs.p99}ms > ${threshold.p99LatencyMs}ms`);
    }
    if (result.ttfbMs.p99 > threshold.p99TtfbMs) {
      failures.push(`${result.id} p99 TTFB ${result.ttfbMs.p99}ms > ${threshold.p99TtfbMs}ms`);
    }
    if (result.errorRatePct > threshold.errorRatePct) {
      failures.push(`${result.id} error rate ${result.errorRatePct}% > ${threshold.errorRatePct}%`);
    }
  }
  return failures;
}

function markdown(results, thresholdFailures) {
  const rows = results.endpoints
    .map((endpoint) =>
      [
        endpoint.id,
        `${endpoint.method} ${endpoint.path}`,
        endpoint.requestCount,
        endpoint.latencyMs.p50,
        endpoint.latencyMs.p95,
        endpoint.latencyMs.p99,
        endpoint.ttfbMs.p99,
        endpoint.rps.sustained,
        endpoint.rps.peak,
        endpoint.errorRatePct
      ].join(" | ")
    )
    .join("\n");

  return `# API Benchmark Summary

Mode: ${results.mode}
Target: ${results.target}
Generated: ${results.generatedAt}

## Environment

- CPU: ${results.environment.cpu}
- CPU cores: ${results.environment.cores}
- RAM total: ${results.environment.totalRamGb} GB
- OS: ${results.environment.platform} ${results.environment.release}
- Node.js: ${results.environment.node}
- Network: loopback for local server; configured target otherwise

## Results

Endpoint | Route | Requests | p50 ms | p95 ms | p99 ms | p99 TTFB ms | Sustained RPS | Peak RPS | Error %
--- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---:
${rows}

## Threshold Gate

${thresholdFailures.length === 0 ? "Passed." : thresholdFailures.map((failure) => `- ${failure}`).join("\n")}
`;
}

async function main() {
  await fs.mkdir(resultsDir, { recursive: true });
  const localServerStarted = !process.env.BENCHMARK_TARGET_URL;
  const server = localServerStarted ? await startLocalServer() : null;
  const baseUrl = (process.env.BENCHMARK_TARGET_URL ?? server.baseUrl).replace(/\/$/, "");
  const token = createBenchmarkToken(localServerStarted);
  const concurrency = envNumber("BENCHMARK_CONCURRENCY", smoke ? 1 : 3);
  const requestCount = envNumber("BENCHMARK_REQUESTS_PER_ENDPOINT", smoke ? 1 : 6);
  const thresholds = JSON.parse(await fs.readFile(thresholdsPath, "utf8"));
  const endpointResults = [];

  try {
    for (const endpoint of endpoints) {
      endpointResults.push(await benchmarkEndpoint(endpoint, baseUrl, token, requestCount, concurrency));
    }
  } finally {
    if (server) {
      await server.close();
    }
  }

  const results = {
    mode: smoke ? "smoke" : "full",
    target: localServerStarted ? "local in-process API server" : baseUrl,
    generatedAt: new Date().toISOString(),
    settings: { concurrency, requestCount },
    environment: {
      cpu: os.cpus()[0]?.model ?? "unknown",
      cores: os.cpus().length,
      totalRamGb: round(os.totalmem() / 1024 / 1024 / 1024),
      platform: os.platform(),
      release: os.release(),
      node: process.version
    },
    endpoints: endpointResults
  };
  const failures = evaluateThresholds(results, thresholds);
  const prefix = process.env.BENCHMARK_OUTPUT_PREFIX ?? (smoke ? "smoke" : "benchmark");
  const jsonPath = path.join(resultsDir, `${prefix}-latest.json`);
  const markdownPath = path.join(resultsDir, `${prefix}-latest.md`);

  await fs.writeFile(jsonPath, `${JSON.stringify(results, null, 2)}\n`);
  await fs.writeFile(markdownPath, markdown(results, failures));

  console.log(`Wrote ${jsonPath}`);
  console.log(`Wrote ${markdownPath}`);

  if (failures.length > 0) {
    console.error("Threshold failures:");
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    if (failOnThreshold) {
      process.exitCode = 1;
    }
  }
}

await main();
