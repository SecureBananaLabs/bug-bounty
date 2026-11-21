import { createServer } from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";

import { createApp } from "../apps/api/src/app.js";
import { endpoints, endpointKey } from "./endpoints.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const resultsDir = path.join(__dirname, "results");

function createConfig() {
  return {
    targetUrl: process.env.BENCHMARK_TARGET_URL,
    token: process.env.BENCHMARK_TOKEN,
    durationSeconds: Number(process.env.BENCHMARK_DURATION_SECONDS ?? 10),
    concurrency: Number(process.env.BENCHMARK_CONCURRENCY ?? 8),
    warmupRequests: Number(process.env.BENCHMARK_WARMUP_REQUESTS ?? 2),
    outputDir: process.env.BENCHMARK_OUTPUT_DIR ?? resultsDir,
    thresholdsPath: process.env.BENCHMARK_THRESHOLDS_PATH ?? path.join(__dirname, "thresholds.json"),
    smoke: process.env.BENCHMARK_SMOKE === "true"
  };
}

let config = createConfig();

function loadEnvFile() {
  const envPath = path.join(repoRoot, ".env.benchmark");
  if (!existsSync(envPath)) {
    return;
  }

  const raw = readFileSync(envPath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }
    const [key, ...valueParts] = trimmed.split("=");
    if (!process.env[key]) {
      process.env[key] = valueParts.join("=").replace(/^['\"]|['\"]$/g, "");
    }
  }
}

async function startLocalServer() {
  process.env.NODE_ENV = process.env.NODE_ENV ?? "benchmark";
  process.env.RATE_LIMIT_MAX = process.env.RATE_LIMIT_MAX ?? "10000000";

  const app = createApp();
  const server = createServer(app);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
    server.listen(0, "127.0.0.1");
  });

  const { port } = server.address();
  return {
    targetUrl: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())))
  };
}

async function getBenchmarkToken(targetUrl) {
  if (config.token) {
    return config.token;
  }

  const response = await fetch(new URL("/api/auth/login", targetUrl), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "bench.client@example.com", password: "benchmark-password" })
  });

  if (!response.ok) {
    throw new Error(`Unable to create benchmark token: ${response.status} ${await response.text()}`);
  }

  const payload = await response.json();
  return payload.data.token;
}

function makeRequestOptions(endpoint, token) {
  const headers = {};
  const options = { method: endpoint.method, headers };

  if (endpoint.auth) {
    headers.authorization = `Bearer ${token}`;
  }

  if (endpoint.body) {
    headers["content-type"] = "application/json";
    options.body = JSON.stringify(endpoint.body());
  }

  if (endpoint.multipart) {
    const payload = endpoint.multipart();
    const form = new FormData();
    const file = new Blob([payload.content], { type: payload.type });
    form.append(payload.fieldName, file, payload.filename);
    options.body = form;
  }

  return options;
}

async function timedFetch(targetUrl, endpoint, token) {
  const url = new URL(endpoint.path, targetUrl);
  const startedAt = performance.now();
  let response;
  let ttfbMs;
  try {
    response = await fetch(url, makeRequestOptions(endpoint, token));
    ttfbMs = performance.now() - startedAt;
    await response.arrayBuffer();
    const latencyMs = performance.now() - startedAt;
    return {
      ok: response.ok,
      status: response.status,
      latencyMs,
      ttfbMs,
      completedAt: Date.now()
    };
  } catch (error) {
    const latencyMs = performance.now() - startedAt;
    return {
      ok: false,
      status: 0,
      latencyMs,
      ttfbMs: latencyMs,
      error: error.message,
      completedAt: Date.now()
    };
  }
}

