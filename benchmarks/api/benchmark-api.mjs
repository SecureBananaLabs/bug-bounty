import autocannon from "autocannon";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { getBenchmarkEndpoints } from "./endpoints.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const resultsDir = path.join(repoRoot, "benchmarks/results");
const thresholdsPath = path.join(repoRoot, "benchmarks/thresholds.json");
const envPath = path.join(repoRoot, ".env.benchmark");

await loadEnvFile(envPath);

if (!process.env.BENCHMARK_DISABLE_RATE_LIMIT) {
  process.env.BENCHMARK_DISABLE_RATE_LIMIT = "true";
}

const isSmoke = process.env.BENCHMARK_SMOKE === "true";
const config = {
  connections: numberFromEnv(
    isSmoke ? "BENCHMARK_SMOKE_CONNECTIONS" : "BENCHMARK_CONNECTIONS",
    isSmoke ? 2 : 20
  ),
  durationSeconds: numberFromEnv(
    isSmoke ? "BENCHMARK_SMOKE_DURATION_SECONDS" : "BENCHMARK_DURATION_SECONDS",
    isSmoke ? 3 : 20
  ),
  pipelining: numberFromEnv("BENCHMARK_PIPELINING", 1),
  ttfbSamples: numberFromEnv("BENCHMARK_TTFB_SAMPLES", isSmoke ? 2 : 5),
  timeoutMs: numberFromEnv("BENCHMARK_TIMEOUT_MS", 10000),
  enforceThresholds: process.env.BENCHMARK_ENFORCE_THRESHOLDS !== "false"
};

const { baseUrl, close } = await resolveTargetUrl();
const { signAccessToken } = await import("../../apps/api/src/utils/jwt.js");
const token = signAccessToken({
  sub: "usr_benchmark",
  role: "admin",
  benchmark: true
});
const thresholds = await readJson(thresholdsPath);
const endpoints = getBenchmarkEndpoints({ token });
const results = [];

try {
  for (const endpoint of endpoints) {
    process.stdout.write(`Benchmarking ${endpoint.name}... `);
    await warmUp(baseUrl, endpoint, config.timeoutMs);
    const result = await runEndpointBenchmark(baseUrl, endpoint, config);
    const ttfb = await measureTtfb(baseUrl, endpoint, config);
    const summary = summarise(endpoint, result, ttfb, thresholds);
    results.push(summary);
    process.stdout.write(
      `${summary.latency.p99Ms.toFixed(1)}ms p99, ${summary.errorRatePercent.toFixed(2)}% errors\n`
    );
  }

  const report = {
    generatedAt: new Date().toISOString(),
    mode: isSmoke ? "smoke" : "full",
    targetUrl: baseUrl,
    config,
    environment: getEnvironment(),
    results
  };

  await fs.mkdir(resultsDir, { recursive: true });
  const stamp = report.generatedAt.replace(/[:.]/g, "-");
  const jsonPath = path.join(resultsDir, `api-benchmark-${stamp}.json`);
  const markdownPath = path.join(resultsDir, `api-benchmark-${stamp}.md`);
  await fs.writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
  await fs.writeFile(markdownPath, toMarkdown(report));

  console.log(`\nWrote JSON report: ${path.relative(repoRoot, jsonPath)}`);
  console.log(`Wrote Markdown report: ${path.relative(repoRoot, markdownPath)}`);

  const failures = results.filter((result) => !result.threshold.passed);
  if (failures.length > 0 && config.enforceThresholds) {
    console.error("\nBenchmark threshold failures:");
    for (const failure of failures) {
      console.error(`- ${failure.name}: ${failure.threshold.reason}`);
    }
    process.exitCode = 1;
  }
} finally {
  await close();
}

async function resolveTargetUrl() {
  if (process.env.BENCHMARK_TARGET_URL) {
    return {
      baseUrl: process.env.BENCHMARK_TARGET_URL.replace(/\/$/, ""),
      close: async () => {}
    };
  }

  const { createApp } = await import("../../apps/api/src/app.js");
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;

  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: async () =>
      new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      })
  };
}

async function runEndpointBenchmark(baseUrl, endpoint, runConfig) {
  return autocannon({
    url: new URL(endpoint.path, baseUrl).toString(),
    method: endpoint.method,
    headers: endpoint.headers,
    body: endpoint.body,
    connections: runConfig.connections,
    duration: runConfig.durationSeconds,
    pipelining: runConfig.pipelining,
    timeout: runConfig.timeoutMs
  });
}

async function warmUp(baseUrl, endpoint, timeoutMs) {
  await requestOnce(baseUrl, endpoint, timeoutMs).catch(() => undefined);
}

