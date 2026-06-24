#!/usr/bin/env node

/**
 * API Benchmark Suite
 *
 * Scans all /api/* routes on the Express.js backend using autocannon.
 * Measures: p50/p95/p99 latency, RPS, error rate, TTFB
 * Outputs: JSON report to stdout and benchmarks/report.json
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

// ── Main ─────────────────────────────────────────────────────────

async function main() {
  console.error("=== API Benchmark Suite ===");
  console.error(`Target: ${BASE_URL}\n`);

  // 1. Start the API server
  console.error("Starting API server...");
  const server = spawn("node", ["src/server.js"], {
    cwd: API_DIR,
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env,
      PORT: String(API_PORT),
      NODE_ENV: "development",
      // These are not set in .env — the app handles them gracefully
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
  const maxWait = 15000;  // 15 seconds
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
    // Try one more time with the output
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
    // Aggregate latency from all p50/p95/p99 across routes
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

  // 6. Write report
  const reportPath = path.resolve(__dirname, "report.json");
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf-8");

  // 7. Print report
  console.log(JSON.stringify(report, null, 2));
  console.error(`\nReport written to: ${reportPath}`);
}

main().catch((err) => {
  console.error("Benchmark failed:", err);
  process.exit(1);
});
