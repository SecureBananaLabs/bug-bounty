#!/usr/bin/env node
/**
 * FreelanceFlow API Benchmark Suite
 * Uses autocannon to measure p50/p95/p99 latency, RPS, error rate, TTFB
 * for all /api/* endpoints.
 *
 * Usage: npm run benchmark
 * Config: .env.benchmark
 */

import autocannon from "autocannon";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

dotenv.config({ path: resolve(ROOT, ".env.benchmark") });

const HOST = process.env.BENCHMARK_HOST || "http://localhost:3000";
const DURATION = parseInt(process.env.BENCHMARK_DURATION || "10", 10);
const CONNECTIONS = parseInt(process.env.BENCHMARK_CONNECTIONS || "10", 10);
const AUTH_TOKEN = process.env.BENCHMARK_AUTH_TOKEN || "";
const ADMIN_TOKEN = process.env.BENCHMARK_ADMIN_TOKEN || "";
const RESULTS_DIR = resolve(ROOT, process.env.BENCHMARK_RESULTS_DIR || "benchmarks/results");

const authHeader = AUTH_TOKEN ? { Authorization: `Bearer ${AUTH_TOKEN}` } : {};
const adminHeader = ADMIN_TOKEN ? { Authorization: `Bearer ${ADMIN_TOKEN}` } : {};

/** Endpoint definitions */
const ENDPOINTS = [
  { name: "health", path: "/health", method: "GET", headers: {} },
  { name: "auth_register", path: "/api/auth/register", method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "bench@test.com", password: "Bench1234!", name: "Bench User", role: "freelancer" }) },
  { name: "auth_login", path: "/api/auth/login", method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "bench@test.com", password: "Bench1234!" }) },
  { name: "jobs_list", path: "/api/jobs", method: "GET", headers: authHeader },
  { name: "users_list", path: "/api/users", method: "GET", headers: adminHeader },
  { name: "proposals_list", path: "/api/proposals", method: "GET", headers: authHeader },
  { name: "search", path: "/api/search?q=developer", method: "GET", headers: {} },
  { name: "reviews_list", path: "/api/reviews", method: "GET", headers: authHeader },
  { name: "messages_list", path: "/api/messages", method: "GET", headers: authHeader },
  { name: "notifications_list", path: "/api/notifications", method: "GET", headers: authHeader },
  { name: "admin_users", path: "/api/admin/users", method: "GET", headers: adminHeader },
];

function extractMetrics(result) {
  const lat = result.latency;
  const req = result.requests;
  const errors = result.errors || 0;
  const totalReqs = req.total || 1;
  return {
    p50_ms: lat.p50,
    p95_ms: lat.p95,
    p99_ms: lat.p99,
    mean_ms: Math.round(lat.mean),
    rps_peak: req.max,
    rps_sustained: Math.round(req.mean),
    error_rate_pct: parseFloat(((errors / totalReqs) * 100).toFixed(2)),
    ttfb_p95_ms: lat.p95,
    total_requests: totalReqs,
    duration_s: result.duration,
  };
}

async function runBenchmark(endpoint) {
  return new Promise((resolve, reject) => {
    const opts = {
      url: `${HOST}${endpoint.path}`,
      method: endpoint.method,
      headers: endpoint.headers || {},
      body: endpoint.body,
      duration: DURATION,
      connections: CONNECTIONS,
      pipelining: 1,
    };
    const instance = autocannon(opts, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
    autocannon.track(instance, { renderProgressBar: false });
  });
}

async function main() {
  mkdirSync(RESULTS_DIR, { recursive: true });

  const thresholds = JSON.parse(readFileSync(resolve(ROOT, "benchmarks/thresholds.json"), "utf8"));
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const allResults = [];
  const violations = [];

  console.log(`\n🚀 FreelanceFlow API Benchmark Suite`);
  console.log(`   Host: ${HOST} | Duration: ${DURATION}s | Connections: ${CONNECTIONS}\n`);

  for (const endpoint of ENDPOINTS) {
    process.stdout.write(`  Benchmarking ${endpoint.method} ${endpoint.path} ... `);
    try {
      const raw = await runBenchmark(endpoint);
      const metrics = extractMetrics(raw);
      const result = { endpoint: endpoint.name, path: endpoint.path, method: endpoint.method, ...metrics };
      allResults.push(result);

      // Check threshold
      const key = Object.keys(thresholds.endpoints).find(k => endpoint.path.startsWith(k));
      const threshold = key ? thresholds.endpoints[key].p99_latency_ms : thresholds.defaults.p99_latency_ms;
      const passed = metrics.p99_ms <= threshold;
      if (!passed) violations.push({ ...result, threshold_ms: threshold });

      console.log(`p99=${metrics.p99_ms}ms rps=${metrics.rps_sustained} err=${metrics.error_rate_pct}% ${passed ? "✅" : "❌ THRESHOLD EXCEEDED"}`);
    } catch (err) {
      console.log(`ERROR: ${err.message}`);
      allResults.push({ endpoint: endpoint.name, path: endpoint.path, method: endpoint.method, error: err.message });
    }
  }

  // Write JSON results
  const jsonPath = resolve(RESULTS_DIR, `benchmark-${timestamp}.json`);
  writeFileSync(jsonPath, JSON.stringify({ timestamp, host: HOST, duration_s: DURATION, connections: CONNECTIONS, results: allResults }, null, 2));

  // Write Markdown summary
  const mdPath = resolve(RESULTS_DIR, `benchmark-${timestamp}.md`);
  const mdLines = [
    `# API Benchmark Results`,
    ``,
    `**Date:** ${new Date().toISOString()}  `,
    `**Host:** ${HOST}  `,
    `**Duration:** ${DURATION}s per endpoint  `,
    `**Connections:** ${CONNECTIONS} concurrent  `,
    ``,
    `## Results`,
    ``,
    `| Endpoint | Method | p50 (ms) | p95 (ms) | p99 (ms) | RPS | Error % | Status |`,
    `|----------|--------|----------|----------|----------|-----|---------|--------|`,
    ...allResults.map(r => {
      if (r.error) return `| ${r.path} | ${r.method} | - | - | - | - | - | ❌ ERROR |`;
      const key = Object.keys(thresholds.endpoints).find(k => r.path.startsWith(k));
      const threshold = key ? thresholds.endpoints[key].p99_latency_ms : thresholds.defaults.p99_latency_ms;
      const status = r.p99_ms <= threshold ? "✅ PASS" : "❌ FAIL";
      return `| ${r.path} | ${r.method} | ${r.p50_ms} | ${r.p95_ms} | ${r.p99_ms} | ${r.rps_sustained} | ${r.error_rate_pct}% | ${status} |`;
    }),
    ``,
    violations.length > 0
      ? `## ⚠️ Threshold Violations\n\n${violations.map(v => `- **${v.path}**: p99=${v.p99_ms}ms exceeds threshold of ${v.threshold_ms}ms`).join("\n")}`
      : `## ✅ All endpoints within thresholds`,
  ];
  writeFileSync(mdPath, mdLines.join("\n"));

  console.log(`\n📊 Results saved:`);
  console.log(`   JSON: ${jsonPath}`);
  console.log(`   MD:   ${mdPath}`);

  if (violations.length > 0) {
    console.error(`\n❌ ${violations.length} threshold violation(s) detected. CI gate FAILED.`);
    process.exit(1);
  } else {
    console.log(`\n✅ All endpoints within thresholds. CI gate PASSED.`);
  }
}

main().catch(err => { console.error(err); process.exit(1); });
