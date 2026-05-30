#!/usr/bin/env node

/**
 * FreelanceFlow API Benchmark Runner
 *
 * Runs a configurable benchmark suite against all /api/ endpoints
 * and produces JSON + Markdown reports.
 *
 * Usage:
 *   node benchmarks/runner.js                  # default profile
 *   node benchmarks/runner.js --connections 50 --duration 60
 *   node benchmarks/runner.js --quick          # smoke test (5s)
 *   node benchmarks/runner.js --list           # list endpoints
 *
 * Requirements: npm install autocannon
 * Or use built-in mode (no deps): BENCH_ENGINE=builtin
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { BENCHMARK_ENDPOINTS, BENCHMARK_PROFILE, TARGET, baseURL } from "./config.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RESULTS_DIR = path.join(__dirname, "results");
const THRESHOLDS_FILE = path.join(__dirname, "thresholds.json");

// ── Helpers ────────────────────────────────────────────────────────────

function loadThresholds() {
  try {
    return JSON.parse(fs.readFileSync(THRESHOLDS_FILE, "utf-8"));
  } catch {
    return {};
  }
}

function ms(v) {
  return Number(v).toFixed(2) + " ms";
}

function pct(v) {
  return (v * 100).toFixed(2) + "%";
}

function latencySummary(l) {
  if (!l) return { p50: 0, p95: 0, p99: 0, avg: 0, max: 0 };
  return {
    p50: l.p50 ?? l.p2_5 ?? 0,
    p95: l.p95 ?? l.p97_5 ?? 0,
    p99: l.p99 ?? l.p99 ?? 0,
    avg: l.average ?? 0,
    max: l.max ?? 0,
  };
}

// ── Built-in Benchmark Engine ─────────────────────────────────────────

async function benchmarkEndpoint(endpoint, profile, thresholds, authToken) {
  const url = `${baseURL()}${endpoint.path}`;
  const start = performance.now();

  const results = {
    endpoint: endpoint.label || endpoint.path,
    method: endpoint.method,
    path: endpoint.path,
    auth: !!endpoint.auth,
    timestamp: new Date().toISOString(),
    config: { connections: profile.connections, duration: profile.duration },
  };

  // Determine number of requests for our sample
  const sampleCount = Math.max(
    profile.connections * 2,
    100
  );

  // Run sequential requests to measure latency
  const latencies = [];
  let errors = 0;

  for (let i = 0; i < sampleCount; i++) {
    const reqStart = performance.now();
    try {
      const response = await fetch(url, {
        method: endpoint.method,
        headers: {
          "Content-Type": "application/json",
          ...(endpoint.auth && authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: endpoint.payload ? JSON.stringify(endpoint.payload) : undefined,
        signal: AbortSignal.timeout(10000),
      });
      const reqEnd = performance.now();
      latencies.push(reqEnd - reqStart);

      if (!response.ok && response.status < 400) {
        // 4xx is "expected" in benchmark context (e.g., auth required)
        if (response.status >= 500) errors++;
      }
    } catch {
      errors++;
    }
  }

  const elapsed = (performance.now() - start) / 1000;

  // Compute metrics
  latencies.sort((a, b) => a - b);
  const total = latencies.length;
  const sum = latencies.reduce((a, b) => a + b, 0);

  results.metrics = {
    totalRequests: total,
    errors,
    errorRate: total > 0 ? errors / total : 0,
    latency: {
      p50: latencies[Math.floor(total * 0.5)] || 0,
      p95: latencies[Math.floor(total * 0.95)] || 0,
      p99: latencies[Math.floor(total * 0.99)] || 0,
      avg: total > 0 ? sum / total : 0,
      min: latencies[0] || 0,
      max: latencies[latencies.length - 1] || 0,
    },
    throughput: total / elapsed,
  };

  // Check against thresholds
  const t = thresholds[endpoint.label] || thresholds["*"] || {};
  results.thresholds = {
    p99_warn: t.p99_warn || 2000,
    p99_fail: t.p99_fail || 5000,
    error_rate_warn: t.error_rate_warn || 0.05,
    error_rate_fail: t.error_rate_fail || 0.10,
  };
  results.passed = (
    results.metrics.latency.p99 <= results.thresholds.p99_fail &&
    results.metrics.errorRate <= results.thresholds.error_rate_fail
  );

  return results;
}

// ── Main ───────────────────────────────────────────────────────────────

async function main() {
  // Parse CLI args
  const args = process.argv.slice(2);
  const flags = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--quick") flags.quick = true;
    else if (args[i] === "--list") flags.list = true;
    else if (args[i] === "--connections") flags.connections = parseInt(args[++i]);
    else if (args[i] === "--duration") flags.duration = parseInt(args[++i]);
  }

  if (flags.list) {
    console.log("Available endpoints:");
    for (const ep of BENCHMARK_ENDPOINTS) {
      console.log(`  ${ep.method.padEnd(6)} ${ep.path}`);
    }
    process.exit(0);
  }

  // Profile
  const profile = { ...BENCHMARK_PROFILE };
  if (flags.quick) {
    profile.duration = 5;
    profile.connections = 5;
  }
  if (flags.connections) profile.connections = flags.connections;
  if (flags.duration) profile.duration = flags.duration;

  const thresholds = loadThresholds();
  const authToken = TARGET.authToken;
  const target = baseURL();

  console.log("=".repeat(70));
  console.log("  FreelanceFlow API Benchmark Suite");
  console.log("=".repeat(70));
  console.log(`  Target:       ${target}`);
  console.log(`  Connections:  ${profile.connections}`);
  console.log(`  Duration:     ${profile.duration}s`);
  console.log(`  Endpoints:    ${BENCHMARK_ENDPOINTS.length}`);
  console.log(`  Auth token:   ${authToken ? "✓ set" : "✗ none (auth routes will fail)"}`);
  console.log("=".repeat(70));

  // Run benchmarks
  const allResults = [];
  for (const endpoint of BENCHMARK_ENDPOINTS) {
    process.stdout.write(`  ${endpoint.method.padEnd(6)} ${endpoint.label.padEnd(20)} ... `);
    try {
      const result = await benchmarkEndpoint(endpoint, profile, thresholds, authToken);
      allResults.push(result);
      const lat = result.metrics.latency;
      const status = result.passed ? "✓" : "⚠";
      console.log(`${status} p50=${ms(lat.p50)} p95=${ms(lat.p95)} p99=${ms(lat.p99)} err=${pct(result.metrics.errorRate)}`);
    } catch (err) {
      console.log(`✗ error: ${err.message.slice(0, 60)}`);
    }
  }

  // Aggregate results
  const passed = allResults.filter((r) => r.passed).length;
  const failed = allResults.filter((r) => !r.passed).length;
  const allLatencies = allResults.flatMap((r) => [r.metrics.latency.p50, r.metrics.latency.p95, r.metrics.latency.p99]);

  const summary = {
    timestamp: new Date().toISOString(),
    target,
    profile,
    endpoints: BENCHMARK_ENDPOINTS.length,
    results: {
      passed,
      failed,
      total: allResults.length,
    },
    overall: {
      avgP50: allResults.reduce((s, r) => s + r.metrics.latency.p50, 0) / allResults.length,
      avgP95: allResults.reduce((s, r) => s + r.metrics.latency.p95, 0) / allResults.length,
      avgP99: allResults.reduce((s, r) => s + r.metrics.latency.p99, 0) / allResults.length,
      avgThroughput: allResults.reduce((s, r) => s + r.metrics.throughput, 0) / allResults.length,
      avgErrorRate: allResults.reduce((s, r) => s + r.metrics.errorRate, 0) / allResults.length,
    },
    details: allResults,
  };

  // Write JSON results
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
  const jsonFile = path.join(RESULTS_DIR, `benchmark-${Date.now()}.json`);
  fs.writeFileSync(jsonFile, JSON.stringify(summary, null, 2));
  console.log(`\n📄 Results written to: ${jsonFile}`);

  // Write Markdown summary
  const mdFile = path.join(RESULTS_DIR, `benchmark-${Date.now()}.md`);
  const md = generateMarkdown(summary);
  fs.writeFileSync(mdFile, md);
  console.log(`📄 Report written to: ${mdFile}`);

  console.log(`\n📊 Summary: ${passed} passed, ${failed} failed (of ${allResults.length})`);

  // Exit with error if too many failures
  if (failed > allResults.length * 0.3) {
    console.error("❌ Too many failures — benchmark gate failed");
    process.exit(1);
  }
}

function generateMarkdown(summary) {
  const { overall } = summary;
  let md = `# API Benchmark Report\n\n`;
  md += `**Date:** ${summary.timestamp}\n`;
  md += `**Target:** ${summary.target}\n`;
  md += `**Profile:** ${summary.profile.connections} connections, ${summary.profile.duration}s duration\n\n`;

  md += `## Overall Metrics\n\n`;
  md += `| Metric | Value |\n`;
  md += `|--------|-------|\n`;
  md += `| Avg p50 Latency | ${ms(overall.avgP50)} |\n`;
  md += `| Avg p95 Latency | ${ms(overall.avgP95)} |\n`;
  md += `| Avg p99 Latency | ${ms(overall.avgP99)} |\n`;
  md += `| Throughput (avg) | ${overall.avgThroughput.toFixed(2)} req/s |\n`;
  md += `| Error Rate (avg) | ${pct(overall.avgErrorRate)} |\n`;
  md += `| Endpoints: ${summary.results.passed} ✓ / ${summary.results.failed} ⚠ | |\n\n`;

  md += `## Per-Endpoint Results\n\n`;
  md += `| Endpoint | Method | p50 | p95 | p99 | Throughput | Errors | Status |\n`;
  md += `|----------|--------|-----|-----|-----|------------|--------|--------|\n`;
  for (const r of summary.details) {
    md += `| ${r.endpoint} | ${r.method} | ${ms(r.metrics.latency.p50)} | ${ms(r.metrics.latency.p95)} | ${ms(r.metrics.latency.p99)} | ${r.metrics.throughput.toFixed(1)} req/s | ${pct(r.metrics.errorRate)} | ${r.passed ? "✓" : "⚠"} |\n`;
  }

  md += `\n## Endpoints Tested\n\n`;
  for (const r of summary.details) {
    md += `- ${r.method} \`${r.path}\`${r.auth ? " (auth)" : ""}\n`;
  }

  return md;
}

// ── Main ───────────────────────────────────────────────────────────────

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
