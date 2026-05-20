#!/usr/bin/env node

/**
 * API Benchmark Suite — measures p50/p95/p99 latency, RPS, error rate, and TTFB
 * for every endpoint under /api/. Uses autocannon with realistic payloads.
 *
 * Usage:
 *   node benchmarks/run.js
 *   # or: npm run benchmark
 *
 * Env vars:
 *   BENCHMARK_HOST — target base URL (default http://localhost:4000)
 *   BENCHMARK_TOKEN — auth token for protected routes (default empty)
 *   BENCHMARK_CONNECTIONS — concurrent connections (default 10)
 *   BENCHMARK_DURATION — seconds per endpoint (default 10)
 *   BENCHMARK_SKIP_AUTH — set to 1 to skip auth-protected endpoints
 */

import autocannon from "autocannon";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { env } from "../apps/api/src/config/env.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RESULTS_DIR = path.join(__dirname, "results");
const THRESHOLDS_PATH = path.join(__dirname, "thresholds.json");

const HOST = process.env.BENCHMARK_HOST || "http://localhost:4000";
const TOKEN = process.env.BENCHMARK_TOKEN || "";
const CONNECTIONS = parseInt(process.env.BENCHMARK_CONNECTIONS || "10", 10);
const DURATION = parseInt(process.env.BENCHMARK_DURATION || "10", 10);

const HEADERS = {
  "Content-Type": "application/json",
};
if (TOKEN) HEADERS["Authorization"] = `Bearer ${TOKEN}`;

// Define all endpoints with realistic payloads
const ENDPOINTS = [
  // Auth — no token needed
  { method: "POST", path: "/api/auth/register", body: { username: "bench-user", email: "bench@test.local", password: "TestPass123!" } },
  { method: "POST", path: "/api/auth/login", body: { email: "bench@test.local", password: "TestPass123!" } },
  { method: "POST", path: "/api/auth/refresh", body: { refreshToken: "mock-refresh-token" } },
  // Protected endpoints (need token)
  { method: "GET", path: "/api/admin/metrics", token: true },
  { method: "GET", path: "/api/jobs", token: true },
  { method: "POST", path: "/api/jobs", token: true, body: { title: "Benchmark Job", description: "Performance test", budget: 1000 } },
  { method: "GET", path: "/api/messages", token: true },
  { method: "POST", path: "/api/messages", token: true, body: { recipientId: "rec-001", content: "Test message for benchmarking" } },
  { method: "GET", path: "/api/notifications", token: true },
  { method: "POST", path: "/api/payment", token: true, body: { amount: 2999, currency: "usd" } },
  { method: "GET", path: "/api/proposals", token: true },
  { method: "POST", path: "/api/proposals", token: true, body: { jobId: "job-001", bid: 500 } },
  { method: "GET", path: "/api/reviews", token: true },
  { method: "POST", path: "/api/reviews", token: true, body: { targetId: "user-001", rating: 5, comment: "Benchmark review" } },
  { method: "GET", path: "/api/search", token: true, qs: { q: "test" } },
  { method: "GET", path: "/api/users", token: true },
  { method: "POST", path: "/api/users", token: true, body: { username: "bench-new-user", email: "bench-new@test.local" } },
];

function buildUrl(endpoint) {
  let url = `${HOST}${endpoint.path}`;
  if (endpoint.qs) {
    const params = new URLSearchParams(endpoint.qs).toString();
    url += `?${params}`;
  }
  return url;
}

function buildHeaders(endpoint) {
  const h = { ...HEADERS };
  if (!endpoint.token) {
    delete h["Authorization"];
  }
  return h;
}

async function runBenchmark(endpoint) {
  const url = buildUrl(endpoint);
  const headers = buildHeaders(endpoint);

  console.log(`\nBenchmarking ${endpoint.method} ${endpoint.path} (${CONNECTIONS} conn, ${DURATION}s)...`);

  const instance = autocannon({
    url,
    method: endpoint.method,
    headers,
    body: endpoint.body ? JSON.stringify(endpoint.body) : undefined,
    connections: CONNECTIONS,
    duration: DURATION,
    title: endpoint.path,
  });

  return new Promise((resolve, reject) => {
    autocannon.track(instance, { renderProgressBar: false });
    instance.on("done", (results) => resolve(results));
    instance.on("error", (err) => reject(err));
  });
}

function formatMs(ms) {
  return ms === 0 ? "0.00" : ms.toFixed(2);
}

function formatPct(pct) {
  return (pct * 100).toFixed(2);
}

