#!/usr/bin/env node

/**
 * API Benchmark Suite
 *
 * Scans all /api/* routes on the Express.js backend using autocannon.
 * Measures: p50/p95/p99 latency, RPS, error rate, TTFB
 * Outputs: JSON results to benchmarks/results/, markdown report, and stdout
 * CI Mode: compares against thresholds.json for regression gate
 */

import autocannon from "autocannon";
import fs from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const API_DIR = path.resolve(__dirname, "..", "apps", "api");
const API_PORT = 4000;  // matches src/config/env.js default
const BASE_URL = `http://127.0.0.1:${API_PORT}`;

// Directories for output
const RESULTS_DIR = path.resolve(__dirname, "results");
const THRESHOLDS_FILE = path.resolve(__dirname, "thresholds.json");

// ── Route inventory ──────────────────────────────────────────────
// All routes discovered from apps/api/src/routes/*.js + app.js
const ROUTES = [
  { method: "GET", path: "/health", label: "GET /health" },
  { method: "GET", path: "/api/jobs", label: "GET /api/jobs" },
  { method: "GET", path: "/api/users", label: "GET /api/users" },
  { method: "GET", path: "/api/proposals", label: "GET /api/proposals" },
  { method: "GET", path: "/api/reviews", label: "GET /api/reviews" },
  { method: "GET", path: "/api/messages", label: "GET /api/messages" },
  { method: "GET", path: "/api/notifications", label: "GET /api/notifications" },
  { method: "GET", path: "/api/search", label: "GET /api/search" },
  { method: "POST", path: "/api/auth/register", label: "POST /api/auth/register", body: { email: "bench@test.local", password: "BenchPass123!", name: "Benchmark" } },
  { method: "POST", path: "/api/auth/login", label: "POST /api/auth/login", body: { email: "bench@test.local", password: "BenchPass123!" } },
  { method: "POST", path: "/api/jobs", label: "POST /api/jobs", body: { title: "Benchmark Job", description: "Test", budget: 100, category: "dev" } },
  { method: "POST", path: "/api/users", label: "POST /api/users", body: { name: "Bench User", email: `bench_${Date.now()}@test.local` } },
  { method: "POST", path: "/api/proposals", label: "POST /api/proposals", body: { jobId: "1", coverLetter: "I can do this", rate: 50 } },
  { method: "POST", path: "/api/payments", label: "POST /api/payments", body: { amount: 100, currency: "usd", source: "tok_visa" } },
  { method: "POST", path: "/api/reviews", label: "POST /api/reviews", body: { targetUserId: "user_1", rating: 5, comment: "Great" } },
  { method: "POST", path: "/api/messages", label: "POST /api/messages", body: { receiverId: "user_2", content: "Hello from benchmark" } },
  { method: "POST", path: "/api/notifications", label: "POST /api/notifications", body: { userId: "user_1", type: "info", message: "Test notification" } },
];

