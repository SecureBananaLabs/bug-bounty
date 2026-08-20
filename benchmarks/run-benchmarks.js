#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import http from "node:http";
import https from "node:https";
import os from "node:os";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const benchmarkDir = path.join(repoRoot, "benchmarks");

loadEnvFile(path.join(benchmarkDir, ".env.benchmark"));

const args = new Set(process.argv.slice(2));
const mode = args.has("--smoke") || process.env.BENCHMARK_SMOKE === "true" ? "smoke" : "full";
const target = normalizeTarget(process.env.BENCHMARK_TARGET ?? "http://127.0.0.1:4000");
const concurrency = positiveInteger(
  process.env.BENCHMARK_CONCURRENCY,
  mode === "smoke" ? 1 : 4
);
const requestsPerEndpoint = positiveInteger(
  process.env.BENCHMARK_REQUESTS_PER_ENDPOINT,
  mode === "smoke" ? 2 : 8
);
const timeoutMs = positiveInteger(process.env.BENCHMARK_TIMEOUT_MS, 10000);
const resultsDir = path.resolve(
  repoRoot,
  process.env.BENCHMARK_RESULTS_DIR ?? path.join("benchmarks", "results")
);

const endpoints = JSON.parse(await fs.readFile(path.join(benchmarkDir, "endpoints.json"), "utf8"));
const thresholds = JSON.parse(await fs.readFile(path.join(benchmarkDir, "thresholds.json"), "utf8"));
const benchmarkToken = process.env.BENCHMARK_AUTH_TOKEN || createBenchmarkToken();

const report = {
  mode,
  generatedAt: new Date().toISOString(),
  target,
  concurrency,
  requestsPerEndpoint,
  environment: getEnvironment(),
  endpoints: [],
  thresholdFailures: []
};

for (const endpoint of endpoints) {
  const result = await runEndpoint(endpoint);
  const failure = checkThreshold(endpoint, result);
  if (failure) {
    report.thresholdFailures.push(failure);
  }
  report.endpoints.push({ ...result, threshold: thresholdFor(endpoint), passed: !failure });
  console.log(formatConsoleLine(endpoint, result, !failure));
}

await fs.mkdir(resultsDir, { recursive: true });
const stamp = report.generatedAt.replace(/[:.]/g, "-");
const jsonPath = path.join(resultsDir, `api-benchmark-${mode}-${stamp}.json`);
const markdownPath = path.join(resultsDir, `api-benchmark-${mode}-${stamp}.md`);
await fs.writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
await fs.writeFile(markdownPath, renderMarkdown(report));

console.log(`\nWrote ${path.relative(repoRoot, jsonPath)}`);
console.log(`Wrote ${path.relative(repoRoot, markdownPath)}`);

if (report.thresholdFailures.length > 0) {
  console.error("\nBenchmark thresholds failed:");
  for (const failure of report.thresholdFailures) {
    console.error(`- ${failure.endpoint}: ${failure.reason}`);
  }
  process.exitCode = 1;
}

async function runEndpoint(endpoint) {
  const prepared = prepareRequest(endpoint);
  const startedAt = performance.now();
  const samples = [];
  let nextRequest = 0;

  async function worker() {
    while (nextRequest < requestsPerEndpoint) {
      nextRequest += 1;
      const sample = await sendRequest(prepared);
      sample.completedAtMs = performance.now() - startedAt;
      samples.push(sample);
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, requestsPerEndpoint) },
    () => worker()
  );
  await Promise.all(workers);
  const elapsedMs = Math.max(performance.now() - startedAt, 1);
  return summarize(endpoint, samples, elapsedMs);
}

function prepareRequest(endpoint) {
  const url = new URL(endpoint.path, target);
  for (const [key, value] of Object.entries(endpoint.query ?? {})) {
    url.searchParams.set(key, String(value));
  }

  const headers = {
    "User-Agent": "freelanceflow-api-benchmark/1.0"
  };
  let body;

  if (endpoint.auth === "benchmarkToken") {
    headers.Authorization = `Bearer ${benchmarkToken}`;
  }

  if (endpoint.json) {
    body = Buffer.from(JSON.stringify(endpoint.json));
    headers["Content-Type"] = "application/json";
    headers["Content-Length"] = String(body.byteLength);
  } else if (endpoint.multipart) {
    const multipart = buildMultipart(endpoint.multipart);
    body = multipart.body;
    headers["Content-Type"] = `multipart/form-data; boundary=${multipart.boundary}`;
    headers["Content-Length"] = String(body.byteLength);
  } else if (endpoint.method !== "GET") {
    headers["Content-Length"] = "0";
  }

  return {
    body,
    headers,
    method: endpoint.method,
    url
  };
}

