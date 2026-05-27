/**
 * FreelanceFlow API Benchmark Suite
 * Measures: p50/p95/p99 latency, RPS, error rate, TTFB
 * 
 * Usage: node benchmarks/api-benchmark.js
 * Environment: Set BASE_URL (default: http://localhost:3001)
 *              Set BENCHMARK_TOKEN for auth-protected routes
 */

import http from "http";
import https from "https";
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const RESULTS_DIR = join(__dirname, "results");

const BASE_URL = process.env.BASE_URL || "http://localhost:3001";
const BENCHMARK_TOKEN = process.env.BENCHMARK_TOKEN || "";
const CONCURRENCY = parseInt(process.env.CONCURRENCY) || 10;
const DURATION_MS = parseInt(process.env.DURATION_MS) || 5000;
const WARMUP_REQUESTS = 5;

const TARGET_HOST = new URL(BASE_URL).host;
const USE_HTTPS = BASE_URL.startsWith("https://");
const HTTP_CLIENT = USE_HTTPS ? https : http;

// ---------- Helper: single HTTP request ----------
function makeRequest(method, path, body = null, token = "") {
  return new Promise((resolve) => {
    const start = Date.now();
    const options = {
      hostname: TARGET_HOST.split(":")[0],
      port: TARGET_HOST.includes(":") ? TARGET_HOST.split(":")[1] : (USE_HTTPS ? 443 : 80),
      path,
      method,
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "FreelanceFlow-Benchmark/1.0",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    };

    const req = HTTP_CLIENT.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        const ttfb = Date.now() - start;
        const latency = Date.now() - start;
        resolve({
          status: res.statusCode,
          ttfb,
          latency,
          error: null,
          body: data,
        });
      });
    });

    req.on("error", (err) => {
      resolve({ status: 0, ttfb: 0, latency: 0, error: err.code || err.message });
    });

    req.setTimeout(10000, () => {
      req.destroy();
      resolve({ status: 0, ttfb: 0, latency: 0, error: "TIMEOUT" });
    });

    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// ---------- Helper: run concurrent requests ----------
async function runConcurrent(endpoint, method, body, token, count) {
  const promises = Array.from({ length: count }, () =>
    makeRequest(method, endpoint, body, token)
  );
  return Promise.all(promises);
}

// ---------- Helper: compute stats ----------
function computeStats(results) {
  const latencies = results.map((r) => r.latency).filter((l) => l > 0);
  const errors = results.filter((r) => r.status === 0 || r.status >= 400);
  const successes = results.filter((r) => r.status >= 200 && r.status < 400);

  if (latencies.length === 0) {
    return { p50: 0, p95: 0, p99: 0, rps: 0, errorRate: 100, ttfbAvg: 0 };
  }

  latencies.sort((a, b) => a - b);
  const totalTime = Math.max(...latencies) - Math.min(...latencies);

  const percentile = (arr, p) => {
    const idx = Math.ceil((p / 100) * arr.length) - 1;
    return arr[Math.max(0, idx)];
  };

  const rps = (latencies.length / (totalTime || 1)) * 1000;
  const ttfbAvg =
    successes.reduce((sum, r) => sum + r.ttfb, 0) / (successes.length || 1);

  return {
    p50: percentile(latencies, 50),
    p95: percentile(latencies, 95),
    p99: percentile(latencies, 99),
    rps: Math.round(rps * 10) / 10,
    errorRate: Math.round((errors.length / results.length) * 10000) / 100,
    ttfbAvg: Math.round(ttfbAvg),
  };
}

