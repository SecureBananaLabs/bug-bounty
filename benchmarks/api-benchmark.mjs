#!/usr/bin/env node
import fs from "node:fs";
import http from "node:http";
import https from "node:https";
import os from "node:os";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const endpointsPath = path.join(__dirname, "endpoints.json");
const thresholdsPath = path.join(__dirname, "thresholds.json");

loadEnvFile(path.join(__dirname, ".env.benchmark"));

const mode = process.env.BENCHMARK_MODE ?? "full";
const requestsPerEndpoint = Number(
  process.env.BENCHMARK_REQUESTS_PER_ENDPOINT ?? (mode === "smoke" ? 2 : 5)
);
const concurrency = Number(process.env.BENCHMARK_CONCURRENCY ?? 1);
const outputDir = path.resolve(rootDir, process.env.BENCHMARK_OUTPUT_DIR ?? "benchmarks/results");
const authSecret = process.env.BENCHMARK_AUTH_SECRET ?? "benchmark-secret";
const endpoints = JSON.parse(fs.readFileSync(endpointsPath, "utf8"));
const thresholds = JSON.parse(fs.readFileSync(thresholdsPath, "utf8"));

process.env.JWT_SECRET = authSecret;
process.env.NODE_ENV = process.env.NODE_ENV ?? "benchmark";

const { baseUrl, closeServer } = await resolveTarget();
const authToken = await createBenchmarkToken();
const startedAt = new Date();
const endpointResults = [];

for (const endpoint of endpoints) {
  endpointResults.push(await benchmarkEndpoint(endpoint, baseUrl, authToken));
}

if (closeServer) {
  await closeServer();
}

const report = {
  mode,
  startedAt: startedAt.toISOString(),
  finishedAt: new Date().toISOString(),
  target: baseUrl,
  requestsPerEndpoint,
  concurrency,
  environment: {
    node: process.version,
    platform: `${os.platform()} ${os.release()}`,
    cpu: os.cpus()[0]?.model ?? "unknown",
    logicalCores: os.cpus().length,
    totalMemoryMb: Math.round(os.totalmem() / 1024 / 1024)
  },
  results: endpointResults,
  thresholdFailures: evaluateThresholds(endpointResults)
};

fs.mkdirSync(outputDir, { recursive: true });
const jsonPath = path.join(outputDir, `api-benchmark-${mode}-latest.json`);
const mdPath = path.join(outputDir, `api-benchmark-${mode}-latest.md`);
fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
fs.writeFileSync(mdPath, renderMarkdown(report));

console.log(`Benchmark report written to ${path.relative(rootDir, jsonPath)}`);
console.log(`Benchmark summary written to ${path.relative(rootDir, mdPath)}`);
console.log(renderConsoleSummary(report));

if (report.thresholdFailures.length > 0) {
  console.error("Benchmark threshold failures:");
  for (const failure of report.thresholdFailures) {
    console.error(`- ${failure}`);
  }
  process.exitCode = 1;
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

async function resolveTarget() {
  const configured = process.env.BENCHMARK_TARGET_URL;
  if (configured) {
    return { baseUrl: configured.replace(/\/$/, ""), closeServer: null };
  }

  const { createApp } = await import("../apps/api/src/app.js");
  const app = createApp();
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const { port } = server.address();
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    closeServer: () =>
      new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      })
  };
}

async function createBenchmarkToken() {
  const { signAccessToken } = await import("../apps/api/src/utils/jwt.js");
  return signAccessToken({
    sub: process.env.BENCHMARK_AUTH_USER_ID ?? "bench_admin",
    role: process.env.BENCHMARK_AUTH_ROLE ?? "admin",
    purpose: "benchmark"
  });
}

async function benchmarkEndpoint(endpoint, baseUrl, authToken) {
  const started = performance.now();
  const metrics = [];
  let launched = 0;
  let active = 0;

  await new Promise((resolve) => {
    const launchNext = () => {
      while (active < concurrency && launched < requestsPerEndpoint) {
        launched += 1;
        active += 1;
        sendRequest(baseUrl, endpoint, authToken)
          .then((metric) => metrics.push(metric))
          .catch((error) => {
            metrics.push({
              ok: false,
              statusCode: 0,
              latencyMs: 0,
              ttfbMs: 0,
              bytes: 0,
              error: error.message
            });
          })
          .finally(() => {
            active -= 1;
            if (metrics.length >= requestsPerEndpoint) resolve();
            else launchNext();
          });
      }
    };
    launchNext();
  });

  const elapsedMs = Math.max(performance.now() - started, 1);
  const latencies = metrics.map((m) => m.latencyMs).filter((n) => n > 0).sort((a, b) => a - b);
  const ttfbs = metrics.map((m) => m.ttfbMs).filter((n) => n > 0).sort((a, b) => a - b);
  const errors = metrics.filter((m) => !m.ok);
  const count = metrics.length;
  const successCount = count - errors.length;
  const elapsedSeconds = elapsedMs / 1000;

  return {
    id: endpoint.id,
    method: endpoint.method,
    path: endpoint.path,
    description: endpoint.description,
    requests: count,
    successCount,
    errorCount: errors.length,
    errorRate: count ? round(errors.length / count) : 0,
    rpsPeak: round(count / elapsedSeconds),
    rpsSustained: round(successCount / elapsedSeconds),
    latency: percentiles(latencies),
    ttfb: percentiles(ttfbs),
    bytes: metrics.reduce((sum, metric) => sum + metric.bytes, 0),
    statuses: summarizeStatuses(metrics),
    sampleError: errors[0]?.error ?? null
  };
}

