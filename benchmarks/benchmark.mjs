import autocannon from "autocannon";
import {
  writeFileSync, mkdirSync, existsSync, readFileSync,
} from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createApp } from "../apps/api/src/app.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Config ────────────────────────────────────────────────────────────
const TARGET = process.env.TARGET_HOST ?? "http://localhost:4000";
const PORT = Number(process.env.BENCHMARK_PORT ?? 4000);
const TOKEN = process.env.BENCHMARK_TOKEN ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiZW5jaG1hcmstdXNlciIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc3ODk5OTk3MCwiZXhwIjoxNzc5MDAzNTcwfQ.h_0hrDmrguT_gr41PVubtVqZHSoauqrJGpXz2I87QrE";
const CONCURRENCY = Number(process.env.BENCHMARK_CONCURRENCY ?? 10);
const REQUESTS = Number(process.env.BENCHMARK_REQUESTS ?? 500);
const CI = process.env.CI === "true";
const THRESHOLDS = existsSync(resolve(__dirname, "thresholds.json"))
  ? JSON.parse(readFileSync(resolve(__dirname, "thresholds.json"), "utf-8"))
  : {};

// ── Route definitions ─────────────────────────────────────────────────
const ENDPOINTS = [
  { name: "GET /health", method: "GET", path: "/health" },

  // Auth
  { name: "POST /auth/login",  method: "POST", path: "/api/auth/login",
    body: JSON.stringify({ email: "test@example.com", password: "password123" }) },
  { name: "POST /auth/register", method: "POST", path: "/api/auth/register",
    body: JSON.stringify({ email: "bench@example.com", password: "Pass1234!", role: "freelancer" }) },
  { name: "GET /auth/oauth/github/callback", method: "GET", path: "/api/auth/oauth/github/callback" },

  // Users
  { name: "GET /users",  method: "GET", path: "/api/users" },
  { name: "POST /users", method: "POST", path: "/api/users",
    body: JSON.stringify({ name: "Bench User", email: "bench-user@example.com" }) },

  // Jobs
  { name: "GET /jobs",  method: "GET", path: "/api/jobs" },
  { name: "POST /jobs", method: "POST", path: "/api/jobs",
    body: JSON.stringify({ title: "Benchmark Job Post", description: "This is a benchmark job description for testing.", budgetMin: 50, budgetMax: 200, categoryId: "cat_1", skills: ["javascript"] }) },

  // Proposals
  { name: "GET /proposals",  method: "GET", path: "/api/proposals" },
  { name: "POST /proposals", method: "POST", path: "/api/proposals",
    body: JSON.stringify({ jobId: "job_1", coverLetter: "I am interested in this job.", proposedRate: 50 }) },

  // Payments
  { name: "POST /payments", method: "POST", path: "/api/payments",
    body: JSON.stringify({ amount: 2500, currency: "usd" }) },

  // Reviews
  { name: "GET /reviews",  method: "GET", path: "/api/reviews" },
  { name: "POST /reviews", method: "POST", path: "/api/reviews",
    body: JSON.stringify({ rating: 5, comment: "Great work!", reviewerId: "usr_1", revieweeId: "usr_2" }) },

  // Messages
  { name: "GET /messages",  method: "GET", path: "/api/messages" },
  { name: "POST /messages", method: "POST", path: "/api/messages",
    body: JSON.stringify({ senderId: "usr_1", receiverId: "usr_2", content: "Hello from benchmark!" }) },

  // Notifications
  { name: "GET /notifications",  method: "GET", path: "/api/notifications" },
  { name: "POST /notifications", method: "POST", path: "/api/notifications",
    body: JSON.stringify({ userId: "usr_1", type: "info", message: "Benchmark notification" }) },

  // Search
  { name: "GET /search?q=benchmark", method: "GET", path: "/api/search?q=benchmark" },

  // Admin (auth-protected)
  { name: "GET /admin/metrics", method: "GET", path: "/api/admin/metrics",
    headers: { authorization: `Bearer ${TOKEN}` } },
];

// ── Helpers ───────────────────────────────────────────────────────────
function ms(ns) {
  return (ns / 1e6).toFixed(2);
}

async function serverAlive(url) {
  try {
    const res = await fetch(url);
    // 429 rate-limited = server is alive, just throttled
    return res.ok || res.status === 429;
  } catch { return false; }
}