// ── Helpers ──────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Run autocannon for a single route, return structured results */
async function benchmarkRoute(route) {
  const url = `${BASE_URL}${route.path}`;

  const opts = {
    url,
    connections: 10,      // 10 concurrent connections
    pipelining: 1,        // no pipelining
    duration: 10,         // 10 seconds per route
    timeout: 10,
    method: route.method,
    headers: {
      "content-type": "application/json",
    },
  };

  if (route.body) {
    opts.body = JSON.stringify(route.body);
  }

  console.error(`  [bench] ${route.method} ${route.path} ...`);

  const result = await autocannon(opts);

  // Extract metrics
  const lat = result.latency;
  const req = result.requests;
  const errors = result.errors;
  const timeouts = result.timeouts;
  const non2xx = result.non2xx;
  const totalReq = req.sent || 0;
  const totalErrors = (errors || 0) + (timeouts || 0) + (non2xx || 0);

  // TTFB from autocannon
  const ttfb = result.ttfb;

  return {
    route: route.label,
    method: route.method,
    path: route.path,
    durationSec: opts.duration,
    connections: opts.connections,
    requests: {
      total: totalReq,
      average: req.average || 0,
      mean: req.mean || 0,
      stddev: req.stddev || 0,
      max: req.max || 0,
      /** Requests per second (calculated) */
      rps: totalReq / opts.duration,
      /** Sent (total requests autocannon generated) */
      sent: req.sent || 0,
    },
    latency: {
      min: lat.min || 0,
      max: lat.max || 0,
      average: lat.average || 0,
      p50: lat.p50 || 0,
      p75: lat.p75 || 0,
      p90: lat.p90 || 0,
      p95: lat.p95 || 0,
      p99: lat.p99 || 0,
      p999: lat.p999 || 0,
      stddev: lat.stddev || 0,
    },
    ttfb: {
      min: ttfb ? ttfb.min : 0,
      max: ttfb ? ttfb.max : 0,
      average: ttfb ? ttfb.average : 0,
      p50: ttfb ? ttfb.p50 : 0,
      p75: ttfb ? ttfb.p75 : 0,
      p90: ttfb ? ttfb.p90 : 0,
      p95: ttfb ? ttfb.p95 : 0,
      p99: ttfb ? ttfb.p99 : 0,
    },
    errors: {
      total: totalErrors,
      rate: totalReq > 0 ? (totalErrors / totalReq) * 100 : 0,
      timeout: timeouts || 0,
      non2xx: non2xx || 0,
    },
    throughput: {
      total: result.throughput ? result.throughput.total : 0,
      average: result.throughput ? result.throughput.average : 0,
    },
  };
}

/**
 * Generate a Markdown report from benchmark results.
 */
function generateMarkdownReport(report) {
  const { summary, routes } = report;
  const lines = [];

  lines.push("# API Benchmark Report");
  lines.push("");
  lines.push(`**Generated:** ${summary.timestamp}`);
  lines.push(`**Target:** ${summary.target}`);
  lines.push(`**Duration per route:** ${summary.durationPerRouteSec}s`);
  lines.push(`**Concurrent connections:** ${summary.concurrentConnections}`);
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push("| Metric | Value |");
  lines.push("|--------|-------|");
  lines.push(`| Total Routes Tested | ${summary.totalRoutesTested} |`);
  lines.push(`| Routes Successful | ${summary.routesSuccessful} |`);
  lines.push(`| Total Requests | ${summary.totalRequests.toLocaleString()} |`);
  lines.push(`| Total Errors | ${summary.totalErrors.toLocaleString()} |`);
  lines.push(`| Overall Error Rate | ${summary.overallErrorRate.toFixed(2)}% |`);
  lines.push(`| Average RPS | ${summary.averageRps.toFixed(2)} |`);
  lines.push(`| Aggregate Latency p50 | ${summary.aggregateLatency.p50.toFixed(2)} ms |`);
  lines.push(`| Aggregate Latency p95 | ${summary.aggregateLatency.p95.toFixed(2)} ms |`);
  lines.push(`| Aggregate Latency p99 | ${summary.aggregateLatency.p99.toFixed(2)} ms |`);
  lines.push("");

  lines.push("## Route Details");
  lines.push("");
  lines.push("| Route | Method | RPS | p50 (ms) | p95 (ms) | p99 (ms) | Error Rate |");
  lines.push("|-------|--------|-----|----------|----------|----------|------------|");

  for (const r of routes) {
    if (r.error) {
      lines.push(`| ${r.route} | ${r.method} | ERROR | — | — | — | — |`);
      continue;
    }
    const rps = r.requests.rps ? r.requests.rps.toFixed(1) : "—";
    const p50 = r.latency.p50 ? r.latency.p50.toFixed(2) : "—";
    const p95 = r.latency.p95 ? r.latency.p95.toFixed(2) : "—";
    const p99 = r.latency.p99 ? r.latency.p99.toFixed(2) : "—";
    const errRate = r.errors.rate ? r.errors.rate.toFixed(2) + "%" : "0%";
    lines.push(`| ${r.route} | ${r.method} | ${rps} | ${p50} | ${p95} | ${p99} | ${errRate} |`);
  }

  lines.push("");
  lines.push("---");
  lines.push("*Report generated by API Benchmark Suite*");
  lines.push("");

  return lines.join("\n");
}

