#!/usr/bin/env node

import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createApp } from "../apps/api/src/app.js";
import { signAccessToken } from "../apps/api/src/utils/jwt.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

const args = new Set(process.argv.slice(2));
const smoke = args.has("--smoke");
const shouldWriteResults = !args.has("--no-write-results") && (!smoke || args.has("--write-results"));

const requestCount = Number(process.env[smoke ? "BENCHMARK_SMOKE_REQUESTS" : "BENCHMARK_REQUESTS"] ?? (smoke ? 3 : 25));
const concurrency = Number(process.env[smoke ? "BENCHMARK_SMOKE_CONCURRENCY" : "BENCHMARK_CONCURRENCY"] ?? (smoke ? 1 : 4));
const resultsDir = path.resolve(repoRoot, process.env.BENCHMARK_RESULTS_DIR ?? "benchmarks/results");
const benchmarkRunId = Date.now();
const authToken = signAccessToken({ sub: "benchmark_admin", role: "admin" });

const endpoints = [
  { name: "GET /health", method: "GET", path: "/health" },
  { name: "POST /api/auth/register", method: "POST", path: "/api/auth/register", json: i => ({ email: `bench-${benchmarkRunId}-${i}@example.com`, password: "benchmark-pass", role: "client" }) },
  { name: "POST /api/auth/login", method: "POST", path: "/api/auth/login", json: i => ({ email: `login-${benchmarkRunId}-${i}@example.com`, password: "benchmark-pass" }) },
  { name: "GET /api/auth/oauth/github/callback", method: "GET", path: "/api/auth/oauth/github/callback" },
  { name: "POST /api/auth/refresh", method: "POST", path: "/api/auth/refresh" },
  { name: "GET /api/users", method: "GET", path: "/api/users" },
  { name: "POST /api/users", method: "POST", path: "/api/users", json: i => ({ email: `user-${benchmarkRunId}-${i}@example.com`, name: `Benchmark User ${i}`, role: "freelancer" }) },
  { name: "GET /api/jobs", method: "GET", path: "/api/jobs" },
  { name: "POST /api/jobs", method: "POST", path: "/api/jobs", json: i => ({ title: `Benchmark job ${i}`, description: "Benchmark job payload used by the API performance suite.", budgetMin: 100, budgetMax: 500, categoryId: "development", skills: ["node", "api"] }) },
  { name: "GET /api/proposals", method: "GET", path: "/api/proposals" },
  { name: "POST /api/proposals", method: "POST", path: "/api/proposals", json: i => ({ jobId: `job_${i}`, freelancerId: `usr_${i}`, coverLetter: "Benchmark proposal payload", amount: 250 }) },
  { name: "POST /api/payments", method: "POST", path: "/api/payments", json: i => ({ amount: 25000 + i, currency: "usd", proposalId: `prp_${i}` }) },
  { name: "GET /api/reviews", method: "GET", path: "/api/reviews" },
  { name: "POST /api/reviews", method: "POST", path: "/api/reviews", json: i => ({ reviewerId: `usr_${i}`, revieweeId: `usr_${i + 1}`, rating: 5, comment: "Benchmark review payload" }) },
  { name: "GET /api/messages", method: "GET", path: "/api/messages" },
  { name: "POST /api/messages", method: "POST", path: "/api/messages", json: i => ({ threadId: `thr_${i}`, senderId: `usr_${i}`, body: "Benchmark message payload" }) },
  { name: "GET /api/notifications", method: "GET", path: "/api/notifications" },
  { name: "POST /api/notifications", method: "POST", path: "/api/notifications", json: i => ({ userId: `usr_${i}`, type: "benchmark", message: "Benchmark notification payload" }) },
  { name: "POST /api/uploads", method: "POST", path: "/api/uploads", multipart: i => ({ fileName: `benchmark-${i}.txt`, content: `benchmark upload ${i}` }) },
  { name: "GET /api/search", method: "GET", path: "/api/search?q=developer" },
  { name: "GET /api/admin/metrics", method: "GET", path: "/api/admin/metrics", headers: { Authorization: `Bearer ${authToken}` } }
];

async function main() {
  const server = await startServerIfNeeded();
  const baseUrl = process.env.BENCHMARK_TARGET_URL ?? server.baseUrl;

  try {
    const thresholds = await readThresholds();
    const startedAt = new Date();
    const endpointResults = [];

    for (const endpoint of endpoints) {
      endpointResults.push(await benchmarkEndpoint(baseUrl, endpoint));
    }

    const finishedAt = new Date();
    const report = {
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      mode: smoke ? "smoke" : "full",
      baseUrl,
      requestCount,
      concurrency,
      endpoints: endpointResults
    };

    const failures = validateThresholds(report, thresholds);
    printSummary(report, failures);

    if (shouldWriteResults) {
      await writeResults(report, failures);
    }

    if (failures.length > 0) {
      process.exitCode = 1;
    }
  } finally {
    await server.close?.();
  }
}

async function startServerIfNeeded() {
  if (process.env.BENCHMARK_TARGET_URL) {
    return {};
  }

  process.env.NODE_ENV = "benchmark";
  const app = createApp();
  const server = http.createServer(app);

  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();

  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () => new Promise(resolve => server.close(resolve))
  };
}

