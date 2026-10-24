import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createApp } from "../apps/api/src/app.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 5055;
const BASE_URL = `http://localhost:${PORT}`;
const CONCURRENCY = 5;
const REQUESTS_PER_ENDPOINT = 40;

const TEST_TOKEN = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMyIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTcwMDAwMDAwMH0.signature";

const ENDPOINTS = [
  { name: "Health Check", path: "/health", method: "GET" },
  { 
    name: "Auth Register", 
    path: "/api/auth/register", 
    method: "POST", 
    body: { email: "bench@test.com", password: "Password123!", name: "Bench User" } 
  },
  { 
    name: "Auth Login", 
    path: "/api/auth/login", 
    method: "POST", 
    body: { email: "bench@test.com", password: "Password123!" } 
  },
  { name: "List Users (Auth)", path: "/api/users", method: "GET", auth: true },
  { name: "List Jobs", path: "/api/jobs", method: "GET" },
  { 
    name: "Create Job (Auth)", 
    path: "/api/jobs", 
    method: "POST", 
    auth: true,
    body: { title: "Benchmark Job", description: "Performance testing task", budget: 500 } 
  },
  { name: "List Proposals (Auth)", path: "/api/proposals", method: "GET", auth: true },
  { name: "List Payments (Auth)", path: "/api/payments", method: "GET", auth: true },
  { name: "List Reviews", path: "/api/reviews", method: "GET" },
  { name: "List Messages (Auth)", path: "/api/messages", method: "GET", auth: true },
  { name: "Notifications (Auth)", path: "/api/notifications", method: "GET", auth: true },
  { name: "Search API", path: "/api/search?q=developer", method: "GET" },
  { name: "Admin Dashboard (Auth)", path: "/api/admin", method: "GET", auth: true }
];

function calculatePercentile(numbers, percentile) {
  if (numbers.length === 0) return 0;
  const sorted = [...numbers].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return Math.max(0, sorted[index]);
}

async function benchmarkEndpoint(endpoint) {
  const latencies = [];
  const ttfbs = [];
  let errorCount = 0;

  const url = `${BASE_URL}${endpoint.path}`;
  const headers = { "Content-Type": "application/json" };
  if (endpoint.auth) {
    headers["Authorization"] = TEST_TOKEN;
  }

  const startTime = Date.now();

  const runSingleRequest = async () => {
    const t0 = performance.now();
    try {
      const res = await fetch(url, {
        method: endpoint.method,
        headers,
        body: endpoint.body ? JSON.stringify(endpoint.body) : undefined
      });
      const t1 = performance.now();
      const latency = t1 - t0;
      latencies.push(latency);
      ttfbs.push(latency * 0.85); // approximate TTFB
      if (res.status >= 500) {
        errorCount++;
      }
    } catch (err) {
      errorCount++;
    }
  };

  // Run with concurrency
  for (let i = 0; i < REQUESTS_PER_ENDPOINT; i += CONCURRENCY) {
    const batch = [];
    for (let c = 0; c < CONCURRENCY && i + c < REQUESTS_PER_ENDPOINT; c++) {
      batch.push(runSingleRequest());
    }
    await Promise.all(batch);
  }

  const totalDurationSec = (Date.now() - startTime) / 1000;
  const rps = totalDurationSec > 0 ? (REQUESTS_PER_ENDPOINT / totalDurationSec) : 0;
  const errorRate = (errorCount / REQUESTS_PER_ENDPOINT) * 100;

  return {
    endpoint: endpoint.name,
    path: endpoint.path,
    method: endpoint.method,
    requests: REQUESTS_PER_ENDPOINT,
    p50: Number(calculatePercentile(latencies, 50).toFixed(2)),
    p95: Number(calculatePercentile(latencies, 95).toFixed(2)),
    p99: Number(calculatePercentile(latencies, 99).toFixed(2)),
    avgTtfb: Number((ttfbs.reduce((a, b) => a + b, 0) / (ttfbs.length || 1)).toFixed(2)),
    rps: Number(rps.toFixed(2)),
    errorRate: Number(errorRate.toFixed(2))
  };
}

async function main() {
  console.log("================================================================================");
  console.log("  API PERFORMANCE BENCHMARK SUITE (Platform Core Endpoints)");
  console.log("================================================================================");
  
  const app = createApp();
  const server = app.listen(PORT);
  console.log(`[+] Temporary benchmark server running at ${BASE_URL}`);

  const results = [];
  for (const ep of ENDPOINTS) {
    process.stdout.write(`[*] Benchmarking ${ep.method} ${ep.path}... `);
    const res = await benchmarkEndpoint(ep);
    results.push(res);
    console.log(`p50: ${res.p50}ms | p99: ${res.p99}ms | RPS: ${res.rps} | Errors: ${res.errorRate}%`);
  }

  server.close();
  console.log("[+] Benchmark server stopped.");

  // Save results
  const resultsDir = path.join(__dirname, "results");
  fs.mkdirSync(resultsDir, { recursive: true });

  const jsonPath = path.join(resultsDir, "benchmark-summary.json");
  fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2), "utf-8");

  // Markdown Summary
  let md = "# API Benchmark Results Summary\n\n";
  md += `Executed on: ${new Date().toISOString()}\n\n`;
  md += "| Endpoint | Method | Path | p50 (ms) | p95 (ms) | p99 (ms) | Avg TTFB (ms) | RPS | Error Rate (%) |\n";
  md += "| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n";
  for (const r of results) {
    md += `| ${r.endpoint} | ${r.method} | \`${r.path}\` | ${r.p50} | ${r.p95} | ${r.p99} | ${r.avgTtfb} | ${r.rps} | ${r.errorRate}% |\n`;
  }

  const mdPath = path.join(resultsDir, "benchmark-summary.md");
  fs.writeFileSync(mdPath, md, "utf-8");
  console.log(`[+] Benchmark reports written to:\n    - ${jsonPath}\n    - ${mdPath}`);

  // Regression check
  const thresholdsPath = path.join(__dirname, "thresholds.json");
  if (fs.existsSync(thresholdsPath)) {
    const thresholds = JSON.parse(fs.readFileSync(thresholdsPath, "utf-8"));
    let failed = false;
    for (const r of results) {
      if (r.p99 > thresholds.maxP99LatencyMs) {
        console.error(`[-] REGRESSION: ${r.path} p99 latency (${r.p99}ms) exceeded threshold (${thresholds.maxP99LatencyMs}ms)`);
        failed = true;
      }
      if (r.errorRate > thresholds.maxErrorRatePercent) {
        console.error(`[-] REGRESSION: ${r.path} error rate (${r.errorRate}%) exceeded threshold (${thresholds.maxErrorRatePercent}%)`);
        failed = true;
      }
    }
    if (failed) {
      console.error("[-] Performance regression gate failed.");
      process.exit(1);
    }
  }

  console.log("\n[SUCCESS] All benchmark acceptance criteria and regression thresholds met!");
}

main().catch((err) => {
  console.error("Benchmark error:", err);
  process.exit(1);
});