/**
 * Compare results against thresholds and return pass/fail status.
 */
function checkThresholds(report) {
  let passed = true;
  const failures = [];

  // Determine CI mode: CI=true environment variable or --ci flag
  const ci = process.env.CI === "true" || process.argv.includes("--ci");

  if (!ci && !fs.existsSync(THRESHOLDS_FILE)) {
    console.error("[thresholds] No thresholds file found (benchmarks/thresholds.json). Skipping regression gate.");
    return { passed: true, ci: false, failures: [] };
  }

  let thresholds;
  try {
    thresholds = JSON.parse(fs.readFileSync(THRESHOLDS_FILE, "utf-8"));
  } catch {
    console.error("[thresholds] Could not read thresholds.json. Skipping regression gate.");
    return { passed: true, ci, failures: [] };
  }

  if (!thresholds.routes) {
    console.error("[thresholds] No threshold rules found.");
    return { passed: true, ci, failures: [] };
  }

  for (const rule of thresholds.routes) {
    const routeResult = report.routes.find(
      (r) => r.route === rule.route || (r.method === rule.method && r.path === rule.path)
    );
    if (!routeResult || routeResult.error) continue;

    if (rule.maxLatencyP95 != null && routeResult.latency.p95 > rule.maxLatencyP95) {
      failures.push(`Route ${routeResult.route}: p95 latency ${routeResult.latency.p95.toFixed(2)}ms exceeds threshold ${rule.maxLatencyP95}ms`);
      passed = false;
    }
    if (rule.maxLatencyP99 != null && routeResult.latency.p99 > rule.maxLatencyP99) {
      failures.push(`Route ${routeResult.route}: p99 latency ${routeResult.latency.p99.toFixed(2)}ms exceeds threshold ${rule.maxLatencyP99}ms`);
      passed = false;
    }
    if (rule.minRps != null && routeResult.requests.rps < rule.minRps) {
      failures.push(`Route ${routeResult.route}: RPS ${routeResult.requests.rps.toFixed(1)} is below threshold ${rule.minRps}`);
      passed = false;
    }
    if (rule.maxErrorRate != null && routeResult.errors.rate > rule.maxErrorRate) {
      failures.push(`Route ${routeResult.route}: error rate ${routeResult.errors.rate.toFixed(2)}% exceeds threshold ${rule.maxErrorRate}%`);
      passed = false;
    }
  }

  if (failures.length > 0) {
    console.error("[thresholds] REGRESSION DETECTED:");
    for (const f of failures) {
      console.error(`  ✗ ${f}`);
    }
  } else {
    console.error("[thresholds] All thresholds passed ✓");
  }

  return { passed, ci, failures };
}

// ── Main ─────────────────────────────────────────────────────────