async function benchmarkEndpoint(baseUrl, endpoint) {
  await sendRequest(baseUrl, endpoint, -1);

  const latencies = [];
  const ttfbs = [];
  const statuses = new Map();
  const started = performance.now();
  let cursor = 0;

  async function worker() {
    while (cursor < requestCount) {
      const requestIndex = cursor++;
      const result = await sendRequest(baseUrl, endpoint, requestIndex);
      latencies.push(result.latencyMs);
      ttfbs.push(result.ttfbMs);
      statuses.set(result.status, (statuses.get(result.status) ?? 0) + 1);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, requestCount) }, () => worker()));
  const durationSeconds = Math.max((performance.now() - started) / 1000, 0.001);
  const errors = [...statuses.entries()].reduce((sum, [status, count]) => status >= 400 ? sum + count : sum, 0);
  const sortedLatencies = latencies.toSorted((a, b) => a - b);
  const sortedTtfbs = ttfbs.toSorted((a, b) => a - b);

  return {
    name: endpoint.name,
    method: endpoint.method,
    path: endpoint.path,
    requests: latencies.length,
    p50Ms: percentile(sortedLatencies, 50),
    p95Ms: percentile(sortedLatencies, 95),
    p99Ms: percentile(sortedLatencies, 99),
    ttfbP95Ms: percentile(sortedTtfbs, 95),
    sustainedRps: round(latencies.length / durationSeconds),
    peakRps: round(1000 / Math.max(Math.min(...latencies), 1)),
    errorRatePct: round((errors / latencies.length) * 100),
    statuses: Object.fromEntries([...statuses.entries()].sort(([a], [b]) => a - b))
  };
}

async function sendRequest(baseUrl, endpoint, requestIndex) {
  const headers = { ...(endpoint.headers ?? {}) };
  const options = { method: endpoint.method, headers };

  if (endpoint.json) {
    headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(endpoint.json(requestIndex));
  }

  if (endpoint.multipart) {
    const data = endpoint.multipart(requestIndex);
    const formData = new FormData();
    formData.set("file", new Blob([data.content], { type: "text/plain" }), data.fileName);
    options.body = formData;
  }

  const started = performance.now();
  const response = await fetch(`${baseUrl}${endpoint.path}`, options);
  const firstByteAt = performance.now();
  await response.arrayBuffer();
  const completedAt = performance.now();

  return {
    status: response.status,
    ttfbMs: round(firstByteAt - started),
    latencyMs: round(completedAt - started)
  };
}

async function readThresholds() {
  const content = await fs.readFile(path.join(__dirname, "thresholds.json"), "utf8");
  return JSON.parse(content);
}

function validateThresholds(report, thresholds) {
  const failures = [];

  for (const endpoint of report.endpoints) {
    const threshold = {
      ...thresholds.defaults,
      ...(thresholds.endpoints?.[endpoint.name] ?? {})
    };

    if (endpoint.p99Ms > threshold.p99Ms) {
      failures.push(`${endpoint.name} p99 ${endpoint.p99Ms}ms exceeds ${threshold.p99Ms}ms`);
    }

    if (endpoint.errorRatePct > threshold.errorRatePct) {
      failures.push(`${endpoint.name} error rate ${endpoint.errorRatePct}% exceeds ${threshold.errorRatePct}%`);
    }
  }

  return failures;
}

async function writeResults(report, failures) {
  await fs.mkdir(resultsDir, { recursive: true });
  const stamp = report.startedAt.replaceAll(/[:.]/g, "-");
  await fs.writeFile(path.join(resultsDir, `${stamp}.json`), `${JSON.stringify({ ...report, failures }, null, 2)}\n`);
  await fs.writeFile(path.join(resultsDir, `${stamp}.md`), toMarkdown(report, failures));
}

function printSummary(report, failures) {
  console.table(report.endpoints.map(endpoint => ({
    endpoint: endpoint.name,
    p50: endpoint.p50Ms,
    p95: endpoint.p95Ms,
    p99: endpoint.p99Ms,
    ttfbP95: endpoint.ttfbP95Ms,
    rps: endpoint.sustainedRps,
    errors: endpoint.errorRatePct
  })));

  if (failures.length > 0) {
    console.error(`Threshold failures:\n- ${failures.join("\n- ")}`);
  }
}

function toMarkdown(report, failures) {
  const rows = report.endpoints.map(endpoint => (
    `| ${endpoint.name} | ${endpoint.requests} | ${endpoint.p50Ms} | ${endpoint.p95Ms} | ${endpoint.p99Ms} | ${endpoint.ttfbP95Ms} | ${endpoint.sustainedRps} | ${endpoint.errorRatePct}% |`
  ));

  return `# API Benchmark Report

- Started: ${report.startedAt}
- Finished: ${report.finishedAt}
- Mode: ${report.mode}
- Base URL: ${report.baseUrl}
- Requests per endpoint: ${report.requestCount}
- Concurrency: ${report.concurrency}

| Endpoint | Requests | p50 ms | p95 ms | p99 ms | TTFB p95 ms | Sustained RPS | Error Rate |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
${rows.join("\n")}

## Thresholds

${failures.length === 0 ? "All thresholds passed." : failures.map(failure => `- ${failure}`).join("\n")}
`;
}

function percentile(sortedValues, pct) {
  if (sortedValues.length === 0) {
    return 0;
  }

  const index = Math.ceil((pct / 100) * sortedValues.length) - 1;
  return round(sortedValues[Math.min(Math.max(index, 0), sortedValues.length - 1)]);
}

function round(value) {
  return Math.round(value * 100) / 100;
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