async function main() {
  console.log(`Benchmark Suite — Target: ${HOST}, Connections: ${CONNECTIONS}, Duration: ${DURATION}s\n`);

  const skipAuth = process.env.BENCHMARK_SKIP_AUTH === "1";
  const results = [];
  let failures = 0;

  for (const endpoint of ENDPOINTS) {
    if (skipAuth && endpoint.token) {
      console.log(`Skipping ${endpoint.method} ${endpoint.path} (auth-protected, SKIP_AUTH=1)`);
      continue;
    }
    try {
      const res = await runBenchmark(endpoint);
      const latency = res.latency;
      const requests = res.requests;
      const errors = res.errors;
      const throughput = res.throughput;
      const durationMs = res.duration;

      const entry = {
        endpoint: `${endpoint.method} ${endpoint.path}`,
        duration_seconds: durationMs / 1000,
        connections: CONNECTIONS,
        latency_ms: {
          p50: latency.p50 === 0 ? 0 : latency.p50,
          p95: latency.p95 === 0 ? 0 : latency.p95,
          p99: latency.p99 === 0 ? 0 : latency.p99,
          avg: latency.average === 0 ? 0 : latency.average,
        },
        requests_per_second: {
          peak: requests.max === 0 ? 0 : requests.max,
          sustained: requests.average === 0 ? 0 : requests.average,
          total: requests.total,
        },
        error_rate_pct: requests.total > 0 ? (errors.total / requests.total) * 100 : 0,
        throughput_bytes_per_sec: throughput.average || 0,
        ttfb_ms: {
          p50: (res.latency || {}).p1 === undefined ? 0 : latency.p2_5 ?? latency.p50,  // estimated TTFB from earliest percentile
        },
      };
      results.push(entry);
      console.log(`  OK — ${entry.requests_per_second.total} requests, p50=${formatMs(entry.latency_ms.p50)}ms, p95=${formatMs(entry.latency_ms.p95)}ms, errors=${entry.error_rate_pct}%`);

      // Check thresholds
      const thresholdsRaw = fs.readFileSync(THRESHOLDS_PATH, "utf-8");
      const thresholds = JSON.parse(thresholdsRaw);
      const endpointThreshold = thresholds.endpoints[endpoint.path] || { p99_max_ms: 1000, max_error_pct: 5 };
      if (entry.latency_ms.p99 > endpointThreshold.p99_max_ms) {
        console.warn(`  ⚠ p99 (${formatMs(entry.latency_ms.p99)}ms) exceeds threshold (${endpointThreshold.p99_max_ms}ms)`);
        if (process.env.CI) failures++;
      }
      if (entry.error_rate_pct > endpointThreshold.max_error_pct) {
        console.warn(`  ⚠ Error rate (${entry.error_rate_pct}%) exceeds threshold (${endpointThreshold.max_error_pct}%)`);
        if (process.env.CI) failures++;
      }
    } catch (err) {
      console.error(`  FAIL — ${endpoint.method} ${endpoint.path}: ${err.message}`);
      results.push({ endpoint: `${endpoint.method} ${endpoint.path}`, error: err.message });
      if (process.env.CI) failures++;
    }
  }

  // Write JSON results
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const jsonPath = path.join(RESULTS_DIR, `benchmark-${timestamp}.json`);
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
  fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2));
  console.log(`\nJSON results written to ${jsonPath}`);

  // Write Markdown summary
  let md = `# API Benchmark Results — ${timestamp}\n\n`;
  md += `Target: \`${HOST}\` | Connections: ${CONNECTIONS} | Duration: ${DURATION}s/endpoint\n\n`;
  md += "| Endpoint | Requests | p50 (ms) | p95 (ms) | p99 (ms) | RPS (peak) | Error % |\n";
  md += "|----------|----------|----------|----------|----------|------------|--------|\n";
  for (const r of results) {
    if (r.error) {
      md += `| ${r.endpoint} | — | — | — | — | — | — (error: ${r.error}) |\n`;
    } else {
      md += `| ${r.endpoint} | ${r.requests_per_second.total} | ${formatMs(r.latency_ms.p50)} | ${formatMs(r.latency_ms.p95)} | ${formatMs(r.latency_ms.p99)} | ${r.requests_per_second.peak} | ${r.error_rate_pct.toFixed(2)} |\n`;
    }
  }
  const mdPath = path.join(RESULTS_DIR, `benchmark-${timestamp}.md`);
  fs.writeFileSync(mdPath, md);
  console.log(`Markdown summary written to ${mdPath}`);
  console.log(`\n${results.length} endpoints tested, ${failures} threshold failures\n`);

  if (failures > 0) {
    console.error(`CI gate: ${failures} endpoint(s) exceeded thresholds`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Benchmark suite failed:", err);
  process.exit(1);
});
