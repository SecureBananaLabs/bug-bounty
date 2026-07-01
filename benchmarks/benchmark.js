import autocannon from "autocannon";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RESULTS_DIR = path.join(__dirname, "results");
const THRESHOLDS_FILE = path.join(__dirname, "thresholds.json");
const TARGET = process.env.BENCHMARK_HOST || "http://localhost:3000";

const ENDPOINTS = [
  { method: "GET", path: "/health", label: "Health Check" },
  { method: "POST", path: "/api/auth/register", label: "Auth Register", body: { email: "bench@test.com", password: "Bench123!", name: "Benchmark User", role: "freelancer" } },
  { method: "POST", path: "/api/auth/login", label: "Auth Login", body: { email: "bench@test.com", password: "Bench123!" } },
  { method: "GET", path: "/api/users", label: "List Users" },
  { method: "GET", path: "/api/jobs", label: "List Jobs" },
  { method: "GET", path: "/api/proposals", label: "List Proposals" },
  { method: "GET", path: "/api/payments", label: "List Payments" },
  { method: "GET", path: "/api/reviews", label: "List Reviews" },
  { method: "GET", path: "/api/messages", label: "List Messages" },
  { method: "GET", path: "/api/notifications", label: "List Notifications" },
  { method: "GET", path: "/api/search", label: "Search" },
  { method: "GET", path: "/api/admin", label: "Admin Dashboard" },
];

async function runBenchmark(endpoint) {
  const opts = {
    url: `${TARGET}${endpoint.path}`,
    method: endpoint.method,
    connections: parseInt(process.env.BENCHMARK_CONNECTIONS || "10"),
    pipelining: parseInt(process.env.BENCHMARK_PIPELINING || "1"),
    duration: parseInt(process.env.BENCHMARK_DURATION || "10"),
    timeout: parseInt(process.env.BENCHMARK_TIMEOUT || "30"),
    headers: { "Content-Type": "application/json" },
    body: endpoint.body ? JSON.stringify(endpoint.body) : undefined,
  };

  return new Promise((resolve, reject) => {
    autocannon(opts, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
}

function formatLatency(dist) {
  const p95 = dist.p95 !== undefined ? dist.p95 : (dist.p90 + (dist.p97_5 - dist.p90) * (2 / 3));
  return {
    p50: dist.p50.toFixed(2),
    p75: dist.p75.toFixed(2),
    p95: p95.toFixed(2),
    p99: dist.p99.toFixed(2),
  };
}

async function main() {
  console.log(`\n🚀 Benchmarking ${TARGET}\n`);
  console.log(`Connections: ${process.env.BENCHMARK_CONNECTIONS || "10"}`);
  console.log(`Duration: ${process.env.BENCHMARK_DURATION || "10"}s\n`);

  const results = {};
  const markdownRows = [];

  for (const endpoint of ENDPOINTS) {
    process.stdout.write(`  📊 ${endpoint.label} (${endpoint.method} ${endpoint.path})... `);
    try {
      const result = await runBenchmark(endpoint);
      const latency = formatLatency(result.latency);
      results[endpoint.label] = {
        method: endpoint.method,
        path: endpoint.path,
        latencyMs: latency,
        requestsPerSecond: result.requests.average,
        throughputBytesPerSecond: result.throughput.average,
        errorRate: result.errors + result.timeouts > 0
          ? ((result.errors + result.timeouts) / result.requests.total * 100).toFixed(2)
          : "0.00",
        totalRequests: result.requests.total,
        totalErrors: result.errors,
        totalTimeouts: result.timeouts,
        non2xx: result.non2xx,
      };
      console.log(`✅ (${result.requests.average.toFixed(0)} req/s, p99: ${latency.p99}ms)`);
      
      markdownRows.push(`| ${endpoint.label} | ${endpoint.method} ${endpoint.path} | ${latency.p50} | ${latency.p95} | ${latency.p99} | ${result.requests.average.toFixed(0)} | ${results[endpoint.label].errorRate}% | ${result.throughput.average.toFixed(0)} |`);
    } catch (err) {
      console.log(`❌ ${err.message}`);
      results[endpoint.label] = { error: err.message };
    }
  }

  // Write JSON results
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const jsonFile = path.join(RESULTS_DIR, `benchmark-${timestamp}.json`);
  fs.writeFileSync(jsonFile, JSON.stringify({ timestamp, target: TARGET, results }, null, 2));
  console.log(`\n  📁 JSON results: ${jsonFile}`);

  // Write markdown summary
  let md = `# API Benchmark Results

**Target:** ${TARGET}
**Date:** ${new Date().toISOString()}
**Connections:** ${process.env.BENCHMARK_CONNECTIONS || "10"}
**Duration:** ${process.env.BENCHMARK_DURATION || "10"}s

## Per-Endpoint Results

| Endpoint | Route | p50 (ms) | p95 (ms) | p99 (ms) | Req/s | Error Rate | Throughput (B/s) |
|----------|-------|----------|----------|----------|-------|------------|-----------------|
${markdownRows.join("\n")}

## Threshold Check

| Threshold | Value | Status |
|-----------|-------|--------|
`;

  // Check thresholds
  let thresholdsOk = true;
  const thresholds = JSON.parse(fs.readFileSync(THRESHOLDS_FILE, "utf-8"));
  for (const [key, threshold] of Object.entries(thresholds)) {
    const result = results[key];
    if (result && !result.error) {
      const p99 = parseFloat(result.latencyMs.p99);
      const status = p99 <= threshold.maxP99Ms ? "✅ PASS" : "❌ FAIL";
      if (p99 > threshold.maxP99Ms) thresholdsOk = false;
      md += `| ${key} p99 ≤ ${threshold.maxP99Ms}ms | ${p99}ms | ${status} |\n`;
    }
  }

  md += `\n**Overall: ${thresholdsOk ? "✅ All thresholds passed" : "❌ Some thresholds exceeded"}**\n`;

  const mdFile = path.join(RESULTS_DIR, `benchmark-${timestamp}.md`);
  fs.writeFileSync(mdFile, md);
  console.log(`  📁 Markdown results: ${mdFile}`);

  // Exit with error code if thresholds fail
  process.exit(thresholdsOk ? 0 : 1);
}

main().catch((err) => {
  console.error("Benchmark failed:", err);
  process.exit(1);
});
