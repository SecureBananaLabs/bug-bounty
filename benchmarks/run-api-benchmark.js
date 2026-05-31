import { existsSync, readFileSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { performance } from "node:perf_hooks";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");
const args = new Set(process.argv.slice(2));
const smokeMode = args.has("--smoke");
const checkThresholds = args.has("--check-thresholds");

loadBenchmarkEnv();

if (!process.env.BENCHMARK_TARGET_URL && !process.env.NODE_ENV) {
  process.env.NODE_ENV = "benchmark";
}

const { signAccessToken } = await import("../apps/api/src/utils/jwt.js");
const endpoints = JSON.parse(await readFile(join(__dirname, "endpoints.json"), "utf8"));
const thresholds = JSON.parse(await readFile(join(__dirname, "thresholds.json"), "utf8"));
const startedAt = new Date();
const durationMs = numberFromEnv("BENCHMARK_DURATION_MS", smokeMode ? 500 : 3000);
const concurrency = numberFromEnv("BENCHMARK_CONCURRENCY", smokeMode ? 1 : 4);
const resultsDir = resolve(rootDir, process.env.BENCHMARK_RESULTS_DIR ?? "benchmarks/results");
const token = signAccessToken({ sub: "benchmark-user", role: "admin" });

let server;
let baseUrl = process.env.BENCHMARK_TARGET_URL;

if (!baseUrl) {
  ({ server, baseUrl } = await startLocalApi());
}

try {
  const endpointResults = [];

  for (const endpoint of endpoints) {
    endpointResults.push(await benchmarkEndpoint(endpoint, baseUrl, token));
  }

  const report = {
    started_at: startedAt.toISOString(),
    base_url: baseUrl,
    mode: smokeMode ? "smoke" : "full",
    duration_ms: durationMs,
    concurrency,
    endpoint_count: endpoints.length,
    results: endpointResults
  };

  await writeReports(report);

  if (checkThresholds) {
    enforceThresholds(endpointResults);
  }

  printSummary(endpointResults);
} finally {
  if (server) {
    await new Promise((resolveClose, rejectClose) => {
      server.close((error) => (error ? rejectClose(error) : resolveClose()));
    });
  }
}

function loadBenchmarkEnv() {
  const envPath = join(rootDir, ".env.benchmark");
  if (!existsSync(envPath)) {
    return;
  }

  const content = existsSync(envPath) ? requireEnvFile(envPath) : "";
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }

    const [key, ...valueParts] = trimmed.split("=");
    if (!process.env[key]) {
      process.env[key] = valueParts.join("=").trim();
    }
  }
}

function requireEnvFile(envPath) {
  return existsSync(envPath) ? readFileSync(envPath, "utf8") : "";
}

