/**
 * API Benchmark Suite
 *
 * Measures latency (p50/p95/p99), throughput (req/s), and error rate
 * for all public API endpoints. Run against a local or staging server.
 *
 * Usage:
 *   node benchmarks/benchmark.js                          # uses BENCHMARK_HOST from .env.benchmark
 *   BENCHMARK_HOST=http://localhost:4000 node benchmarks/benchmark.js
 */

import http from "node:http";
import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// ── Config ────────────────────────────────────────────────
const HOST = process.env.BENCHMARK_HOST || "http://localhost:4000";
const CONCURRENCY = 10;
const REQUESTS_PER_ENDPOINT = 200;
const TIMEOUT_MS = 5000;

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Endpoints under test ──────────────────────────────────
const ENDPOINTS = [
  { method: "GET", path: "/health", label: "Health check" },
  { method: "GET", path: "/api/jobs", label: "List jobs" },
  { method: "GET", path: "/api/users", label: "List users" },
  { method: "GET", path: "/api/search?q=react", label: "Search" },
  { method: "POST", path: "/api/auth/register", label: "Register",
    body: JSON.stringify({ email: "bench@test.com", password: "Test123!", name: "Bench" }),
    headers: { "content-type": "application/json" } },
];

// ── Helpers ───────────────────────────────────────────────
function percentile(sorted, p) {
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

function request(opts) {
  return new Promise((resolve) => {
    const t0 = performance.now();
    const url = new URL(opts.path, HOST);
    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method: opts.method,
        headers: { ...opts.headers, "user-agent": "benchmark/1.0" },
        timeout: TIMEOUT_MS,
      },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          resolve({
            status: res.statusCode,
            latency: performance.now() - t0,
            size: data.length,
          });
        });
      },
    );
    req.on("error", () => resolve({ status: 0, latency: performance.now() - t0, size: 0 }));
    req.on("timeout", () => { req.destroy(); resolve({ status: 0, latency: TIMEOUT_MS, size: 0 }); });
    if (opts.body) req.write(opts.body);
    req.end();
  });
}

async function runConcurrent(fn, concurrency, total) {
  const results = [];
  let remaining = total;
  const workers = Array.from({ length: concurrency }, async () => {
    while (remaining > 0) {
      remaining--;
      results.push(await fn());
    }
  });
  await Promise.all(workers);
  return results;
}

// ── Main ──────────────────────────────────────────────────
async function main() {
  console.log(`🚀 Benchmarking ${HOST} …\n`);
  const report = { host: HOST, startedAt: new Date().toISOString(), endpoints: {} };

  for (const ep of ENDPOINTS) {
    const tStart = performance.now();
    const results = await runConcurrent(
      () => request(ep),
      CONCURRENCY,
      REQUESTS_PER_ENDPOINT,
    );
    const elapsed = performance.now() - tStart;
    const latencies = results.map((r) => r.latency).sort((a, b) => a - b);
    const errors = results.filter((r) => r.status < 200 || r.status >= 400).length;
    const rps = (results.length / (elapsed / 1000)).toFixed(1);

    const row = {
      label: ep.label,
      method: ep.method,
      path: ep.path,
      requests: results.length,
      errors,
      errorRate: ((errors / results.length) * 100).toFixed(2) + "%",
      rps: Number(rps),
      p50: percentile(latencies, 50).toFixed(2) + " ms",
      p95: percentile(latencies, 95).toFixed(2) + " ms",
      p99: percentile(latencies, 99).toFixed(2) + " ms",
      min: latencies[0].toFixed(2) + " ms",
      max: latencies[latencies.length - 1].toFixed(2) + " ms",
    };

    report.endpoints[ep.path] = row;
    const icon = errors === 0 ? "✅" : "⚠️";
    console.log(`${icon} ${ep.label.padEnd(18)} p50=${row.p50.padStart(8)}  p95=${row.p95.padStart(8)}  p99=${row.p99.padStart(8)}  rps=${rps}`);
  }

  // Save JSON report
  const jsonPath = resolve(__dirname, "report.json");
  writeFileSync(jsonPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Report saved to ${jsonPath}`);

  // Save Markdown summary
  const mdPath = resolve(__dirname, "report.md");
  let md = `# API Benchmark Report\n\n**Host:** ${HOST}  \n**Date:** ${report.startedAt}  \n**Concurrency:** ${CONCURRENCY}  \n**Requests per endpoint:** ${REQUESTS_PER_ENDPOINT}\n\n`;
  md += "| Endpoint | Method | p50 | p95 | p99 | RPS | Errors |\n";
  md += "|----------|--------|-----|-----|-----|-----|--------|\n";
  for (const row of Object.values(report.endpoints)) {
    md += `| ${row.label} | ${row.method} | ${row.p50} | ${row.p95} | ${row.p99} | ${row.rps} | ${row.errorRate} |\n`;
  }
  md += "\n> Generated by `npm run benchmark`\n";
  writeFileSync(mdPath, md);
  console.log(`📄 Markdown report saved to ${mdPath}`);
}

main().catch(console.error);
