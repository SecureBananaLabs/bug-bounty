#!/usr/bin/env node
/**
 * FreelanceFlow API Benchmark Suite
 * Measures p50, p95, p99 latency, RPS, error rate, and TTFB
 * Usage: node benchmarks/run.js [--host http://localhost:4000] [--smoke]
 */

import autocannon from "autocannon";
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
const hostIdx = args.indexOf("--host");
const HOST = hostIdx !== -1 ? args[hostIdx + 1] : (process.env.BENCHMARK_HOST ?? "http://localhost:4000");
const SMOKE = args.includes("--smoke");

// In smoke mode (CI): low concurrency, short duration
const CONNECTIONS = SMOKE ? 5 : 50;
const DURATION = SMOKE ? 5 : 15; // seconds

const ENDPOINTS = [
  { method: "GET",  path: "/health",                           title: "GET  /health" },
  { method: "POST", path: "/api/auth/register",                title: "POST /api/auth/register",
    body: JSON.stringify({ email: "bench@example.com", password: "benchpass1", role: "client" }),
    headers: { "content-type": "application/json" } },
  { method: "POST", path: "/api/auth/login",                   title: "POST /api/auth/login",
    body: JSON.stringify({ email: "bench@example.com", password: "benchpass1" }),
    headers: { "content-type": "application/json" } },
  { method: "GET",  path: "/api/jobs",                         title: "GET  /api/jobs" },
  { method: "GET",  path: "/api/search?q=typescript",          title: "GET  /api/search?q=typescript" },
];

const THRESHOLDS = JSON.parse(
  await import("fs").then(fs =>
    fs.readFileSync(join(__dirname, "thresholds.json"), "utf8")
  )
);

function percentile(latency, p) {
  return latency[p] ?? latency.p99 ?? 0;
}

async function bench(endpoint) {
  return new Promise((resolve, reject) => {
    const instance = autocannon(
      {
        url: `${HOST}${endpoint.path}`,
        method: endpoint.method,
        body: endpoint.body,
        headers: endpoint.headers ?? {},
        connections: CONNECTIONS,
        duration: DURATION,
        title: endpoint.title
      },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    autocannon.track(instance, { renderProgressBar: !SMOKE });
  });
}

const results = [];
let failed = false;

for (const ep of ENDPOINTS) {
  console.log(`\nBenchmarking: ${ep.title}`);
  const r = await bench(ep);

  const entry = {
    endpoint: ep.title,
    p50:   r.latency.p50,
    p95:   r.latency.p95,
    p99:   r.latency.p99,
    rps:   Math.round(r.requests.mean),
    errorRate: r.errors / (r.requests.total || 1),
    ttfb:  r.latency.min,
    requests: r.requests.total,
    errors:   r.errors
  };
  results.push(entry);

  const threshold = THRESHOLDS[ep.title] ?? THRESHOLDS["default"];
  if (SMOKE && threshold && entry.p99 > threshold.p99MaxMs) {
    console.error(
      `  ❌ p99 ${entry.p99}ms exceeds threshold ${threshold.p99MaxMs}ms for ${ep.title}`
    );
    failed = true;
  } else {
    console.log(`  ✅ p50=${entry.p50}ms p95=${entry.p95}ms p99=${entry.p99}ms rps=${entry.rps} errors=${entry.errors}`);
  }
}

// Write JSON results
const outDir = join(__dirname, "results");
mkdirSync(outDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
writeFileSync(join(outDir, `${stamp}.json`), JSON.stringify(results, null, 2));

// Write Markdown summary
const md = [
  "# FreelanceFlow API Benchmark Results",
  "",
  `**Date:** ${new Date().toISOString()}`,
  `**Host:** ${HOST}`,
  `**Mode:** ${SMOKE ? "smoke (CI)" : "full"}`,
  `**Connections:** ${CONNECTIONS}  **Duration:** ${DURATION}s`,
  "",
  "| Endpoint | p50 (ms) | p95 (ms) | p99 (ms) | RPS | Error rate | TTFB (ms) |",
  "|---|---|---|---|---|---|---|",
  ...results.map(r =>
    `| ${r.endpoint} | ${r.p50} | ${r.p95} | ${r.p99} | ${r.rps} | ${(r.errorRate * 100).toFixed(2)}% | ${r.ttfb} |`
  ),
  ""
].join("\n");

writeFileSync(join(outDir, `${stamp}.md`), md);
console.log(`\nResults written to benchmarks/results/${stamp}.{json,md}`);

if (failed) {
  process.exit(1);
}
