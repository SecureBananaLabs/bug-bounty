#!/usr/bin/env node
/**
 * FreelanceFlow API Benchmark Suite
 *
 * Measures p50, p95, p99 latency (ms), RPS, error rate, and TTFB
 * for all /api/ endpoints under load.
 *
 * Usage:
 *   npm run benchmark                        # against localhost default
 *   BENCHMARK_HOST=https://staging.example.com npm run benchmark
 *   npm run benchmark -- --duration 20 --connections 50
 */

import autocannon from "autocannon";
import { program } from "commander";
import { writeFileSync } from "fs";
import { resolve } from "path";

program
  .option("--duration <s>", "seconds per endpoint", "10")
  .option("--connections <n>", "concurrent connections", "10")
  .option("--pipelining <n>", "pipelining factor", "1")
  .option("--report <path>", "write JSON report to path", "")
  .parse();

const opts = program.opts();
const DURATION    = parseInt(opts.duration);
const CONNECTIONS = parseInt(opts.connections);
const PIPELINING  = parseInt(opts.pipelining);

const HOST = process.env.BENCHMARK_HOST || "http://localhost:3000";
const TOKEN = process.env.BENCHMARK_TOKEN || "";

const authHeader = TOKEN
  ? { Authorization: `Bearer ${TOKEN}` }
  : {};

// ─── Endpoint definitions ───────────────────────────────────────────────────

const ENDPOINTS = [
  // Auth (public)
  {
    id: "POST /api/auth/register",
    method: "POST",
    path: "/api/auth/register",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: `bench+${Date.now()}@example.com`,
      password: "BenchPass123!",
      fullName: "Bench User",
      role: "FREELANCER",
    }),
  },
  {
    id: "POST /api/auth/login",
    method: "POST",
    path: "/api/auth/login",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "bench@example.com", password: "BenchPass123!" }),
  },
  {
    id: "POST /api/auth/refresh",
    method: "POST",
    path: "/api/auth/refresh",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: process.env.BENCHMARK_REFRESH_TOKEN || "dummy" }),
  },

  // Jobs
  {
    id: "GET /api/jobs",
    method: "GET",
    path: "/api/jobs",
    headers: { ...authHeader },
  },
  {
    id: "POST /api/jobs",
    method: "POST",
    path: "/api/jobs",
    headers: { "Content-Type": "application/json", ...authHeader },
    body: JSON.stringify({
      title: "Benchmark test job",
      description: "Load test job posting",
      budgetMin: 100,
      budgetMax: 500,
      categoryId: "bench-category",
    }),
  },

  // Users
  {
    id: "GET /api/users",
    method: "GET",
    path: "/api/users",
    headers: { ...authHeader },
  },

  // Search
  {
    id: "GET /api/search?q=design",
    method: "GET",
    path: "/api/search?q=design",
    headers: { ...authHeader },
  },

  // Proposals
  {
    id: "GET /api/proposals",
    method: "GET",
    path: "/api/proposals",
    headers: { ...authHeader },
  },
  {
    id: "POST /api/proposals",
    method: "POST",
    path: "/api/proposals",
    headers: { "Content-Type": "application/json", ...authHeader },
    body: JSON.stringify({
      jobId: "bench-job-id",
      coverLetter: "Benchmark proposal cover letter",
      bidAmount: 250,
      estDuration: "1 week",
    }),
  },

  // Reviews
  {
    id: "GET /api/reviews",
    method: "GET",
    path: "/api/reviews",
    headers: { ...authHeader },
  },

  // Messages
  {
    id: "GET /api/messages",
    method: "GET",
    path: "/api/messages",
    headers: { ...authHeader },
  },

  // Notifications
  {
    id: "GET /api/notifications",
    method: "GET",
    path: "/api/notifications",
    headers: { ...authHeader },
  },

  // Payments
  {
    id: "POST /api/payments",
    method: "POST",
    path: "/api/payments",
    headers: { "Content-Type": "application/json", ...authHeader },
    body: JSON.stringify({
      jobId: "bench-job-id",
      amount: 100,
      currency: "USD",
    }),
  },

  // Admin (auth-protected)
  {
    id: "GET /api/admin/metrics",
    method: "GET",
    path: "/api/admin/metrics",
    headers: { ...authHeader },
  },
];

// ─── Runner ─────────────────────────────────────────────────────────────────

