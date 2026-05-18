#!/usr/bin/env node

/**
 * API Benchmark Runner
 *
 * Uses autocannon to benchmark all /api/ endpoints and produces:
 *   - JSON results per endpoint in benchmarks/results/
 *   - A summary Markdown file
 *
 * Usage:
 *   npm run benchmark
 *   node benchmarks/benchmark.js
 *
 * Environment variables (optional, see benchmarks/.env.benchmark):
 *   API_BASE_URL    – default http://localhost:4000
 *   CONNECTIONS     – default 10
 *   TOTAL_REQUESTS  – default 100
 *   DURATION        – default "" (use TOTAL_REQUESTS)
 *   PIPELINE        – default 1
 *   THRESHOLDS_PATH – default benchmarks/thresholds.json
 *   RESULTS_DIR     – default benchmarks/results
 */

import autocannon from "autocannon";
import { readFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

// ─── Paths ───────────────────────────────────────────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const API_BASE = process.env.API_BASE_URL ?? "http://localhost:4000";
const CONNECTIONS = Number(process.env.CONNECTIONS ?? 10);
const TOTAL_REQUESTS = Number(process.env.TOTAL_REQUESTS ?? 100);
const DURATION = process.env.DURATION ? Number(process.env.DURATION) : undefined;
const PIPELINE = Number(process.env.PIPELINE ?? 1);
const THRESHOLDS_PATH =
  process.env.THRESHOLDS_PATH ?? resolve(__dirname, "thresholds.json");
const RESULTS_DIR =
  process.env.RESULTS_DIR ?? resolve(__dirname, "results");

// Ensure results directory exists
mkdirSync(RESULTS_DIR, { recursive: true });

// ─── Endpoint definitions ────────────────────────────────────────────────────
// Each entry: { method, path, title, body?, headers? }
// POST bodies match the Zod validators found in the codebase.

const ENDPOINTS = [
  // Health
  { method: "GET", path: "/health", title: "Health Check" },

  // Auth
  { method: "POST", path: "/api/auth/register", title: "Auth Register",
    body: { email: "bench@test.com", password: "benchmark1", role: "freelancer" } },
  { method: "POST", path: "/api/auth/login", title: "Auth Login",
    body: { email: "bench@test.com", password: "benchmark1" } },
  { method: "GET", path: "/api/auth/oauth/google/callback", title: "Auth OAuth Callback" },
  { method: "POST", path: "/api/auth/refresh", title: "Auth Refresh" },

  // Users
  { method: "GET", path: "/api/users", title: "List Users" },
  { method: "POST", path: "/api/users", title: "Create User",
    body: { name: "Bench User", email: `bench_${Date.now()}@test.com` } },

  // Jobs
  { method: "GET", path: "/api/jobs", title: "List Jobs" },
  { method: "POST", path: "/api/jobs", title: "Create Job",
    body: { title: "Build a website", description: "Need a full-stack developer for a freelance platform project.", budgetMin: 500, budgetMax: 5000, categoryId: "cat_webdev", skills: ["react", "node"] } },

  // Proposals
  { method: "GET", path: "/api/proposals", title: "List Proposals" },
  { method: "POST", path: "/api/proposals", title: "Create Proposal",
    body: { jobId: "job_bench", freelancerId: "usr_bench", coverLetter: "I am interested in this project and have relevant experience.", bidAmount: 2500 } },

  // Payments
  { method: "POST", path: "/api/payments", title: "Create Payment",
    body: { amount: 5000, currency: "usd" } },

  // Reviews
  { method: "GET", path: "/api/reviews", title: "List Reviews" },
  { method: "POST", path: "/api/reviews", title: "Create Review",
    body: { jobId: "job_bench", reviewerId: "usr_bench", revieweeId: "usr_other", rating: 5, comment: "Excellent work!" } },

  // Messages
  { method: "GET", path: "/api/messages", title: "List Messages" },
  { method: "POST", path: "/api/messages", title: "Send Message",
    body: { conversationId: "conv_bench", senderId: "usr_bench", content: "Hello, I am interested in your project." } },

  // Notifications
  { method: "GET", path: "/api/notifications", title: "List Notifications" },
  { method: "POST", path: "/api/notifications", title: "Create Notification",
    body: { userId: "usr_bench", type: "info", title: "Welcome", message: "Welcome to the platform!" } },

  // Search
  { method: "GET", path: "/api/search?q=developer", title: "Search" },
];

// ─── Thresholds ──────────────────────────────────────────────────────────────
function loadThresholds() {
  if (existsSync(THRESHOLDS_PATH)) {
    return JSON.parse(readFileSync(THRESHOLDS_PATH, "utf-8"));
  }
  console.warn("⚠  thresholds.json not found, using defaults");
  return { p99_latency_ms: 2000, p95_latency_ms: 1000, error_rate_pct: 5, min_rps: 10 };
}

// ─── Run a single autocannon benchmark ──────────────────────────────────────
function benchmarkEndpoint({ method, path, title, body, headers }) {
  return new Promise((resolve, reject) => {
    const url = `${API_BASE}${path}`;
    console.log(`\n── ${title} ──`);
    console.log(`  ${method} ${url}`);

    const opts = {
      url,
      method,
      connections: CONNECTIONS,
      pipelining: PIPELINE,
      headers: { "Content-Type": "application/json" },
      setupClient: (client) => {
        if (body) {
          client.setBody(JSON.stringify(body));
        }
      },
    };

    if (DURATION) {
      opts.duration = DURATION;
    } else {
      opts.amount = TOTAL_REQUESTS;
    }

    if (headers) {
      Object.assign(opts.headers, headers);
    }

    autocannon(opts, (err, result) => {
      if (err) return reject(err);
      resolve({ endpoint: path, method, title, result });
    });
  });
}

// ─── Parse autocannon result into metrics ───────────────────────────────────
function extractMetrics(data) {
  const r = data.result;
  const latencies = r.latency;

  return {
    endpoint: data.endpoint,
    method: data.method,
    title: data.title,
    metrics: {
      p50_ms: latencies.p50 != null ? Number(latencies.p50.toFixed(2)) : 0,
      p95_ms: latencies.p95 != null ? Number(latencies.p95.toFixed(2)) : 0,
      p99_ms: latencies.p99 != null ? Number(latencies.p99.toFixed(2)) : 0,
      avg_latency_ms: latencies.average != null ? Number(latencies.average.toFixed(2)) : 0,
      max_latency_ms: latencies.max != null ? Number(latencies.max.toFixed(2)) : 0,
      min_latency_ms: latencies.min != null ? Number(latencies.min.toFixed(2)) : 0,
      rps: { average: Number(r.requests.average?.toFixed(2) ?? 0), total: r.requests.total ?? 0 },
      throughput: { average: Number(r.throughput.average?.toFixed(2) ?? 0), total: r.throughput.total ?? 0 },
      total_requests: r.requests.total ?? 0,
      total_sent: r.requests.sent ?? 0,
      errors: r.errors ?? 0,
      timeouts: r.timeouts ?? 0,
      error_rate_pct: r.requests.total > 0
        ? Number((((r.errors ?? 0) + (r.timeouts ?? 0)) / r.requests.total * 100).toFixed(2))
        : 0,
      duration_seconds: r.duration ?? 0,
      // TTFB (Time to First Byte) – autocannon provides latencies which include TTFB
      ttfb_p50_ms: latencies.p50 != null ? Number(latencies.p50.toFixed(2)) : 0,
      ttfb_p95_ms: latencies.p95 != null ? Number(latencies.p95.toFixed(2)) : 0,
      ttfb_p99_ms: latencies.p99 != null ? Number(latencies.p99.toFixed(2)) : 0,
    },
    raw: r,
  };
}

// ─── Generate Markdown summary ──────────────────────────────────────────────
function generateMarkdownSummary(allMetrics, thresholds, passed) {
  const now = new Date().toISOString();
  let md = `# API Benchmark Results\n\n`;
  md += `**Date:** ${now}\n`;
  md += `**Base URL:** ${API_BASE}\n`;
  md += `**Connections:** ${CONNECTIONS}\n`;
  md += `**Requests/Endpoint:** ${DURATION ? `${DURATION}s` : TOTAL_REQUESTS}\n`;
  md += `**Pipeline:** ${PIPELINE}\n\n`;
  md += `| Endpoint | Method | p50 (ms) | p95 (ms) | p99 (ms) | Avg RPS | Errors | Error % |\n`;
  md += `|----------|--------|---------:|---------:|---------:|--------:|-------:|-------:|\n`;

  for (const ep of allMetrics) {
    const m = ep.metrics;
    md += `| ${ep.title} | ${ep.method} | ${m.p50_ms} | ${m.p95_ms} | ${m.p99_ms} | ${m.rps.average} | ${m.errors} | ${m.error_rate_pct}% |\n`;
  }

  md += `\n## Threshold Check\n\n`;
  md += `| Threshold | Value | Status |\n`;
  md += `|-----------|------:|:------|\n`;

  const worstP99 = Math.max(...allMetrics.map((e) => e.metrics.p99_ms));
  const worstP95 = Math.max(...allMetrics.map((e) => e.metrics.p95_ms));
  const worstErrorRate = Math.max(...allMetrics.map((e) => e.metrics.error_rate_pct));
  const minRpsActual = Math.min(...allMetrics.map((e) => e.metrics.rps.average));

  md += `| p99 ≤ ${thresholds.p99_latency_ms}ms | ${worstP99}ms | ${worstP99 <= thresholds.p99_latency_ms ? "✅ PASS" : "❌ FAIL"} |\n`;
  md += `| p95 ≤ ${thresholds.p95_latency_ms}ms | ${worstP95}ms | ${worstP95 <= thresholds.p95_latency_ms ? "✅ PASS" : "❌ FAIL"} |\n`;
  md += `| Error rate ≤ ${thresholds.error_rate_pct}% | ${worstErrorRate}% | ${worstErrorRate <= thresholds.error_rate_pct ? "✅ PASS" : "❌ FAIL"} |\n`;
  md += `| Min RPS ≥ ${thresholds.min_rps} | ${minRpsActual} | ${minRpsActual >= thresholds.min_rps ? "✅ PASS" : "❌ FAIL"} |\n`;

  md += `\n**Overall: ${passed ? "✅ PASSED" : "❌ FAILED"}**\n`;

  return md;
}

// ─── Start API server ────────────────────────────────────────────────────────
function startServer() {
  return new Promise((resolve, reject) => {
    const serverPath = resolve(ROOT, "apps/api/src/server.js");
    if (!existsSync(serverPath)) {
      console.warn("⚠  API server not found at", serverPath);
      console.warn("   Assuming server is already running...");
      return resolve(null);
    }

    console.log("Starting API server...");
    const child = spawn("node", [serverPath], {
      cwd: resolve(ROOT, "apps/api"),
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, PORT: "4000", NODE_ENV: "benchmark" },
    });

    child.stdout.on("data", (data) => {
      const msg = data.toString();
      process.stdout.write(`[server] ${msg}`);
      if (msg.includes("listening on")) {
        resolve(child);
      }
    });

    child.stderr.on("data", (data) => {
      process.stderr.write(`[server:err] ${data.toString()}`);
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code !== 0) reject(new Error(`Server exited with code ${code}`));
    });

    // Timeout after 15 seconds
    setTimeout(() => {
      console.warn("⚠  Server start timed out, trying anyway...");
      resolve(child);
    }, 15000);
  });
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log("═══════════════════════════════════════════");
  console.log("  SecureBananaLabs API Benchmark Suite");
  console.log("═══════════════════════════════════════════\n");

  const thresholds = loadThresholds();
  console.log("Thresholds:", JSON.stringify(thresholds, null, 2));

  // Start server (optional – benchmark against already-running server too)
  let serverProcess = null;
  try {
    serverProcess = await startServer();
  } catch (err) {
    console.warn("⚠  Could not start server:", err.message);
    console.warn("   Make sure the API is running on", API_BASE);
  }

  // Warmup: hit health endpoint to wake up the app
  console.log("\n── Warmup ──");
  try {
    await fetch(`${API_BASE}/health`);
    console.log("  ✓ Warmup complete");
  } catch {
    console.warn("  ⚠  Warmup failed (server may not be ready)");
  }

  // Run benchmarks sequentially
  const results = [];
  for (const ep of ENDPOINTS) {
    try {
      const raw = await benchmarkEndpoint(ep);
      const metrics = extractMetrics(raw);
      results.push(metrics);
      const m = metrics.metrics;
      console.log(`  → p50=${m.p50_ms}ms p95=${m.p95_ms}ms p99=${m.p99_ms}ms | RPS=${m.rps.average} | Errors=${m.errors} (${m.error_rate_pct}%)`);
    } catch (err) {
      console.error(`  ✗ Failed: ${err.message}`);
      results.push({
        endpoint: ep.path,
        method: ep.method,
        title: ep.title,
        metrics: { p50_ms: -1, p95_ms: -1, p99_ms: -1, avg_latency_ms: -1, max_latency_ms: -1, min_latency_ms: -1, rps: { average: 0, total: 0 }, throughput: { average: 0, total: 0 }, total_requests: 0, total_sent: 0, errors: 0, timeouts: 0, error_rate_pct: 100, duration_seconds: 0, ttfb_p50_ms: -1, ttfb_p95_ms: -1, ttfb_p99_ms: -1 },
        error: err.message,
      });
    }
  }

  // Write JSON results per endpoint
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  for (const ep of results) {
    const safeName = ep.title.replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase();
    const jsonPath = resolve(RESULTS_DIR, `${safeName}_${timestamp}.json`);
    writeFileSync(jsonPath, JSON.stringify(ep, null, 2));
  }

  // Write combined JSON
  const combinedPath = resolve(RESULTS_DIR, `full_benchmark_${timestamp}.json`);
  writeFileSync(combinedPath, JSON.stringify({ timestamp, api_base: API_BASE, results }, null, 2));

  // Check thresholds
  const worstP99 = Math.max(...results.map((e) => e.metrics.p99_ms));
  const worstP95 = Math.max(...results.map((e) => e.metrics.p95_ms));
  const worstErrorRate = Math.max(...results.map((e) => e.metrics.error_rate_pct));
  const minRpsActual = Math.min(...results.map((e) => e.metrics.rps.average));

  const passed =
    worstP99 <= thresholds.p99_latency_ms &&
    worstP95 <= thresholds.p95_latency_ms &&
    worstErrorRate <= thresholds.error_rate_pct &&
    minRpsActual >= thresholds.min_rps;

  // Generate and write Markdown summary
  const md = generateMarkdownSummary(results, thresholds, passed);
  const mdPath = resolve(RESULTS_DIR, `summary_${timestamp}.md`);
  writeFileSync(mdPath, md);

  console.log("\n═══════════════════════════════════════════");
  console.log(`  Results written to: ${RESULTS_DIR}/`);
  console.log(`  Summary: ${mdPath}`);
  console.log(`  Combined JSON: ${combinedPath}`);
  console.log("");

  // Print summary
  console.log("  Worst p99:", worstP99, "ms (threshold:", thresholds.p99_latency_ms, "ms)");
  console.log("  Worst p95:", worstP95, "ms (threshold:", thresholds.p95_latency_ms, "ms)");
  console.log("  Worst error rate:", worstErrorRate, "% (threshold:", thresholds.error_rate_pct, "%)");
  console.log("  Min RPS:", minRpsActual, "(threshold:", thresholds.min_rps, ")");
  console.log(`  Overall: ${passed ? "✅ PASSED" : "❌ FAILED"}`);
  console.log("═══════════════════════════════════════════\n");

  // Cleanup
  if (serverProcess) {
    console.log("Stopping API server...");
    serverProcess.kill("SIGTERM");
    // Give it a moment
    await new Promise((r) => setTimeout(r, 500));
  }

  // Exit with proper code for CI
  if (!passed) {
    console.error("❌ Benchmarks failed threshold checks!");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal benchmark error:", err);
  process.exit(1);
});