function numberFromEnv(name, fallback) {
  const parsed = Number(process.env[name]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

async function startLocalApi() {
  const { createApp } = await import("../apps/api/src/app.js");
  const app = createApp();
  const localServer = await new Promise((resolveListen, rejectListen) => {
    const instance = app.listen(0, "127.0.0.1", () => resolveListen(instance));
    instance.on("error", rejectListen);
  });
  const { port } = localServer.address();

  return {
    server: localServer,
    baseUrl: `http://127.0.0.1:${port}`
  };
}

async function benchmarkEndpoint(endpoint, targetUrl, authToken) {
  const latencies = [];
  const ttfbs = [];
  const statusCounts = {};
  const bucketCounts = new Map();
  const start = performance.now();
  const deadline = start + durationMs;
  let completed = 0;
  let errors = 0;

  await Promise.all(Array.from({ length: concurrency }, async () => {
    while (performance.now() < deadline) {
      const result = await runRequest(endpoint, targetUrl, authToken);
      const bucket = Math.floor((performance.now() - start) / 1000);
      bucketCounts.set(bucket, (bucketCounts.get(bucket) ?? 0) + 1);
      completed += 1;
      errors += result.ok ? 0 : 1;
      latencies.push(result.latencyMs);
      ttfbs.push(result.ttfbMs);
      statusCounts[result.status] = (statusCounts[result.status] ?? 0) + 1;
    }
  }));

  const elapsedSeconds = Math.max((performance.now() - start) / 1000, 0.001);

  return {
    name: endpoint.name,
    method: endpoint.method,
    path: endpoint.path,
    requests: completed,
    rps_sustained: round(completed / elapsedSeconds, 2),
    rps_peak: Math.max(...bucketCounts.values(), 0),
    error_rate_percent: round((errors / Math.max(completed, 1)) * 100, 2),
    latency_ms: {
      p50: percentile(latencies, 50),
      p95: percentile(latencies, 95),
      p99: percentile(latencies, 99)
    },
    ttfb_ms: {
      p50: percentile(ttfbs, 50),
      p95: percentile(ttfbs, 95),
      p99: percentile(ttfbs, 99)
    },
    statuses: statusCounts
  };
}

async function runRequest(endpoint, targetUrl, authToken) {
  const url = new URL(endpoint.path, targetUrl);
  const headers = {};
  const init = {
    method: endpoint.method,
    headers
  };

  if (endpoint.auth) {
    headers.authorization = `Bearer ${authToken}`;
  }

  if (endpoint.bodyType === "json") {
    headers["content-type"] = "application/json";
    init.body = JSON.stringify(endpoint.body ?? {});
  } else if (endpoint.bodyType === "multipart-file") {
    const form = new FormData();
    const file = endpoint.file;
    form.append(
      file.field,
      new Blob([file.content], { type: file.contentType }),
      file.filename
    );
    init.body = form;
  }

  const started = performance.now();
  let response;

  try {
    response = await fetch(url, init);
    const ttfbMs = performance.now() - started;
    await response.arrayBuffer();
    const latencyMs = performance.now() - started;
    const ok = isExpectedStatus(endpoint, response.status);

    return {
      status: response.status,
      ok,
      ttfbMs,
      latencyMs
    };
  } catch {
    const elapsed = performance.now() - started;
    return {
      status: "request-error",
      ok: false,
      ttfbMs: elapsed,
      latencyMs: elapsed
    };
  }
}

function isExpectedStatus(endpoint, status) {
  const min = endpoint.expectedStatusMin ?? 200;
  const max = endpoint.expectedStatusMax ?? 399;
  return status >= min && status <= max;
}

async function writeReports(report) {
  await mkdir(resultsDir, { recursive: true });
  const stamp = report.started_at.replace(/[:.]/g, "-");
  const jsonPath = join(resultsDir, `${stamp}.json`);
  const markdownPath = join(resultsDir, `${stamp}.md`);

  await writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
  await writeFile(markdownPath, renderMarkdown(report));
}

function renderMarkdown(report) {
  const lines = [
    "# API Benchmark Summary",
    "",
    `- Started: ${report.started_at}`,
    `- Target: ${report.base_url}`,
    `- Mode: ${report.mode}`,
    `- Duration per endpoint: ${report.duration_ms}ms`,
    `- Concurrency: ${report.concurrency}`,
    "",
    "| Endpoint | Method | Requests | Sustained RPS | Peak RPS | Error % | p50 ms | p95 ms | p99 ms | TTFB p99 ms |",
    "| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |"
  ];

  for (const result of report.results) {
    lines.push([
      `| ${result.name}`,
      result.method,
      result.requests,
      result.rps_sustained,
      result.rps_peak,
      result.error_rate_percent,
      result.latency_ms.p50,
      result.latency_ms.p95,
      result.latency_ms.p99,
      `${result.ttfb_ms.p99} |`
    ].join(" | "));
  }

  lines.push("");
  return lines.join("\n");
}

function enforceThresholds(results) {
  const failures = [];

  for (const result of results) {
    const endpointThreshold = thresholds.endpoints?.[result.name] ?? {};
    const p99Limit = endpointThreshold.p99_ms ?? thresholds.defaults.p99_ms;
    const errorLimit = endpointThreshold.error_rate_percent ?? thresholds.defaults.error_rate_percent;

    if (result.latency_ms.p99 > p99Limit) {
      failures.push(`${result.name} p99 ${result.latency_ms.p99}ms exceeds ${p99Limit}ms`);
    }

    if (result.error_rate_percent > errorLimit) {
      failures.push(`${result.name} error rate ${result.error_rate_percent}% exceeds ${errorLimit}%`);
    }
  }

  if (failures.length > 0) {
    throw new Error(`Benchmark thresholds failed:\n${failures.join("\n")}`);
  }
}

function printSummary(results) {
  for (const result of results) {
    console.log(
      `${result.method} ${result.path} ` +
      `p99=${result.latency_ms.p99}ms ` +
      `rps=${result.rps_sustained} ` +
      `errors=${result.error_rate_percent}%`
    );
  }
}

function percentile(values, target) {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((target / 100) * sorted.length) - 1);
  return round(sorted[index], 2);
}

function round(value, decimals) {
  return Number(value.toFixed(decimals));
}