// ---------- Endpoint definitions ----------
const ENDPOINTS = [
  // Public endpoints
  { path: "/health", method: "GET", auth: false, body: null, label: "Health check" },
  { path: "/api/auth/register", method: "POST", auth: false, label: "Auth - Register", body: { email: `bench_${Date.now()}@test.com`, password: "TestPass123", role: "client" } },
  { path: "/api/auth/login", method: "POST", auth: false, label: "Auth - Login", body: { email: "test@test.com", password: "TestPass123" } },
  { path: "/api/jobs", method: "GET", auth: false, label: "Jobs - List" },
  { path: "/api/users", method: "GET", auth: false, label: "Users - List" },
  { path: "/api/reviews", method: "GET", auth: false, label: "Reviews - List" },
  { path: "/api/notifications", method: "GET", auth: false, label: "Notifications - List" },
  { path: "/api/proposals", method: "GET", auth: false, label: "Proposals - List" },
  { path: "/api/messages", method: "GET", auth: false, label: "Messages - List" },
  { path: "/api/search", method: "POST", auth: false, label: "Search - Query", body: { query: "react developer" } },
  // Auth-protected (need token)
  { path: "/api/jobs", method: "POST", auth: true, label: "Jobs - Create", body: { title: "Benchmark Test Job", description: "Created by automated benchmark suite", budgetMin: 100, budgetMax: 500, categoryId: "cat_1", skills: ["testing"] } },
  { path: "/api/payments", method: "POST", auth: true, label: "Payments - Create", body: { amount: 100, currency: "usd", jobId: "job_test" } },
  { path: "/api/reviews", method: "POST", auth: true, label: "Reviews - Create", body: { targetId: "user_1", rating: 5, comment: "Great service!" } },
  { path: "/api/proposals", method: "POST", auth: true, label: "Proposals - Create", body: { jobId: "job_1", coverLetter: "I am interested", proposedAmount: 200 } },
  { path: "/api/messages", method: "POST", auth: true, label: "Messages - Create", body: { recipientId: "user_1", content: "Hello from benchmark" } },
  { path: "/api/uploads", method: "POST", auth: true, label: "Uploads - Create", body: null },
  { path: "/api/admin", method: "GET", auth: true, label: "Admin - Dashboard" },
];

// ---------- Warmup ----------
async function warmup() {
  console.log(`\n🔥 Warmup: ${WARMUP_REQUESTS} requests per endpoint...`);
  for (const ep of ENDPOINTS.slice(0, 3)) {
    await runConcurrent(ep.path, ep.method, ep.body || null, ep.auth ? BENCHMARK_TOKEN : "", WARMUP_REQUESTS);
  }
}

// ---------- Main benchmark loop ----------
async function benchmarkEndpoint(ep) {
  const label = ep.label || `${ep.method} ${ep.path}`;
  const token = ep.auth ? BENCHMARK_TOKEN : "";
  const body = ep.body || null;

  // Run bursts for DURATION_MS
  const startTime = Date.now();
  const results = [];
  let burst = 0;

  while (Date.now() - startTime < DURATION_MS) {
    const batchResults = await runConcurrent(ep.path, ep.method, body, token, CONCURRENCY);
    results.push(...batchResults);
    burst++;
    if (burst > 200) break; // safety cap
  }

  const stats = computeStats(results);
  const totalRequests = results.length;

  return {
    endpoint: ep.path,
    method: ep.method,
    label,
    totalRequests,
    successes: results.filter((r) => r.status >= 200 && r.status < 400).length,
    errors: results.filter((r) => r.status === 0 || r.status >= 400).length,
    ...stats,
  };
}