function sendRequest(prepared) {
  const transport = prepared.url.protocol === "https:" ? https : http;
  const startedAt = performance.now();

  return new Promise((resolve) => {
    const req = transport.request(
      prepared.url,
      {
        method: prepared.method,
        headers: prepared.headers,
        timeout: timeoutMs
      },
      (res) => {
        const ttfbMs = performance.now() - startedAt;
        let bytes = 0;

        res.on("data", (chunk) => {
          bytes += chunk.length;
        });

        res.on("end", () => {
          const latencyMs = performance.now() - startedAt;
          const ok = res.statusCode >= 200 && res.statusCode < 400;
          resolve({
            bytes,
            error: ok ? null : `HTTP ${res.statusCode}`,
            latencyMs,
            ok,
            statusCode: res.statusCode,
            ttfbMs
          });
        });
      }
    );

    req.on("timeout", () => {
      req.destroy(new Error(`request timed out after ${timeoutMs}ms`));
    });

    req.on("error", (error) => {
      resolve({
        bytes: 0,
        error: error.message,
        latencyMs: performance.now() - startedAt,
        ok: false,
        statusCode: 0,
        ttfbMs: null
      });
    });

    if (prepared.body) {
      req.write(prepared.body);
    }
    req.end();
  });
}

function summarize(endpoint, samples, elapsedMs) {
  const latencies = samples.map((sample) => sample.latencyMs);
  const ttfb = samples
    .map((sample) => sample.ttfbMs)
    .filter((value) => Number.isFinite(value));
  const errors = samples.filter((sample) => !sample.ok);
  const statuses = samples.reduce((acc, sample) => {
    const status = String(sample.statusCode);
    acc[status] = (acc[status] ?? 0) + 1;
    return acc;
  }, {});

  return {
    name: endpoint.name,
    method: endpoint.method,
    path: endpoint.path,
    coveragePath: endpoint.coveragePath ?? endpoint.path,
    description: endpoint.description,
    requests: samples.length,
    elapsedMs: round(elapsedMs),
    latencyMs: {
      p50: percentile(latencies, 50),
      p95: percentile(latencies, 95),
      p99: percentile(latencies, 99)
    },
    ttfbMs: {
      p50: percentile(ttfb, 50),
      p95: percentile(ttfb, 95),
      p99: percentile(ttfb, 99)
    },
    rps: {
      sustained: round(samples.length / (elapsedMs / 1000)),
      peak: peakRps(samples)
    },
    errorRatePercent: round((errors.length / Math.max(samples.length, 1)) * 100),
    statuses,
    errors: [...new Set(errors.map((sample) => sample.error).filter(Boolean))]
  };
}

function checkThreshold(endpoint, result) {
  const threshold = thresholdFor(endpoint);
  const endpointName = `${endpoint.method} ${endpoint.path}`;

  if (result.errorRatePercent > threshold.errorRatePercent) {
    return {
      endpoint: endpointName,
      reason: `error rate ${result.errorRatePercent}% exceeds ${threshold.errorRatePercent}%`
    };
  }

  if (result.latencyMs.p99 > threshold.p99Ms) {
    return {
      endpoint: endpointName,
      reason: `p99 ${result.latencyMs.p99}ms exceeds ${threshold.p99Ms}ms`
    };
  }

  return null;
}

function thresholdFor(endpoint) {
  const modeThresholds = thresholds[mode] ?? thresholds.full;
  const key = `${endpoint.method} ${endpoint.path}`;
  const override = modeThresholds.overrides?.[key] ?? {};
  return {
    p99Ms: override.p99Ms ?? modeThresholds.defaultP99Ms,
    errorRatePercent: override.errorRatePercent ?? modeThresholds.defaultErrorRatePercent
  };
}

function buildMultipart(file) {
  const boundary = `----freelanceflow-benchmark-${crypto.randomBytes(8).toString("hex")}`;
  const header = [
    `--${boundary}`,
    `Content-Disposition: form-data; name="${file.fieldName}"; filename="${file.filename}"`,
    `Content-Type: ${file.contentType}`,
    "",
    ""
  ].join("\r\n");
  const footer = `\r\n--${boundary}--\r\n`;
  return {
    boundary,
    body: Buffer.concat([
      Buffer.from(header),
      Buffer.from(file.content),
      Buffer.from(footer)
    ])
  };
}

