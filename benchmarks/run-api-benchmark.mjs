import fs from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const isSmoke = process.argv.includes("--smoke");

await loadEnvFile(path.join(__dirname, ".env.benchmark"));

process.env.NODE_ENV = process.env.NODE_ENV ?? "benchmark";
process.env.JWT_SECRET = process.env.JWT_SECRET ?? "benchmark-secret";

const endpoints = JSON.parse(await fs.readFile(path.join(__dirname, "endpoints.json"), "utf8"));
const thresholds = JSON.parse(await fs.readFile(path.join(__dirname, "thresholds.json"), "utf8"));
const outputDir = path.resolve(repoRoot, process.env.BENCHMARK_OUTPUT_DIR ?? "benchmarks/results");
const requestsPerEndpoint = numberFromEnv(
  isSmoke ? "BENCHMARK_SMOKE_REQUESTS" : "BENCHMARK_REQUESTS",
  isSmoke ? 4 : 24
);
const concurrency = numberFromEnv(
  isSmoke ? "BENCHMARK_SMOKE_CONCURRENCY" : "BENCHMARK_CONCURRENCY",
  isSmoke ? 1 : 4
);
const warmupRequests = numberFromEnv("BENCHMARK_WARMUP_REQUESTS", isSmoke ? 0 : 2);

let server;
let baseUrl = process.env.BENCHMARK_TARGET_URL?.replace(/\/$/, "");

if (!baseUrl) {
  const { createApp } = await import("../apps/api/src/app.js");
  const app = createApp();
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
}

const { signAccessToken } = await import("../apps/api/src/utils/jwt.js");
const benchmarkToken = signAccessToken({
  sub: "benchmark-admin",
  role: "admin",
  purpose: "api-benchmark"
});

