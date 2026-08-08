import autocannon from "autocannon";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import http from "node:http";
import https from "node:https";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { endpoints } from "./endpoints.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const resultsDir = path.join(__dirname, "results");
const thresholdsPath = path.join(__dirname, "thresholds.json");

function loadEnvFile() {
  return fs
    .readFile(path.join(__dirname, ".env.benchmark"), "utf8")
    .then((content) => {
      for (const line of content.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
        const [key, ...valueParts] = trimmed.split("=");
        process.env[key.trim()] ??= valueParts.join("=").trim();
      }
    })
    .catch(() => {});
}

function base64url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function createBenchmarkToken() {
  if (process.env.BENCHMARK_AUTH_TOKEN) {
    return process.env.BENCHMARK_AUTH_TOKEN;
  }

  const secret = process.env.JWT_SECRET || "development-secret";
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "HS256", typ: "JWT" };
  const payload = {
    sub: "benchmark-admin",
    role: "admin",
    iat: now,
    exp: now + 15 * 60
  };
  const unsigned = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(payload))}`;
  const signature = crypto.createHmac("sha256", secret).update(unsigned).digest("base64url");
  return `${unsigned}.${signature}`;
}

function normalizeBaseUrl(url) {
  return url.replace(/\/+$/, "");
}

function endpointHeaders(endpoint, token) {
  const headers = { ...(endpoint.headers || {}) };
  if (endpoint.json) {
    headers["content-type"] = "application/json";
  }
  if (endpoint.auth) {
    headers.authorization = `Bearer ${token}`;
  }
  return headers;
}

function endpointBody(endpoint) {
  if (endpoint.json) {
    return JSON.stringify(endpoint.json);
  }
  return endpoint.body;
}

async function measureTtfb(url, endpoint, headers, body) {
  return new Promise((resolve) => {
    const target = new URL(url);
    const startedAt = process.hrtime.bigint();
    const client = target.protocol === "https:" ? https : http;
    const request = client.request(
      target,
      {
        method: endpoint.method,
        headers
      },
      (response) => {
        const firstByteAt = process.hrtime.bigint();
        response.resume();
        response.on("end", () => {
          resolve(Number(firstByteAt - startedAt) / 1_000_000);
        });
      }
    );
    request.on("error", () => resolve(null));
    if (body) request.write(body);
    request.end();
  });
}

function summarizeAutocannon(endpoint, result, ttfbMs, thresholds) {
  const requests = result.requests || {};
  const latency = result.latency || {};
  const statusErrors = Object.entries(result.statusCodeStats || {}).reduce(
    (sum, [status, stats]) => (Number(status) >= 400 ? sum + stats.count : sum),
    0
  );
  const totalRequests = result.requests?.total || 0;
  const totalErrors = (result.errors || 0) + (result.timeouts || 0) + statusErrors;
  const errorRate = totalRequests === 0 ? 100 : (totalErrors / totalRequests) * 100;
  const threshold = thresholds[endpoint.name] || thresholds.default;

  return {
    name: endpoint.name,
    method: endpoint.method,
    path: endpoint.path,
    p50LatencyMs: latency.p50 ?? latency.average ?? 0,
    p95LatencyMs: latency.p95 ?? latency.average ?? 0,
    p99LatencyMs: latency.p99 ?? latency.max ?? 0,
    sustainedRps: requests.average ?? 0,
    peakRps: requests.max ?? requests.average ?? 0,
    errorRatePercent: Number(errorRate.toFixed(3)),
    ttfbMs: ttfbMs === null ? null : Number(ttfbMs.toFixed(3)),
    totalRequests,
    statusCodeStats: result.statusCodeStats || {},
    threshold,
    passed:
      (latency.p99 ?? latency.max ?? 0) <= threshold.p99LatencyMs &&
      errorRate <= threshold.errorRatePercent
  };
}

function markdownReport(results, config, generatedAt) {
  const rows = results
    .map(
      (result) =>
        `| ${result.name} | ${result.method} ${result.path} | ${result.p50LatencyMs} | ${result.p95LatencyMs} | ${result.p99LatencyMs} | ${result.sustainedRps} | ${result.peakRps} | ${result.errorRatePercent}% | ${result.ttfbMs ?? "n/a"} | ${result.passed ? "pass" : "fail"} |`
    )
    .join("\n");
  const failures = results.filter((result) => !result.passed);

  return `# API Benchmark Summary