// ── Run a single endpoint benchmark ────────────────────────────────────
async function benchmarkEndpoint(endpoint) {
  const headers = {
    "content-type": "application/json",
    ...(endpoint.headers ?? {}),
  };

  const result = await autocannon({
    url: `${TARGET}${endpoint.path}`,
    method: endpoint.method,
    headers,
    body: endpoint.body,
    connections: CONCURRENCY,
    amount: REQUESTS,
    timeout: 30,
    title: endpoint.name,
  });

  const totalOk = result.requests.total || 1;
  const errors = (result.errors || 0) + (result.non2xx || 0) + (result.timeouts || 0);

  return {
    name: endpoint.name,
    method: endpoint.method,
    path: endpoint.path,
    latencies: {
      p50: ms(result.latency.p50),
      p75: ms(result.latency.p75),
      p90: ms(result.latency.p90),
      p97_5: ms(result.latency.p97_5),
      p99: ms(result.latency.p99),
    },
    requests: {
      average: result.requests.average,
      mean: result.requests.mean,
      total: result.requests.total,
      sent: result.requests.sent,
    },
    throughput: {
      average: result.throughput.average,
      mean: result.throughput.mean,
      total: result.throughput.total,
    },
    errors: result.errors,
    timeouts: result.timeouts,
    non2xx: result.non2xx,
    statusCodes: result.statusCodes,
    errorRate: ((errors / totalOk) * 100).toFixed(2),
  };
}

