#!/usr/bin/env node
/**
 * API Benchmark Suite for Platform Endpoints (/api/*)
 * Measures p50, p95, p99 latency (ms), TTFB (ms), RPS (peak & sustained), and Error Rate (%)
 * Outputs JSON and Markdown reports to /benchmarks/results/
 */
import fs from "node:fs";
import path from "node:path";
import { performance } from "node:perf_hooks";

const BASE_URL = process.env.BENCHMARK_BASE_URL || "http://localhost:4000";
const AUTH_TOKEN = process.env.BENCHMARK_AUTH_TOKEN || "benchmark-test-token";
const CONCURRENCY = Number(process.env.BENCHMARK_CONCURRENCY || 10);
const TOTAL_REQS = Number(process.env.BENCHMARK_REQUESTS_PER_ENDPOINT || 50);

const ENDPOINTS = [
  { name: "Health Check", method: "GET", path: "/health", auth: false },
  { name: "Auth Login", method: "POST", path: "/api/auth/login", auth: false, body: { email: "bench@example.com", password: "Password123!" } },
  { name: "Users Profile", method: "GET", path: "/api/users/me", auth: true },
  { name: "Jobs Feed", method: "GET", path: "/api/jobs?page=1&limit=20", auth: false },
  { name: "Proposals List", method: "GET", path: "/api/proposals", auth: true },
  { name: "Payments History", method: "GET", path: "/api/payments", auth: true },
  { name: "Reviews List", method: "GET", path: "/api/reviews", auth: false },
  { name: "Messages Inbox", method: "GET", path: "/api/messages", auth: true },
  { name: "Notifications", method: "GET", path: "/api/notifications", auth: true },
  { name: "Uploads Metadata", method: "GET", path: "/api/uploads", auth: true },
  { name: "Search Jobs", method: "GET", path: "/api/search?q=typescript", auth: false },
  { name: "Admin Stats", method: "GET", path: "/api/admin/stats", auth: true }
];

function percentile(sortedArr, p) {
  if (sortedArr.length === 0) return 0;
  const idx = Math.ceil((p / 100) * sortedArr.length) - 1;
  return Number(sortedArr[Math.max(0, idx)].toFixed(2));
}

async function measureSingleRequest(ep) {
  const headers = { "Content-Type": "application/json" };
  if (ep.auth) headers["Authorization"] = `Bearer ${AUTH_TOKEN}`;
  const t0 = performance.now();
  try {
    const res = await fetch(`${BASE_URL}${ep.path}`, {
      method: ep.method,
      headers,
      body: ep.body ? JSON.stringify(ep.body) : undefined,
    });
    const ttfb = performance.now() - t0;
    await res.arrayBuffer();
    const totalMs = performance.now() - t0;
    const isErr = res.status >= 500;
    return { totalMs, ttfb, error: isErr };
  } catch {
    const elapsed = performance.now() - t0;
    return { totalMs: elapsed, ttfb: elapsed, error: true };
  }
}

async function benchmarkEndpoint(ep) {
  const latencies = [];
  const ttfbs = [];
  let errors = 0;
  let peakRps = 0;

  const startSuite = performance.now();
  const batches = Math.ceil(TOTAL_REQS / CONCURRENCY);

  for (let b = 0; b < batches; b++) {
    const batchCount = Math.min(CONCURRENCY, TOTAL_REQS - b * CONCURRENCY);
    const bStart = performance.now();
    const results = await Promise.all(
      Array.from({ length: batchCount }, () => measureSingleRequest(ep))
    );
    const bSec = Math.max(0.001, (performance.now() - bStart) / 1000);
    peakRps = Math.max(peakRps, batchCount / bSec);

    for (const r of results) {
      latencies.push(r.totalMs);
      ttfbs.push(r.ttfb);
      if (r.error) errors++;
    }
  }

  const totalSec = Math.max(0.001, (performance.now() - startSuite) / 1000);
  latencies.sort((a, b) => a - b);
  ttfbs.sort((a, b) => a - b);

  return {
    endpoint: `${ep.method} ${ep.path}`,
    name: ep.name,
    requests: TOTAL_REQS,
    concurrency: CONCURRENCY,
    p50_ms: percentile(latencies, 50),
    p95_ms: percentile(latencies, 95),
    p99_ms: percentile(latencies, 99),
    ttfb_p50_ms: percentile(ttfbs, 50),
    sustained_rps: Number((TOTAL_REQS / totalSec).toFixed(2)),
    peak_rps: Number(peakRps.toFixed(2)),
    error_rate_pct: Number(((errors / TOTAL_REQS) * 100).toFixed(2)),
  };
}

async function main() {
  console.log(`🚀 Running API Benchmark Suite against ${BASE_URL}...`);
  const results = [];
  for (const ep of ENDPOINTS) {
    const stat = await benchmarkEndpoint(ep);
    results.push(stat);
  }

  const outDir = path.join(process.cwd(), "benchmarks", "results");
  fs.mkdirSync(outDir, { recursive: true });

  const report = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    concurrency: CONCURRENCY,
    requestsPerEndpoint: TOTAL_REQS,
    endpoints: results,
  };

  fs.writeFileSync(path.join(outDir, "latest.json"), JSON.stringify(report, null, 2));

  let md = `# API Benchmark Report\n\n- **Target Host:** \`${BASE_URL}\`\n- **Timestamp:** \`${report.timestamp}\`\n- **Concurrency:** \`${CONCURRENCY}\`\n\n`;
  md += `| Endpoint | p50 (ms) | p95 (ms) | p99 (ms) | TTFB p50 (ms) | Sustained RPS | Peak RPS | Error Rate (%) |\n`;
  md += `|---|---:|---:|---:|---:|---:|---:|---:|\n`;
  for (const r of results) {
    md += `| \`${r.endpoint}\` | ${r.p50_ms} | ${r.p95_ms} | ${r.p99_ms} | ${r.ttfb_p50_ms} | ${r.sustained_rps} | ${r.peak_rps} | ${r.error_rate_pct}% |\n`;
  }
  fs.writeFileSync(path.join(outDir, "SUMMARY.md"), md);
  console.log("✅ Saved JSON & Markdown benchmark reports to benchmarks/results/");
}

main();