// ---------- Markdown report ----------
function generateMarkdown(results, thresholds) {
  const rows = results.map((r) => {
    const p99Ok = r.p99 <= (thresholds[r.endpoint]?.p99 || 1000);
    const status = r.errors === r.totalRequests ? "❌ OFFLINE" : p99Ok ? "✅ PASS" : "⚠️ SLOW";
    return `| ${r.method.padEnd(6)} | ${r.endpoint.padEnd(40)} | ${r.totalRequests.toString().padStart(6)} | ${r.p50.toString().padStart(6)}ms | ${r.p95.toString().padStart(6)}ms | ${r.p99.toString().padStart(6)}ms | ${r.rps.toString().padStart(8)}/s | ${r.errorRate.toString().padStart(6)}% | ${status} |`;
  });

  const table = [
    "| Method | Endpoint                               | Requests |    p50 |    p95 |    p99 |      RPS |  Err% | Status |",
    "|--------|----------------------------------------|----------|--------|--------|--------|----------|-------|--------|",
    ...rows,
  ].join("\n");

  return `# FreelanceFlow API Benchmark Report

Generated: ${new Date().toISOString()}
Target: ${BASE_URL}
Duration: ${DURATION_MS}ms | Concurrency: ${CONCURRENCY}

## Summary

| Metric | Value |
|--------|-------|
| Total Endpoints Tested | ${results.length} |
| Total Requests | ${results.reduce((s, r) => s + r.totalRequests, 0)} |
| Avg p50 Latency | ${Math.round(results.reduce((s, r) => s + r.p50, 0) / results.length)}ms |
| Avg p95 Latency | ${Math.round(results.reduce((s, r) => s + r.p95, 0) / results.length)}ms |
| Avg p99 Latency | ${Math.round(results.reduce((s, r) => s + r.p99, 0) / results.length)}ms |
| Overall Error Rate | ${Math.round((results.reduce((s, r) => s + r.errors, 0) / results.reduce((s, r) => s + r.totalRequests, 0)) * 100) / 100}% |

## Per-Endpoint Results

${table}

## Notes

- **p50/p95/p99**: Latency percentiles in milliseconds
- **RPS**: Requests per second (peak throughput)
- **Err%**: Percentage of requests that failed or returned non-2xx status
- **Status**: ✅ PASS = p99 within threshold | ⚠️ SLOW = p99 exceeds threshold | ❌ OFFLINE = all requests failed

## Thresholds (benchmarks/thresholds.json)

${Object.entries(thresholds).map(([ep, t]) => `| ${ep} | p99 ≤ ${t.p99}ms |`).join("\n")}

---
*Generated by FreelanceFlow API Benchmark Suite*
`;
}

// ---------- Main ----------
async function main() {
  console.log(`\n🚀 FreelanceFlow API Benchmark`);
  console.log(`   Target: ${BASE_URL}`);
  console.log(`   Duration: ${DURATION_MS}ms | Concurrency: ${CONCURRENCY}`);
  console.log(`   Endpoints: ${ENDPOINTS.length}\n`);

  mkdirSync(RESULTS_DIR, { recursive: true });

  await warmup();

  const results = [];
  for (const ep of ENDPOINTS) {
    const label = ep.label || `${ep.method} ${ep.path}`;
    process.stdout.write(`  ${label.padEnd(40)}... `);
    const result = await benchmarkEndpoint(ep);
    results.push(result);
    const status = result.errors === result.totalRequests ? "❌" : result.p99 > 1000 ? "⚠️" : "✅";
    console.log(`${status} p50=${result.p50}ms p95=${result.p95}ms p99=${result.p99}ms rps=${result.rps}/s err=${result.errorRate}%`);
  }

  // Load thresholds
  let thresholds = {};
  try {
    const { readFileSync } = await import("fs");
    const raw = readFileSync(join(__dirname, "thresholds.json"), "utf-8");
    thresholds = JSON.parse(raw);
  } catch {
    console.log("\n⚠️  thresholds.json not found — skipping threshold checks");
  }

  // Write JSON results
  const jsonPath = join(RESULTS_DIR, `results_${Date.now()}.json`);
  writeFileSync(jsonPath, JSON.stringify({ timestamp: new Date().toISOString(), baseUrl: BASE_URL, concurrency: CONCURRENCY, durationMs: DURATION_MS, results }, null, 2));
  console.log(`\n📄 JSON results: ${jsonPath}`);

  // Write latest.json (always overwrites)
  const latestPath = join(RESULTS_DIR, "latest.json");
  writeFileSync(latestPath, JSON.stringify({ timestamp: new Date().toISOString(), baseUrl: BASE_URL, concurrency: CONCURRENCY, durationMs: DURATION_MS, results }, null, 2));

  // Write markdown report
  const markdown = generateMarkdown(results, thresholds);
  const mdPath = join(RESULTS_DIR, "report.md");
  writeFileSync(mdPath, markdown);
  console.log(`📄 Markdown report: ${mdPath}`);

  console.log("\n✅ Benchmark complete!");
}

main().catch(console.error);