// ── Main ──────────────────────────────────────────────────────────────
async function main() {
  // Start server with crash protection
  process.on("uncaughtException", (err) => {
    console.error(`  [server-crash] ${err.message}\n  ${err.stack?.split("\n").slice(0,4).join("\n  ")}`);
  });
  process.on("unhandledRejection", (err) => {
    console.error(`  [server-reject] ${err?.message ?? err}`);
  });

  const app = createApp();
  const server = app.listen(PORT);
  await new Promise((r) => server.once("listening", r));
  console.log(`  Server started on port ${PORT}`);

  // Warm-up: health check
  const alive = await serverAlive(`${TARGET}/health`);
  if (!alive) {
    console.error("  Server failed to start");
    process.exit(1);
  }
  console.log("  Server health check passed\n");

  console.log(`  FreelanceFlow API Benchmark
  ────────────────────────────────────────
  Target      : ${TARGET}
  Concurrency : ${CONCURRENCY}
  Requests    : ${REQUESTS} per endpoint
  CI mode     : ${CI}
  Endpoints   : ${ENDPOINTS.length}
  ────────────────────────────────────────\n`);

  const results = [];
  for (const ep of ENDPOINTS) {
    // Check if server is still alive before each endpoint
    if (!(await serverAlive(`${TARGET}/health`))) {
      console.log(`  ${ep.name.padEnd(50)}... SKIP (server down)`);
      results.push({ name: ep.name, error: "server crashed before this endpoint" });
      continue;
    }

    process.stdout.write(`  ${ep.name.padEnd(50)}... `);
    try {
      const r = await benchmarkEndpoint(ep);
      results.push(r);
      console.log(
        `p50=${r.latencies.p50.padStart(8)}ms  p90=${r.latencies.p90.padStart(8)}ms  p99=${r.latencies.p99.padStart(8)}ms  err=${r.errorRate.padStart(6)}%  rps=${r.requests.average.toFixed(1)}`
      );
    } catch (err) {
      console.log(`FAILED — ${err.message}`);
      results.push({ name: ep.name, error: err.message });
    }
  }

  // ── Cleanup ─────────────────────────────────────────────────────────
  await new Promise((r) => server.close(r));

  // ── Generate summary ────────────────────────────────────────────────
  const okResults = results.filter((r) => !r.error);
  const skippedResults = results.filter((r) => r.error);

  let md = "# API Benchmark Report\n\n";
  md += `**Date:** ${new Date().toISOString().split("T")[0]}\n\n`;
  md += `**Configuration:**\n`;
  md += `- Target: ${TARGET}\n`;
  md += `- Concurrency: ${CONCURRENCY}\n`;
  md += `- Requests per endpoint: ${REQUESTS}\n`;
  md += `- Endpoints configured: ${ENDPOINTS.length}\n`;
  md += `- Endpoints completed: ${okResults.length}\n`;
  md += `- Endpoints skipped: ${skippedResults.length}\n\n`;

  if (okResults.length > 0) {
    md += `## Latency\n\n`;
    md += `| Endpoint | p50 (ms) | p90 (ms) | p99 (ms) | Avg RPS | Error Rate |\n`;
    md += `|---|---|---|---|---|---|\n`;
    for (const r of okResults) {
      md += `| ${r.name} | ${r.latencies.p50} | ${r.latencies.p90} | ${r.latencies.p99} | ${r.requests.average.toFixed(1)} | ${r.errorRate}% |\n`;
    }
    md += "\n";

    // Summary statistics
    const p99s = okResults.map((r) => parseFloat(r.latencies.p99)).filter((v) => !isNaN(v));
    const p90s = okResults.map((r) => parseFloat(r.latencies.p90)).filter((v) => !isNaN(v));
    const rps = okResults.map((r) => r.requests.average).filter((v) => !isNaN(v));
    md += "## Summary Statistics\n\n";
    if (p99s.length) md += `- Worst p99 latency: ${Math.max(...p99s)}ms\n`;
    if (p90s.length) md += `- Worst p90 latency: ${Math.max(...p90s)}ms\n`;
    if (rps.length) md += `- Lowest RPS: ${Math.min(...rps).toFixed(1)} req/s\n`;
    if (rps.length) md += `- Highest RPS: ${Math.max(...rps).toFixed(1)} req/s\n`;
    if (rps.length) md += `- Average RPS: ${(rps.reduce((a, b) => a + b, 0) / rps.length).toFixed(1)} req/s\n`;
    md += "\n";
  }

  if (skippedResults.length > 0) {
    md += "## Skipped / Failed Endpoints\n\n";
    for (const r of skippedResults) {
      md += `- ${r.name}: ${r.error}\n`;
    }
    md += "\n";
  }

  md += "---\n";
  md += `_Generated by FreelanceFlow Benchmark Suite at ${new Date().toISOString()}_\n`;

  const summaryJson = {
    date: new Date().toISOString(),
    config: { target: TARGET, concurrency: CONCURRENCY, requestsPerEndpoint: REQUESTS, ci: CI },
    thresholds: THRESHOLDS,
    endpointsTotal: ENDPOINTS.length,
    endpointsCompleted: okResults.length,
    endpointsSkipped: skippedResults.length,
    results,
  };

  // Write output files
  const resultsDir = resolve(__dirname, "results");
  mkdirSync(resultsDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  writeFileSync(resolve(resultsDir, `${timestamp}.json`), JSON.stringify(summaryJson, null, 2));
  writeFileSync(resolve(resultsDir, `${timestamp}.md`), md);
  writeFileSync(resolve(resultsDir, "latest.md"), md);
  writeFileSync(resolve(resultsDir, "latest.json"), JSON.stringify(summaryJson, null, 2));

  console.log(`\n  Results written to benchmarks/results/ (${timestamp})`);

  // ── Threshold check (CI mode) ───────────────────────────────────────
  if (CI && Object.keys(THRESHOLDS).length > 0 && okResults.length > 0) {
    let failures = 0;
    for (const r of okResults) {
      if (THRESHOLDS.p99_latency_ms && parseFloat(r.latencies.p99) > THRESHOLDS.p99_latency_ms) {
        console.error(`  FAIL: ${r.name} p99=${r.latencies.p99}ms > threshold ${THRESHOLDS.p99_latency_ms}ms`);
        failures++;
      }
      if (THRESHOLDS.p90_latency_ms && parseFloat(r.latencies.p90) > THRESHOLDS.p90_latency_ms) {
        console.error(`  FAIL: ${r.name} p90=${r.latencies.p90}ms > threshold ${THRESHOLDS.p90_latency_ms}ms`);
        failures++;
      }
      if (THRESHOLDS.error_rate_pct && parseFloat(r.errorRate) > THRESHOLDS.error_rate_pct) {
        console.error(`  FAIL: ${r.name} error rate ${r.errorRate}% > threshold ${THRESHOLDS.error_rate_pct}%`);
        failures++;
      }
    }
    if (failures > 0) {
      console.error(`\n  ✗ ${failures} threshold violation(s) — benchmark failed\n`);
      process.exit(1);
    }
    console.log(`\n  ✓ All thresholds passed\n`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