function createBenchmarkToken() {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "HS256", typ: "JWT" };
  const payload = {
    sub: "benchmark_runner",
    role: "admin",
    purpose: "api-benchmark",
    iat: now,
    exp: now + 15 * 60
  };
  const unsigned = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(payload))}`;
  const secret = process.env.JWT_SECRET ?? "development-secret";
  const signature = crypto
    .createHmac("sha256", secret)
    .update(unsigned)
    .digest("base64url");
  return `${unsigned}.${signature}`;
}

function base64url(value) {
  return Buffer.from(value).toString("base64url");
}

function percentile(values, percentileRank) {
  if (values.length === 0) {
    return 0;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((percentileRank / 100) * sorted.length) - 1;
  return round(sorted[Math.max(0, Math.min(index, sorted.length - 1))]);
}

function peakRps(samples) {
  if (samples.length === 0) {
    return 0;
  }
  const buckets = new Map();
  for (const sample of samples) {
    const bucket = Math.floor(sample.completedAtMs / 1000);
    buckets.set(bucket, (buckets.get(bucket) ?? 0) + 1);
  }
  return Math.max(...buckets.values());
}

function renderMarkdown(data) {
  const lines = [
    "# API Benchmark Report",
    "",
    `Generated: ${data.generatedAt}`,
    `Mode: ${data.mode}`,
    `Target: ${data.target}`,
    `Concurrency: ${data.concurrency}`,
    `Requests per endpoint: ${data.requestsPerEndpoint}`,
    "",
    "## Environment",
    "",
    `- Node.js: ${data.environment.node}`,
    `- OS: ${data.environment.platform} ${data.environment.release} (${data.environment.arch})`,
    `- CPU: ${data.environment.cpuModel} x ${data.environment.cpuCount}`,
    `- RAM: ${data.environment.totalMemoryGb} GB total, ${data.environment.freeMemoryGb} GB free at start`,
    "",
    "## Results",
    "",
    "| Method | Path | Requests | p50 ms | p95 ms | p99 ms | TTFB p95 ms | Sustained RPS | Peak RPS | Error % | Status |",
    "| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |"
  ];

  for (const endpoint of data.endpoints) {
    lines.push([
      endpoint.method,
      endpoint.path,
      endpoint.requests,
      endpoint.latencyMs.p50,
      endpoint.latencyMs.p95,
      endpoint.latencyMs.p99,
      endpoint.ttfbMs.p95,
      endpoint.rps.sustained,
      endpoint.rps.peak,
      endpoint.errorRatePercent,
      endpoint.passed ? "pass" : "fail"
    ].join(" | ").replace(/^/, "| ").replace(/$/, " |"));
  }

  lines.push("", "## Thresholds", "");
  if (data.thresholdFailures.length === 0) {
    lines.push("All configured thresholds passed.");
  } else {
    for (const failure of data.thresholdFailures) {
      lines.push(`- ${failure.endpoint}: ${failure.reason}`);
    }
  }

  return `${lines.join("\n")}\n`;
}

function formatConsoleLine(endpoint, result, passed) {
  const status = passed ? "PASS" : "FAIL";
  return [
    status.padEnd(4),
    endpoint.method.padEnd(4),
    endpoint.path.padEnd(34),
    `p99=${String(result.latencyMs.p99).padStart(6)}ms`,
    `rps=${String(result.rps.sustained).padStart(6)}`,
    `err=${result.errorRatePercent}%`
  ].join(" ");
}

function getEnvironment() {
  const cpus = os.cpus();
  return {
    arch: os.arch(),
    cpuCount: cpus.length,
    cpuModel: cpus[0]?.model ?? "unknown",
    freeMemoryGb: round(os.freemem() / 1024 / 1024 / 1024),
    node: process.version,
    platform: os.platform(),
    release: os.release(),
    totalMemoryGb: round(os.totalmem() / 1024 / 1024 / 1024)
  };
}

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return;
  }

  const contents = readFileSync(filePath, "utf8");
  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const separator = trimmed.indexOf("=");
    if (separator === -1) {
      continue;
    }
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function normalizeTarget(value) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function positiveInteger(value, fallback) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function round(value) {
  return Math.round(value * 100) / 100;
}