function sendRequest(baseUrl, endpoint, authToken) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint.path, baseUrl);
    const body = buildBody(endpoint);
    const headers = {
      "user-agent": "freelanceflow-api-benchmark/1.0",
      ...body.headers
    };
    if (endpoint.auth) headers.authorization = `Bearer ${authToken}`;

    const client = url.protocol === "https:" ? https : http;
    const started = performance.now();
    let ttfbMs = 0;
    const req = client.request(
      url,
      {
        method: endpoint.method,
        headers
      },
      (res) => {
        ttfbMs = performance.now() - started;
        let bytes = 0;
        res.on("data", (chunk) => {
          bytes += chunk.length;
        });
        res.on("end", () => {
          const latencyMs = performance.now() - started;
          const statusCode = res.statusCode ?? 0;
          resolve({
            ok: statusCode >= 200 && statusCode < 400,
            statusCode,
            latencyMs,
            ttfbMs,
            bytes,
            error: statusCode >= 400 ? `HTTP ${statusCode}` : null
          });
        });
      }
    );
    req.on("error", reject);
    if (body.buffer) req.write(body.buffer);
    req.end();
  });
}

function buildBody(endpoint) {
  if (endpoint.json) {
    const buffer = Buffer.from(JSON.stringify(endpoint.json));
    return {
      buffer,
      headers: {
        "content-type": "application/json",
        "content-length": String(buffer.length)
      }
    };
  }

  if (endpoint.multipart) {
    const boundary = `----freelanceflow-benchmark-${Date.now().toString(36)}`;
    const field = endpoint.multipart.field;
    const filename = endpoint.multipart.filename;
    const contentType = endpoint.multipart.contentType;
    const content = endpoint.multipart.content;
    const body = [
      `--${boundary}`,
      `Content-Disposition: form-data; name="${field}"; filename="${filename}"`,
      `Content-Type: ${contentType}`,
      "",
      content,
      `--${boundary}--`,
      ""
    ].join("\r\n");
    const buffer = Buffer.from(body);
    return {
      buffer,
      headers: {
        "content-type": `multipart/form-data; boundary=${boundary}`,
        "content-length": String(buffer.length)
      }
    };
  }

  return { buffer: null, headers: {} };
}

function percentiles(values) {
  return {
    p50Ms: round(percentile(values, 0.5)),
    p95Ms: round(percentile(values, 0.95)),
    p99Ms: round(percentile(values, 0.99))
  };
}

function percentile(values, point) {
  if (values.length === 0) return 0;
  const index = Math.min(values.length - 1, Math.ceil(values.length * point) - 1);
  return values[index];
}

function summarizeStatuses(metrics) {
  return metrics.reduce((statuses, metric) => {
    const key = String(metric.statusCode);
    statuses[key] = (statuses[key] ?? 0) + 1;
    return statuses;
  }, {});
}

function evaluateThresholds(results) {
  const failures = [];
  for (const result of results) {
    const threshold = thresholds.endpoints?.[result.id] ?? thresholds.default;
    if (result.latency.p99Ms > threshold.p99Ms) {
      failures.push(`${result.id} p99 ${result.latency.p99Ms}ms > ${threshold.p99Ms}ms`);
    }
    if (result.errorRate > threshold.errorRate) {
      failures.push(`${result.id} error rate ${result.errorRate} > ${threshold.errorRate}`);
    }
  }
  return failures;
}

function renderMarkdown(report) {
  const lines = [
    `# API Benchmark Report (${report.mode})`,
    "",
    `Generated: ${report.finishedAt}`,
    `Target: \`${report.target}\``,
    `Requests per endpoint: ${report.requestsPerEndpoint}`,
    `Concurrency: ${report.concurrency}`,
    "",
    "| Endpoint | Method | Requests | Statuses | p50 | p95 | p99 | TTFB p95 | RPS | Error Rate |",
    "| --- | --- | ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: |"
  ];
  for (const result of report.results) {
    lines.push(
      `| ${result.path} | ${result.method} | ${result.requests} | ${formatStatuses(result.statuses)} | ` +
        `${result.latency.p50Ms} | ${result.latency.p95Ms} | ${result.latency.p99Ms} | ` +
        `${result.ttfb.p95Ms} | ${result.rpsSustained} | ${result.errorRate} |`
    );
  }
  lines.push("");
  if (report.thresholdFailures.length) {
    lines.push("## Threshold Failures", "");
    for (const failure of report.thresholdFailures) lines.push(`- ${failure}`);
  } else {
    lines.push("No threshold failures.");
  }
  lines.push("");
  return `${lines.join("\n")}\n`;
}

function renderConsoleSummary(report) {
  return report.results
    .map(
      (result) =>
        `${result.method} ${result.path}: p99=${result.latency.p99Ms}ms, ` +
        `ttfb_p95=${result.ttfb.p95Ms}ms, rps=${result.rpsSustained}, errors=${result.errorCount}`
    )
    .join("\n");
}

function formatStatuses(statuses) {
  return Object.entries(statuses)
    .map(([status, count]) => `${status}:${count}`)
    .join(", ");
}

function round(value) {
  return Math.round(value * 100) / 100;
}