Generated: ${generatedAt}

Target: ${config.baseUrl}
Mode: ${config.smoke ? "smoke" : "full"}
Duration per endpoint: ${config.duration}s
Connections: ${config.connections}
Endpoints covered: ${results.length}

| Endpoint | Route | p50 ms | p95 ms | p99 ms | sustained RPS | peak RPS | error rate | TTFB ms | gate |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
${rows}

${failures.length ? `## Threshold Failures\n\n${failures.map((result) => `- ${result.name}: p99 ${result.p99LatencyMs}ms / max ${result.threshold.p99LatencyMs}ms, error rate ${result.errorRatePercent}% / max ${result.threshold.errorRatePercent}%`).join("\n")}\n` : "## Threshold Failures\n\nNone.\n"}

## Benchmark Environment

- CPU model and core count: ${os.cpus()[0]?.model || "unknown"}; ${os.cpus().length} logical cores
- RAM: ${Math.round(os.totalmem() / 1024 / 1024 / 1024)} GB total
- OS: ${os.type()} ${os.release()} ${os.arch()}
- Node.js: ${process.version}
- Network: loopback or configured target host
`;
}

async function main() {
  await loadEnvFile();
  const smoke = process.argv.includes("--smoke");
  const baseUrl = normalizeBaseUrl(process.env.BENCHMARK_BASE_URL || "http://127.0.0.1:4000");
  const connections = Number(process.env.BENCHMARK_CONNECTIONS || (smoke ? 1 : 10));
  const duration = Number(process.env.BENCHMARK_DURATION_SECONDS || (smoke ? 2 : 10));
  const amount = smoke ? Number(process.env.BENCHMARK_SMOKE_REQUESTS || 5) : undefined;
  const token = createBenchmarkToken();
  const thresholds = JSON.parse(await fs.readFile(thresholdsPath, "utf8"));
  const results = [];

  for (const endpoint of endpoints) {
    const url = `${baseUrl}${endpoint.path}`;
    const headers = endpointHeaders(endpoint, token);
    const body = endpointBody(endpoint);
    const ttfbMs = await measureTtfb(url, endpoint, headers, body);
    const result = await autocannon({
      url,
      method: endpoint.method,
      headers,
      body,
      connections,
      duration,
      amount
    });
    results.push(summarizeAutocannon(endpoint, result, ttfbMs, thresholds));
  }

  await fs.mkdir(resultsDir, { recursive: true });
  const generatedAt = new Date().toISOString();
  const stamp = generatedAt.replace(/[:.]/g, "-");
  const payload = {
    generatedAt,
    config: { baseUrl, smoke, duration, connections, amount },
    results
  };
  await fs.writeFile(path.join(resultsDir, `benchmark-${stamp}.json`), JSON.stringify(payload, null, 2));
  await fs.writeFile(
    path.join(resultsDir, `benchmark-${stamp}.md`),
    markdownReport(results, payload.config, generatedAt)
  );
  await fs.writeFile(path.join(resultsDir, "latest.json"), JSON.stringify(payload, null, 2));
  await fs.writeFile(path.join(resultsDir, "latest.md"), markdownReport(results, payload.config, generatedAt));

  const failed = results.filter((result) => !result.passed);
  if (failed.length > 0) {
    console.error(`Benchmark threshold failed for: ${failed.map((result) => result.name).join(", ")}`);
    process.exitCode = 1;
  } else {
    console.log(`Benchmarked ${results.length} endpoints successfully. Results written to ${resultsDir}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
