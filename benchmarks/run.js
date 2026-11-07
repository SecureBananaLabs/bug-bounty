#!/usr/bin/env node
/**
 * FreelanceFlow API Benchmark Suite
 *
 * Measures latency (p50, p95, p99), RPS, error rate, and TTFB
 * for all /api/ endpoints.
 *
 * Usage:
 *   cd benchmarks && npm install && npm run benchmark
 *
 * Requires the API server running on BENCHMARK_HOST (default: http://localhost:3000)
 */

import autocannon from "autocannon";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

const HOST = process.env.BENCHMARK_HOST || "http://localhost:3000";
const CONNECTIONS = parseInt(process.env.BENCHMARK_CONNECTIONS || "10", 10);
const DURATION = parseInt(process.env.BENCHMARK_DURATION || "10", 10);
const OUTPUT_DIR = process.env.BENCHMARK_OUTPUT_DIR || "./results";

// Ensure output directory exists
if (!existsSync(OUTPUT_DIR)) {
  mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Endpoints to benchmark
// Each entry: { name, method, path, body?, headers? }
const endpoints = [
  // Public routes
  { name: "health", method: "GET", path: "/health" },
  { name: "auth_register", method: "POST", path: "/api/auth/register", body: JSON.stringify({ email: "bench@test.com", password: "password123", name: "Bench User" }), headers: { "content-type": "application/json" } },
  { name: "auth_login", method: "POST", path: "/api/auth/login", body: JSON.stringify({ email: "bench@test.com", password: "password123" }), headers: { "content-type": "application/json" } },
  { name: "users_list", method: "GET", path: "/api/users" },
  { name: "jobs_list", method: "GET", path: "/api/jobs" },
  { name: "proposals_list", method: "GET", path: "/api/proposals" },
  { name: "reviews_list", method: "GET", path: "/api/reviews" },
  { name: "messages_list", method: "GET", path: "/api/messages" },
  { name: "notifications_list", method: "GET", path: "/api/notifications" },
  { name: "search", method: "GET", path: "/api/search?q=test" },
];

async function runBenchmark(endpoint) {
  console.log(`\n📊 Benchmarking: ${endpoint.name} (${endpoint.method} ${endpoint.path})`);

  const options = {
    url: `${HOST}${endpoint.path}`,
    method: endpoint.method,
    connections: CONNECTIONS,
    duration: DURATION,
    timeout: 30,
    headers: {
      ...endpoint.headers,
    },
    body: endpoint.body,
    setupClient: (client) => {
      client.setHeaders({
        ...endpoint.headers,
      });
      if (endpoint.body) {
        client.setBody(endpoint.body);
      }
    },
  };

  return new Promise((resolve, reject) => {
    const instance = autocannon(options, (err, result) => {
      if (err) {
        console.error(`  ❌ Error: ${err.message}`);
        resolve({ endpoint: endpoint.name, error: err.message });
        return;
      }

      const metrics = {
        name: endpoint.name,
        method: endpoint.method,
        path: endpoint.path,
        latency: {
          p50: result.latency.p50,
          p95: result.latency.p95,
          p99: result.latency.p99,
          average: result.latency.average,
          min: result.latency.min,
          max: result.latency.max,
        },
        throughput: {
          rps: result.requests.average,
          totalRequests: result.requests.total,
          bytesPerSecond: result.throughput.average,
        },
        errors: {
          count: result.errors,
          rate: ((result.errors / result.requests.total) * 100).toFixed(2) + "%",
        },
        ttfb: {
          p50: result.latency.p50, // autocannon latency ≈ TTFB for API calls
          p95: result.latency.p95,
          p99: result.latency.p99,
        },
      };

      console.log(`  ✅ p50: ${metrics.latency.p50}ms | p95: ${metrics.latency.p95}ms | p99: ${metrics.latency.p99}ms`);
      console.log(`     RPS: ${metrics.throughput.rps} | Errors: ${metrics.errors.count} (${metrics.errors.rate})`);

      resolve(metrics);
    });

    // Progress tracking
    autocannon.track(instance, { renderProgressBar: true });
  });
}

async function main() {
  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║     FreelanceFlow API Benchmark Suite            ║");
  console.log("╚══════════════════════════════════════════════════╝");
  console.log(`\nTarget: ${HOST}`);
  console.log(`Connections: ${CONNECTIONS} | Duration: ${DURATION}s`);
  console.log(`Endpoints: ${endpoints.length}`);

  const results = [];
  for (const endpoint of endpoints) {
    const result = await runBenchmark(endpoint);
    results.push(result);
  }

  // Write JSON results
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const jsonPath = join(OUTPUT_DIR, `benchmark-${timestamp}.json`);
  writeFileSync(jsonPath, JSON.stringify(results, null, 2));
  console.log(`\n📁 JSON results: ${jsonPath}`);

  // Generate markdown summary
  const md = generateMarkdownSummary(results);
  const mdPath = join(OUTPUT_DIR, `benchmark-${timestamp}.md`);
  writeFileSync(mdPath, md);
  console.log(`📁 Markdown summary: ${mdPath}`);

  // Print summary table
  console.log("\n╔═══════════════════════════════════════════════════════════════════════════════╗");
  console.log("║                           BENCHMARK SUMMARY                                   ║");
  console.log("╠═══════════════════════════════════════════════════════════════════════════════╣");
  console.log("║ Endpoint          │ p50 (ms) │ p95 (ms) │ p99 (ms) │ RPS    │ Error Rate    ║");
  console.log("╠═══════════════════════════════════════════════════════════════════════════════╣");
  for (const r of results) {
    if (r.error) {
      console.log(`║ ${r.name.padEnd(18)} │ ERROR: ${r.error.substring(0, 50)}`);
      continue;
    }
    const name = r.name.padEnd(18);
    const p50 = String(r.latency.p50).padStart(8);
    const p95 = String(r.latency.p95).padStart(8);
    const p99 = String(r.latency.p99).padStart(8);
    const rps = String(r.throughput.rps.toFixed(1)).padStart(6);
    const err = r.errors.rate.padStart(12);
    console.log(`║ ${name}│${p50} │${p95} │${p99} │${rps} │${err}    ║`);
  }
  console.log("╚═══════════════════════════════════════════════════════════════════════════════╝");
}

function generateMarkdownSummary(results) {
  const lines = [
    "# FreelanceFlow API Benchmark Results",
    "",
    `**Date:** ${new Date().toISOString()}`,
    `**Target:** ${HOST}`,
    `**Connections:** ${CONNECTIONS}`,
    `**Duration:** ${DURATION}s`,
    "",
    "## Summary",
    "",
    "| Endpoint | Method | Path | p50 (ms) | p95 (ms) | p99 (ms) | RPS | Error Rate |",
    "|----------|--------|------|-----------|-----------|-----------|-----|------------|",
  ];

  for (const r of results) {
    if (r.error) {
      lines.push(`| ${r.name} | ${r.method} | ${r.path} | ERROR | ERROR | ERROR | - | - |`);
      continue;
    }
    lines.push(
      `| ${r.name} | ${r.method} | ${r.path} | ${r.latency.p50} | ${r.latency.p95} | ${r.latency.p99} | ${r.throughput.rps.toFixed(1)} | ${r.errors.rate} |`
    );
  }

  lines.push("");
  lines.push("## Detailed Results");
  lines.push("");

  for (const r of results) {
    if (r.error) {
      lines.push(`### ${r.name} - ERROR`);
      lines.push(`Error: ${r.error}`);
      lines.push("");
      continue;
    }
    lines.push(`### ${r.name} (${r.method} ${r.path})`);
    lines.push("");
    lines.push("| Metric | Value |");
    lines.push("|--------|-------|");
    lines.push(`| Latency p50 | ${r.latency.p50} ms |`);
    lines.push(`| Latency p95 | ${r.latency.p95} ms |`);
    lines.push(`| Latency p99 | ${r.latency.p99} ms |`);
    lines.push(`| Latency avg | ${r.latency.average} ms |`);
    lines.push(`| Latency min | ${r.latency.min} ms |`);
    lines.push(`| Latency max | ${r.latency.max} ms |`);
    lines.push(`| Requests/sec | ${r.throughput.rps.toFixed(1)} |`);
    lines.push(`| Total requests | ${r.throughput.totalRequests} |`);
    lines.push(`| Errors | ${r.errors.count} (${r.errors.rate}) |`);
    lines.push(`| TTFB p50 | ${r.ttfb.p50} ms |`);
    lines.push(`| TTFB p95 | ${r.ttfb.p95} ms |`);
    lines.push(`| TTFB p99 | ${r.ttfb.p99} ms |`);
    lines.push("");
  }

  return lines.join("\n");
}

main().catch(console.error);
