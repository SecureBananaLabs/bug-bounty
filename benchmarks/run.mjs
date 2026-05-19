#!/usr/bin/env node
/**
 * FreelanceFlow API Benchmark Suite
 *
 * Usage: node benchmarks/run.mjs [--host HOST] [--connections N] [--duration SEC]
 *        npm run benchmark
 *
 * Requires: autocannon (npm install -D autocannon)
 */

import autocannon from "autocannon";
import { writeFileSync, mkdirSync, existsSync, readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const RESULTS_DIR = resolve(__dirname, "results");

const HOST = process.env.BENCHMARK_HOST || process.argv.find(a => a.startsWith("--host="))?.split("=")[1] || "http://localhost:3000";
const CONNECTIONS = parseInt(process.env.BENCHMARK_CONNECTIONS || process.argv.find(a => a.startsWith("--connections="))?.split("=")[1] || "10");
const DURATION = parseInt(process.env.BENCHMARK_DURATION || process.argv.find(a => a.startsWith("--duration="))?.split("=")[1] || "10");
const TOKEN = process.env.BENCHMARK_TOKEN || "bench-token";
const P99_THRESHOLD = parseInt(process.env.BENCHMARK_P99_THRESHOLD_MS || "500");
const ERROR_THRESHOLD = parseFloat(process.env.BENCHMARK_ERROR_RATE_THRESHOLD || "0.05");

// All API endpoints to benchmark
const ENDPOINTS = [
  { name: "Health", method: "GET", path: "/health", auth: false },
  { name: "Auth Register", method: "POST", path: "/api/auth/register", auth: false, body: JSON.stringify({ email: "test@example.com", password: "Test123!", name: "Test User" }) },
  { name: "Auth Login", method: "POST", path: "/api/auth/login", auth: false, body: JSON.stringify({ email: "test@example.com", password: "Test123!" }) },
  { name: "Auth Refresh", method: "POST", path: "/api/auth/refresh", auth: false, body: JSON.stringify({ refreshToken: "test-refresh-token" }) },
  { name: "Users List", method: "GET", path: "/api/users", auth: false },
  { name: "Users Create", method: "POST", path: "/api/users", auth: false, body: JSON.stringify({ name: "Test", email: "new@test.com" }) },
  { name: "Jobs List", method: "GET", path: "/api/jobs", auth: false },
  { name: "Jobs Create", method: "POST", path: "/api/jobs", auth: true, body: JSON.stringify({ title: "Bench Job", description: "Test", budget: 100 }) },
  { name: "Proposals List", method: "GET", path: "/api/proposals", auth: false },
  { name: "Proposals Create", method: "POST", path: "/api/proposals", auth: true, body: JSON.stringify({ jobId: 1, coverLetter: "Test", bid: 50 }) },
  { name: "Payments Create", method: "POST", path: "/api/payments", auth: true, body: JSON.stringify({ amount: 100, currency: "USD" }) },
  { name: "Reviews List", method: "GET", path: "/api/reviews", auth: false },
  { name: "Reviews Create", method: "POST", path: "/api/reviews", auth: true, body: JSON.stringify({ rating: 5, comment: "Great!" }) },
  { name: "Messages List", method: "GET", path: "/api/messages", auth: false },
  { name: "Messages Create", method: "POST", path: "/api/messages", auth: true, body: JSON.stringify({ recipientId: 1, content: "Hello" }) },
  { name: "Notifications List", method: "GET", path: "/api/notifications", auth: false },
  { name: "Search", method: "GET", path: "/api/search?q=test", auth: false },
  { name: "Admin Metrics", method: "GET", path: "/api/admin/metrics", auth: true },
];

const headers = { "Content-Type": "application/json" };
if (TOKEN) {
  headers["Authorization"] = `Bearer ${TOKEN}`;
}

function runBenchmark(endpoint, idx, total) {
  return new Promise((resolve) => {
    const label = `[${idx}/${total}]`;
    console.log(`${label} ${endpoint.method} ${endpoint.path}...`);

    const opts = {
      url: `${HOST}${endpoint.path}`,
      method: endpoint.method,
      connections: CONNECTIONS,
      duration: DURATION,
      headers,
      body: endpoint.body || undefined,
      timeout: 30,
    };

    const instance = autocannon(opts);

    autocannon.track(instance, { renderProgressBar: false });

    instance.on("done", (result) => {
      const data = {
        endpoint: endpoint.name,
        method: endpoint.method,
        path: endpoint.path,
        timestamp: new Date().toISOString(),
        connections: CONNECTIONS,
        duration_sec: DURATION,
        latency: {
          p50: result.latency?.p50 || 0,
          p95: result.latency?.p95 || 0,
          p99: result.latency?.p99 || 0,
          avg: result.latency?.average || 0,
          min: result.latency?.min || 0,
          max: result.latency?.max || 0,
        },
        rps: {
          mean: result.requests?.mean || 0,
          max: result.requests?.max || 0,
          total: result.requests?.total || 0,
        },
        errors: result.errors || 0,
        error_rate: result.errors && result.requests?.total
          ? (result.errors / result.requests.total).toFixed(4)
          : 0,
        timeouts: result.timeouts || 0,
        non2xx: result.non2xx || 0,
        status_2xx: result["2xx"] || 0,
        status_4xx: result["4xx"] || 0,
        status_5xx: result["5xx"] || 0,
        bytes_total: result.throughput?.total || 0,
      };

      const status = result.non2xx > 0 ? "⚠️" : "✅";
      console.log(`  ${status} p99: ${data.latency.p99}ms | RPS: ${data.rps.mean.toFixed(1)} | errors: ${data.errors}`);

      resolve(data);
    });

    instance.on("error", (err) => {
      console.log(`  ❌ Error: ${err.message}`);
      resolve({
        endpoint: endpoint.name,
        method: endpoint.method,
        path: endpoint.path,
        timestamp: new Date().toISOString(),
        error: err.message,
        latency: { p50: 0, p95: 0, p99: 0, avg: 0, min: 0, max: 0 },
        rps: { mean: 0, max: 0, total: 0 },
        errors: 0,
        error_rate: 0,
        timeouts: 0,
        non2xx: 0,
        status_2xx: 0,
        status_4xx: 0,
        status_5xx: 0,
        bytes_total: 0,
      });
    });
  });
}

function generateMarkdown(results) {
  const lines = [];
  lines.push("# API Benchmark Results");
  lines.push("");
  lines.push(`**Date:** ${new Date().toISOString().split("T")[0]}`);
  lines.push(`**Target:** ${HOST}`);
  lines.push(`**Connections:** ${CONNECTIONS} | **Duration:** ${DURATION}s`);
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push("| Endpoint | Method | p50 | p95 | p99 | RPS | Errors | Status |");
  lines.push("|----------|--------|-----|-----|-----|-----|--------|--------|");

  let passed = 0;
  let failed = 0;

  for (const r of results) {
    const p99Pass = r.latency.p99 <= P99_THRESHOLD;
    const errorPass = parseFloat(r.error_rate) <= ERROR_THRESHOLD;
    const pass = p99Pass && errorPass;
    pass ? passed++ : failed++;

    const icon = pass ? "✅" : "❌";
    lines.push(
      `| ${r.endpoint} | ${r.method} | ${r.latency.p50}ms | ${r.latency.p95}ms | ${r.latency.p99}ms | ${r.rps.mean.toFixed(1)} | ${r.errors} | ${icon} |`
    );
  }

  lines.push("");
  lines.push(`**Passed:** ${passed} / ${results.length} | **Failed:** ${failed}`);
  lines.push("");
  lines.push("## Thresholds");
  lines.push("");
  lines.push(`- p99 latency: < ${P99_THRESHOLD}ms`);
  lines.push(`- Error rate: < ${(ERROR_THRESHOLD * 100).toFixed(0)}%`);
  lines.push("");
  lines.push("## Per-Endpoint Details");
  lines.push("");

  for (const r of results) {
    lines.push(`### ${r.endpoint}`);
    lines.push("");
    lines.push(`\`${r.method} ${r.path}\``);
    lines.push("");
    lines.push("| Metric | Value |");
    lines.push("|--------|-------|");
    lines.push(`| p50 | ${r.latency.p50}ms |`);
    lines.push(`| p95 | ${r.latency.p95}ms |`);
    lines.push(`| p99 | ${r.latency.p99}ms |`);
    lines.push(`| Avg | ${r.latency.avg}ms |`);
    lines.push(`| Min | ${r.latency.min}ms |`);
    lines.push(`| Max | ${r.latency.max}ms |`);
    lines.push(`| RPS (mean) | ${r.rps.mean.toFixed(1)} |`);
    lines.push(`| RPS (max) | ${r.rps.max.toFixed(1)} |`);
    lines.push(`| Total requests | ${r.rps.total} |`);
    lines.push(`| Errors | ${r.errors} |`);
    lines.push(`| 2xx | ${r.status_2xx} |`);
    lines.push(`| 4xx | ${r.status_4xx} |`);
    lines.push(`| 5xx | ${r.status_5xx} |`);
    lines.push(`| Throughput | ${(r.bytes_total / 1024).toFixed(1)} KB |`);
    lines.push("");
  }

  return lines.join("\n");
}

// Run all benchmarks sequentially
async function main() {
  mkdirSync(RESULTS_DIR, { recursive: true });

  console.log(`\n🚀 FreelanceFlow API Benchmark`);
  console.log(`Target: ${HOST} | Connections: ${CONNECTIONS} | Duration: ${DURATION}s`);
  console.log(`Endpoints: ${ENDPOINTS.length}\n`);

  const results = [];
  for (let i = 0; i < ENDPOINTS.length; i++) {
    const result = await runBenchmark(ENDPOINTS[i], i + 1, ENDPOINTS.length);
    results.push(result);
  }

  // Write JSON results
  const jsonPath = resolve(RESULTS_DIR, "results.json");
  writeFileSync(jsonPath, JSON.stringify(results, null, 2));
  console.log(`\n📊 JSON: ${jsonPath}`);

  // Write Markdown summary
  const md = generateMarkdown(results);
  const mdPath = resolve(RESULTS_DIR, "results.md");
  writeFileSync(mdPath, md);
  console.log(`📊 Markdown: ${mdPath}`);

  // CI gate: check thresholds
  let ciPass = true;
  for (const r of results) {
    if (r.latency.p99 > P99_THRESHOLD) {
      console.log(`❌ CI FAIL: ${r.endpoint} p99=${r.latency.p99}ms > threshold=${P99_THRESHOLD}ms`);
      ciPass = false;
    }
    if (parseFloat(r.error_rate) > ERROR_THRESHOLD) {
      console.log(`❌ CI FAIL: ${r.endpoint} error_rate=${r.error_rate} > threshold=${ERROR_THRESHOLD}`);
      ciPass = false;
    }
  }

  if (ciPass) {
    console.log("\n✅ All thresholds passed!");
    process.exit(0);
  } else {
    console.log("\n❌ Threshold violations detected!");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Benchmark suite error:", err);
  process.exit(1);
});