async function measureTtfb(baseUrl, endpoint, runConfig) {
  const values = [];
  for (let index = 0; index < runConfig.ttfbSamples; index += 1) {
    const start = performance.now();
    const response = await requestOnce(baseUrl, endpoint, runConfig.timeoutMs);
    values.push(performance.now() - start);
    await response.arrayBuffer().catch(() => undefined);
  }

  return {
    p50Ms: percentile(values, 50),
    p95Ms: percentile(values, 95),
    samples: values
  };
}

async function requestOnce(baseUrl, endpoint, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(new URL(endpoint.path, baseUrl), {
      method: endpoint.method,
      headers: endpoint.headers,
      body: endpoint.body,
      signal: controller.signal
    });
  } finally {
    clearTimeout(timer);
  }
}

function summarise(endpoint, result, ttfb, thresholds) {
  const totalRequests = result.requests.total || 0;
  const failedRequests = (result.errors || 0) + (result.timeouts || 0) + (result.non2xx || 0);
  const errorRatePercent = totalRequests === 0 ? 100 : (failedRequests / totalRequests) * 100;
  const endpointThreshold = thresholds.endpoints?.[endpoint.name] ?? thresholds.default;
  const latency = {
    p50Ms: Number(result.latency.p50 ?? 0),
    p95Ms: Number(result.latency.p95 ?? 0),
    p99Ms: Number(result.latency.p99 ?? 0)
  };

  return {
    name: endpoint.name,
    method: endpoint.method,
    path: endpoint.path,
    latency,
    requestsPerSecond: {
      sustained: Number(result.requests.average ?? 0),
      peak: Number(result.requests.max ?? 0)
    },
    errorRatePercent,
    errors: {
      transport: result.errors || 0,
      timeouts: result.timeouts || 0,
      non2xx: result.non2xx || 0
    },
    ttfb,
    threshold: evaluateThreshold(endpointThreshold, latency, errorRatePercent)
  };
}

function evaluateThreshold(threshold, latency, errorRatePercent) {
  if (latency.p99Ms > threshold.p99Ms) {
    return {
      passed: false,
      reason: `p99 ${latency.p99Ms.toFixed(1)}ms exceeded ${threshold.p99Ms}ms`
    };
  }

  if (errorRatePercent > threshold.errorRatePercent) {
    return {
      passed: false,
      reason: `error rate ${errorRatePercent.toFixed(2)}% exceeded ${threshold.errorRatePercent}%`
    };
  }

  return {
    passed: true,
    reason: "within threshold"
  };
}

function percentile(values, requestedPercentile) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((requestedPercentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
}

function toMarkdown(report) {
  const rows = report.results
    .map((result) =>
      [
        result.name,
        result.latency.p50Ms.toFixed(1),
        result.latency.p95Ms.toFixed(1),
        result.latency.p99Ms.toFixed(1),
        result.requestsPerSecond.sustained.toFixed(1),
        result.requestsPerSecond.peak.toFixed(1),
        result.errorRatePercent.toFixed(2),
        result.ttfb.p50Ms.toFixed(1),
        result.threshold.passed ? "pass" : `fail: ${result.threshold.reason}`
      ].join(" | ")
    )
    .map((row) => `| ${row} |`)
    .join("\n");

  return [
    "# API Benchmark Report",
    "",
    `Generated: ${report.generatedAt}`,
    `Mode: ${report.mode}`,
    `Target: ${report.targetUrl}`,
    "",
    "## Environment",
    "",
    `- OS: ${report.environment.os}`,
    `- CPU: ${report.environment.cpu}`,
    `- CPU cores: ${report.environment.cpuCores}`,
    `- Total memory: ${report.environment.totalMemoryMb} MB`,
    `- Node.js: ${report.environment.node}`,
    "",
    "## Results",
    "",
    "| Endpoint | p50 ms | p95 ms | p99 ms | Sustained RPS | Peak RPS | Error % | TTFB p50 ms | Gate |",
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |",
    rows,
    ""
  ].join("\n");
}

async function loadEnvFile(filePath) {
  const content = await fs.readFile(filePath, "utf8").catch((error) => {
    if (error.code === "ENOENT") return "";
    throw error;
  });

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const equalsIndex = line.indexOf("=");
    if (equalsIndex === -1) continue;
    const key = line.slice(0, equalsIndex).trim();
    const value = line.slice(equalsIndex + 1).trim().replace(/^["']|["']$/g, "");
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

function numberFromEnv(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function getEnvironment() {
  const [cpu] = os.cpus();
  return {
    os: `${os.type()} ${os.release()} ${os.arch()}`,
    cpu: cpu?.model ?? "unknown",
    cpuCores: os.cpus().length,
    totalMemoryMb: Math.round(os.totalmem() / 1024 / 1024),
    node: process.version
  };
}