try {
  const runStartedAt = new Date();
  const results = [];

  for (const endpoint of endpoints) {
    for (let index = 0; index < warmupRequests; index += 1) {
      await runRequest(endpoint, baseUrl, benchmarkToken);
    }
    results.push(await benchmarkEndpoint(endpoint, baseUrl, benchmarkToken));
  }

  const report = {
    mode: isSmoke ? "smoke" : "full",
    target: baseUrl,
    startedAt: runStartedAt.toISOString(),
    completedAt: new Date().toISOString(),
    config: {
      requestsPerEndpoint,
      concurrency,
      warmupRequests
    },
    environment: {
      node: process.version,
      platform: `${os.type()} ${os.release()} ${os.arch()}`,
      cpu: os.cpus()?.[0]?.model ?? "unknown",
      cpuCount: os.cpus()?.length ?? 0,
      totalMemoryBytes: os.totalmem(),
      freeMemoryBytes: os.freemem()
    },
    results
  };

  await fs.mkdir(outputDir, { recursive: true });
  const suffix = isSmoke ? "smoke" : "latest";
  await fs.writeFile(
    path.join(outputDir, `${suffix}.json`),
    `${JSON.stringify(report, null, 2)}\n`
  );
  await fs.writeFile(path.join(outputDir, `${suffix}.md`), renderMarkdown(report));

  const failures = collectThresholdFailures(results, thresholds);
  if (failures.length > 0) {
    console.error("Benchmark threshold failures:");
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exitCode = 1;
  }

  console.log(renderConsoleSummary(report));
} finally {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function benchmarkEndpoint(endpoint, targetUrl, token) {
  const samples = [];
  let nextRequest = 0;
  const startedAt = performance.now();

  async function worker() {
    while (nextRequest < requestsPerEndpoint) {
      nextRequest += 1;
      samples.push(await runRequest(endpoint, targetUrl, token));
    }
  }

  await Promise.all(Array.from({ length: concurrency }, worker));
  const completedAt = performance.now();

  return summarize(endpoint, samples, completedAt - startedAt);
}

async function runRequest(endpoint, targetUrl, token) {
  const url = new URL(endpoint.path, targetUrl);
  for (const [key, value] of Object.entries(endpoint.query ?? {})) {
    url.searchParams.set(key, String(value));
  }

  const headers = {};
  let body;

  if (endpoint.authenticated) {
    headers.authorization = `Bearer ${token}`;
  }

  if (endpoint.bodyType === "multipart") {
    const formData = new FormData();
    formData.set(
      endpoint.fileField ?? "file",
      new Blob([endpoint.fileContent ?? "benchmark"], { type: "text/plain" }),
      endpoint.fileName ?? "benchmark.txt"
    );
    body = formData;
  } else if (endpoint.body !== undefined) {
    headers["content-type"] = "application/json";
    body = JSON.stringify(withUniqueValues(endpoint.body));
  }

  const startedAt = performance.now();
  let headersAt = startedAt;
  let completedAt = startedAt;
  let status = 0;
  let ok = false;
  let error = null;

  try {
    const response = await fetch(url, {
      method: endpoint.method,
      headers,
      body
    });
    headersAt = performance.now();
    await response.arrayBuffer();
    completedAt = performance.now();
    status = response.status;
    ok = response.status < 400;
  } catch (caught) {
    completedAt = performance.now();
    error = caught instanceof Error ? caught.message : String(caught);
  }

  return {
    status,
    ok,
    error,
    startedAt,
    completedAt,
    latencyMs: completedAt - startedAt,
    ttfbMs: headersAt - startedAt
  };
}

function summarize(endpoint, samples, elapsedMs) {
  const latencies = samples.map((sample) => sample.latencyMs);
  const ttfbs = samples.map((sample) => sample.ttfbMs);
  const errors = samples.filter((sample) => !sample.ok);
  const statusCounts = {};
  for (const sample of samples) {
    statusCounts[sample.status] = (statusCounts[sample.status] ?? 0) + 1;
  }

  return {
    name: endpoint.name,
    method: endpoint.method,
    path: endpoint.path,
    requests: samples.length,
    errorRatePercent: round((errors.length / samples.length) * 100),
    statusCounts,
    sustainedRps: round(samples.length / (elapsedMs / 1000)),
    peakRps: peakRps(samples),
    latencyMs: percentiles(latencies),
    ttfbMs: percentiles(ttfbs)
  };
}

function percentiles(values) {
  const sorted = values.toSorted((a, b) => a - b);
  return {
    p50: round(percentile(sorted, 50)),
    p95: round(percentile(sorted, 95)),
    p99: round(percentile(sorted, 99))
  };
}

function percentile(sorted, percentileValue) {
  if (sorted.length === 0) {
    return 0;
  }
  const index = Math.ceil((percentileValue / 100) * sorted.length) - 1;
  return sorted[Math.min(Math.max(index, 0), sorted.length - 1)];
}

function peakRps(samples) {
  const buckets = new Map();
  const firstStart = Math.min(...samples.map((sample) => sample.startedAt));
  for (const sample of samples) {
    const second = Math.floor((sample.completedAt - firstStart) / 1000);
    buckets.set(second, (buckets.get(second) ?? 0) + 1);
  }
  return Math.max(...buckets.values(), 0);
}

function collectThresholdFailures(results, config) {
  const failures = [];
  for (const result of results) {
    const endpointConfig = config.endpoints?.[result.name] ?? {};
    const p99MaxMs = endpointConfig.p99MaxMs ?? config.global.p99MaxMs;
    const errorRateMaxPercent = endpointConfig.errorRateMaxPercent ?? config.global.errorRateMaxPercent;

    if (result.latencyMs.p99 > p99MaxMs) {
      failures.push(`${result.name} p99 ${result.latencyMs.p99}ms exceeded ${p99MaxMs}ms`);
    }
    if (result.errorRatePercent > errorRateMaxPercent) {
      failures.push(`${result.name} error rate ${result.errorRatePercent}% exceeded ${errorRateMaxPercent}%`);
    }
  }
  return failures;
}

function renderMarkdown(report) {
  const rows = report.results.map((result) => [
    result.name,
    `${result.method} ${result.path}`,
    result.requests,
    result.latencyMs.p50,
    result.latencyMs.p95,
    result.latencyMs.p99,
    result.ttfbMs.p95,
    result.sustainedRps,
    result.peakRps,
    result.errorRatePercent
  ]);

  return `# API Benchmark Summary

- Mode: ${report.mode}
- Target: ${report.target}
- Started: ${report.startedAt}
- Node.js: ${report.environment.node}
- Platform: ${report.environment.platform}
- CPU: ${report.environment.cpu} (${report.environment.cpuCount} cores)
- Requests per endpoint: ${report.config.requestsPerEndpoint}
- Concurrency: ${report.config.concurrency}

| Endpoint | Route | Requests | p50 ms | p95 ms | p99 ms | p95 TTFB ms | Sustained RPS | Peak RPS | Error % |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
${rows.map((row) => `| ${row.join(" | ")} |`).join("\n")}
`;
}

function renderConsoleSummary(report) {
  const lines = [
    `API benchmark ${report.mode} run complete`,
    `Target: ${report.target}`,
    `Results: ${path.relative(repoRoot, outputDir)}`
  ];
  for (const result of report.results) {
    lines.push(
      `${result.name}: p99=${result.latencyMs.p99}ms, rps=${result.sustainedRps}, errors=${result.errorRatePercent}%`
    );
  }
  return lines.join("\n");
}

async function loadEnvFile(filePath) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
        continue;
      }
      const [key, ...valueParts] = trimmed.split("=");
      process.env[key.trim()] = process.env[key.trim()] ?? valueParts.join("=").trim();
    }
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }
}

function numberFromEnv(name, fallback) {
  const parsed = Number(process.env[name]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function round(value) {
  return Math.round(value * 100) / 100;
}

function withUniqueValues(value) {
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return JSON.parse(JSON.stringify(value).replaceAll("benchmark.", `benchmark.${suffix}.`));
}