function percentile(values, p) {
  if (values.length === 0) {
    return 0;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[index];
}

function round(value, digits = 2) {
  return Number(value.toFixed(digits));
}

async function warmupEndpoint(targetUrl, endpoint, token) {
  for (let i = 0; i < config.warmupRequests; i += 1) {
    await timedFetch(targetUrl, endpoint, token);
  }
}

async function runEndpointBenchmark(targetUrl, endpoint, token) {
  await warmupEndpoint(targetUrl, endpoint, token);

  const deadline = performance.now() + config.durationSeconds * 1000;
  const startedAt = performance.now();
  const results = [];

  async function worker() {
    while (performance.now() < deadline) {
      results.push(await timedFetch(targetUrl, endpoint, token));
    }
  }

  await Promise.all(Array.from({ length: config.concurrency }, () => worker()));
  const durationMs = performance.now() - startedAt;
  const latencies = results.map((result) => result.latencyMs);
  const ttfb = results.map((result) => result.ttfbMs);
  const errors = results.filter((result) => !result.ok);
  const bucketCounts = new Map();
  for (const result of results) {
    const bucket = Math.floor(result.completedAt / 1000);
    bucketCounts.set(bucket, (bucketCounts.get(bucket) ?? 0) + 1);
  }

  return {
    key: endpointKey(endpoint),
    name: endpoint.name,
    method: endpoint.method,
    path: endpoint.path,
    requests: results.length,
    errors: errors.length,
    errorRatePercent: round((errors.length / Math.max(results.length, 1)) * 100),
    statusCodes: results.reduce((acc, result) => {
      acc[result.status] = (acc[result.status] ?? 0) + 1;
      return acc;
    }, {}),
    latencyMs: {
      p50: round(percentile(latencies, 50)),
      p95: round(percentile(latencies, 95)),
      p99: round(percentile(latencies, 99)),
      min: round(Math.min(...latencies)),
      max: round(Math.max(...latencies))
    },
    ttfbMs: {
      p50: round(percentile(ttfb, 50)),
      p95: round(percentile(ttfb, 95)),
      p99: round(percentile(ttfb, 99))
    },
    rps: {
      sustained: round(results.length / (durationMs / 1000)),
      peak: Math.max(0, ...bucketCounts.values())
    }
  };
}

async function readThresholds() {
  const raw = await readFile(config.thresholdsPath, "utf8");
  return JSON.parse(raw);
}

function thresholdFor(thresholds, result) {
  return {
    ...thresholds.default,
    ...(thresholds.endpoints?.[result.key] ?? {})
  };
}

function evaluateThresholds(thresholds, results) {
  return results.map((result) => {
    const threshold = thresholdFor(thresholds, result);
    const failures = [];
    if (result.latencyMs.p99 > threshold.p99Ms) {
      failures.push(`p99 ${result.latencyMs.p99}ms > ${threshold.p99Ms}ms`);
    }
    if (result.errorRatePercent > threshold.errorRatePercent) {
      failures.push(`error rate ${result.errorRatePercent}% > ${threshold.errorRatePercent}%`);
    }
    return { ...result, threshold, passed: failures.length === 0, failures };
  });
}

function markdownReport(report) {
  const lines = [
    "# API Benchmark Summary",
    "",
    `Generated: ${report.generatedAt}`,
    `Target: ${report.targetUrl}`,
    `Mode: ${report.config.smoke ? "CI smoke" : "full"}`,
    `Concurrency: ${report.config.concurrency}`,
    `Duration per endpoint: ${report.config.durationSeconds}s`,
    "",
    "## Results",
    "",
    "| Endpoint | Requests | p50 | p95 | p99 | TTFB p95 | Sustained RPS | Peak RPS | Error Rate | Gate |",
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |"
  ];

  for (const result of report.results) {
    lines.push([
      `\`${result.key}\``,
      result.requests,
      `${result.latencyMs.p50}ms`,
      `${result.latencyMs.p95}ms`,
      `${result.latencyMs.p99}ms`,
      `${result.ttfbMs.p95}ms`,
      result.rps.sustained,
      result.rps.peak,
      `${result.errorRatePercent}%`,
      result.passed ? "✅ pass" : `❌ ${result.failures.join("; ")}`
    ].join(" | "));
  }

  const failed = report.results.filter((result) => !result.passed);
  lines.push("", "## Gate", "", failed.length === 0 ? "All thresholds passed." : `${failed.length} endpoint(s) failed thresholds.`);
  return `${lines.join("\n")}\n`;
}

async function main() {
  loadEnvFile();
  config = createConfig();

  let localServer;
  let targetUrl = process.env.BENCHMARK_TARGET_URL ?? config.targetUrl;
  if (!targetUrl) {
    localServer = await startLocalServer();
    targetUrl = localServer.targetUrl;
  }

  const token = await getBenchmarkToken(targetUrl);
  const thresholds = await readThresholds();
  const results = [];

  try {
    for (const endpoint of endpoints) {
      process.stdout.write(`Benchmarking ${endpointKey(endpoint)} ... `);
      const result = await runEndpointBenchmark(targetUrl, endpoint, token);
      results.push(result);
      console.log(`${result.requests} requests, p99 ${result.latencyMs.p99}ms, errors ${result.errorRatePercent}%`);
    }
  } finally {
    if (localServer) {
      await localServer.close();
    }
  }

  const evaluated = evaluateThresholds(thresholds, results);
  const report = {
    generatedAt: new Date().toISOString(),
    targetUrl,
    config: {
      concurrency: config.concurrency,
      durationSeconds: config.durationSeconds,
      warmupRequests: config.warmupRequests,
      smoke: config.smoke
    },
    results: evaluated
  };

  await mkdir(config.outputDir, { recursive: true });
  const jsonPath = path.join(config.outputDir, "benchmark-results.json");
  const mdPath = path.join(config.outputDir, "benchmark-summary.md");
  await writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
  await writeFile(mdPath, markdownReport(report));

  console.log(`\nWrote ${jsonPath}`);
  console.log(`Wrote ${mdPath}`);

  const failed = evaluated.filter((result) => !result.passed);
  if (failed.length > 0) {
    console.error("\nBenchmark threshold failures:");
    for (const result of failed) {
      console.error(`- ${result.key}: ${result.failures.join("; ")}`);
    }
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