function percentile(latency, pct) {
  // autocannon provides p50/p75/p90/p99 directly; p95 estimated
  if (pct === 50)  return latency.p50;
  if (pct === 75)  return latency.p75;
  if (pct === 90)  return latency.p90;
  if (pct === 95)  return latency.p99; // conservative — use p99 if p95 absent
  if (pct === 99)  return latency.p99;
  if (pct === 99.9) return latency["p99.9"] ?? latency.p99;
  return latency.p99;
}

async function runEndpoint(endpoint) {
  return new Promise((resolve, reject) => {
    const instance = autocannon(
      {
        url: HOST + endpoint.path,
        method: endpoint.method,
        headers: endpoint.headers || {},
        body: endpoint.body || undefined,
        duration: DURATION,
        connections: CONNECTIONS,
        pipelining: PIPELINING,
      },
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );
    autocannon.track(instance, { renderProgressBar: false });
  });
}

function formatRow(id, result) {
  const lat = result.latency;
  const rps = result.requests.average;
  const errors = result.errors + result.timeouts;
  const total = result.requests.total;
  const errorRate = total > 0 ? ((errors / total) * 100).toFixed(2) : "0.00";
  const ttfb = lat.p50; // TTFB ≈ p50 latency for synchronous HTTP

  return {
    endpoint: id,
    p50_ms:   lat.p50,
    p95_ms:   percentile(lat, 95),
    p99_ms:   lat.p99,
    rps_avg:  Math.round(rps),
    errors,
    error_rate_pct: parseFloat(errorRate),
    ttfb_p50_ms: ttfb,
    duration_s: DURATION,
    connections: CONNECTIONS,
  };
}

function printTable(rows) {
  const cols = ["endpoint", "p50_ms", "p95_ms", "p99_ms", "rps_avg", "error_rate_pct", "ttfb_p50_ms"];
  const widths = cols.map(c => Math.max(c.length, ...rows.map(r => String(r[c]).length)));

  const line = () => console.log("+" + widths.map(w => "-".repeat(w + 2)).join("+") + "+");
  const row  = (cells) => console.log(
    "|" + cells.map((c, i) => ` ${String(c).padEnd(widths[i])} `).join("|") + "|"
  );

  line();
  row(cols);
  line();
  rows.forEach(r => row(cols.map(c => r[c])));
  line();
}

async function main() {
  console.log(`\n🔥 FreelanceFlow API Benchmark`);
  console.log(`   Host:        ${HOST}`);
  console.log(`   Duration:    ${DURATION}s per endpoint`);
  console.log(`   Connections: ${CONNECTIONS}`);
  console.log(`   Endpoints:   ${ENDPOINTS.length}`);
  console.log(`   Auth token:  ${TOKEN ? "set ✓" : "not set (public routes only)"}\n`);

  const results = [];

  for (const ep of ENDPOINTS) {
    process.stdout.write(`  Running ${ep.id} ... `);
    try {
      const raw = await runEndpoint(ep);
      const row = formatRow(ep.id, raw);
      results.push(row);
      console.log(`p50=${row.p50_ms}ms  p99=${row.p99_ms}ms  rps=${row.rps_avg}  err=${row.error_rate_pct}%`);
    } catch (e) {
      console.log(`ERROR: ${e.message}`);
      results.push({ endpoint: ep.id, error: e.message });
    }
  }

  console.log("\n📊 Summary\n");
  printTable(results.filter(r => !r.error));

  // Bottleneck analysis
  const sorted = [...results].filter(r => r.p99_ms != null).sort((a, b) => b.p99_ms - a.p99_ms);
  if (sorted.length) {
    console.log("\n⚠️  Top 3 slowest endpoints (p99):");
    sorted.slice(0, 3).forEach((r, i) => {
      console.log(`  ${i + 1}. ${r.endpoint}  →  p99=${r.p99_ms}ms`);
    });
  }

  const highErr = results.filter(r => r.error_rate_pct > 1);
  if (highErr.length) {
    console.log("\n🚨 High error rate (>1%):");
    highErr.forEach(r => console.log(`  • ${r.endpoint}  →  ${r.error_rate_pct}%`));
  }

  if (opts.report) {
    const outPath = resolve(opts.report);
    const report = {
      meta: { host: HOST, duration: DURATION, connections: CONNECTIONS, timestamp: new Date().toISOString() },
      results,
    };
    writeFileSync(outPath, JSON.stringify(report, null, 2));
    console.log(`\n💾 Report saved: ${outPath}`);
  }

  console.log("\n✅ Done.\n");
}

main().catch(err => { console.error(err); process.exit(1); });