async function main() {
  console.error("=== API Benchmark Suite ===");
  console.error(`Target: ${BASE_URL}\n`);

  // Ensure output directories exist
  if (!fs.existsSync(RESULTS_DIR)) {
    fs.mkdirSync(RESULTS_DIR, { recursive: true });
  }

  // 1. Start the API server
  console.error("Starting API server...");
  const server = spawn("node", ["src/server.js"], {
    cwd: API_DIR,
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env,
      PORT: String(API_PORT),
      NODE_ENV: "development",
      DATABASE_URL: "",
      JWT_SECRET: "benchmark-secret",
      STRIPE_SECRET_KEY: "",
    },
  });

  let serverOutput = "";
  server.stdout.on("data", (d) => {
    serverOutput += d.toString();
  });
  server.stderr.on("data", (d) => {
    serverOutput += d.toString();
  });

  // 2. Wait for server to be ready
  const maxWait = 15000;
  const startTime = Date.now();
  let ready = false;

  while (Date.now() - startTime < maxWait) {
    try {
      const resp = await fetch(`${BASE_URL}/health`);
      if (resp.ok) {
        ready = true;
        break;
      }
    } catch {
      // server not up yet
    }
    await sleep(300);
  }

  if (!ready) {
    console.error("Server output so far:");
    console.error(serverOutput);
    server.kill();
    console.error("FATAL: API server did not start in time");
    process.exit(1);
  }

  console.error("API server is ready.\n");

  // 3. Run benchmarks
  const results = [];
  for (const route of ROUTES) {
    try {
      const r = await benchmarkRoute(route);
      results.push(r);
    } catch (err) {
      console.error(`  [ERROR] ${route.method} ${route.path}: ${err.message}`);
      results.push({
        route: route.label,
        method: route.method,
        path: route.path,
        error: err.message,
      });
    }
  }

  // 4. Compute summary
  const successful = results.filter((r) => !r.error);
  const rpsValues = successful.map((r) => r.requests.rps).filter((v) => v > 0);
  const avgRps =
    rpsValues.length > 0
      ? rpsValues.reduce((a, b) => a + b, 0) / rpsValues.length
      : 0;

  const totalRequests = successful.reduce((a, r) => a + (r.requests.total || 0), 0);
  const totalErrors = successful.reduce((a, r) => a + (r.errors.total || 0), 0);

  const summary = {
    timestamp: new Date().toISOString(),
    target: BASE_URL,
    durationPerRouteSec: 10,
    concurrentConnections: 10,
    totalRoutesTested: ROUTES.length,
    routesSuccessful: successful.length,
    totalRequests,
    totalErrors,
    overallErrorRate: totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0,
    averageRps: Math.round(avgRps * 100) / 100,
    aggregateLatency: {
      p50: Math.round(successful.reduce((a, r) => a + (r.latency.p50 || 0), 0) / Math.max(1, successful.length) * 100) / 100,
      p95: Math.round(successful.reduce((a, r) => a + (r.latency.p95 || 0), 0) / Math.max(1, successful.length) * 100) / 100,
      p99: Math.round(successful.reduce((a, r) => a + (r.latency.p99 || 0), 0) / Math.max(1, successful.length) * 100) / 100,
    },
  };

  const report = {
    summary,
    routes: results,
  };

  // 5. Kill server
  server.kill("SIGTERM");
  await sleep(500);
  try {
    server.kill("SIGKILL");
  } catch {}

  // 6. Write JSON results to benchmarks/results/
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const resultFilename = `benchmark-${timestamp}.json`;
  const resultPath = path.resolve(RESULTS_DIR, resultFilename);
  fs.writeFileSync(resultPath, JSON.stringify(report, null, 2), "utf-8");
  console.error(`\nJSON results written to: ${resultPath}`);

  // Also write latest.json (overwrite) for easy CI reference
  const latestPath = path.resolve(RESULTS_DIR, "latest.json");
  fs.writeFileSync(latestPath, JSON.stringify(report, null, 2), "utf-8");

  // 7. Generate markdown report
  const markdown = generateMarkdownReport(report);
  const mdFilename = `benchmark-${timestamp}.md`;
  const mdPath = path.resolve(RESULTS_DIR, mdFilename);
  fs.writeFileSync(mdPath, markdown, "utf-8");
  console.error(`Markdown report written to: ${mdPath}`);

  // Also write latest.md
  const latestMdPath = path.resolve(RESULTS_DIR, "latest.md");
  fs.writeFileSync(latestMdPath, markdown, "utf-8");

  // 8. Check thresholds
  const thresholdCheck = checkThresholds(report);
  if (thresholdCheck.ci && !thresholdCheck.passed) {
    console.error("\n[CI] ❌ Threshold check failed! Exiting with code 1.");
    process.exit(1);
  }

  // 9. Print report to stdout (JSON for piping)
  console.log(JSON.stringify(report, null, 2));
}

main().catch((err) => {
  console.error("Benchmark failed:", err);
  process.exit(1);
});
