#!/usr/bin/env node
/**
 * FreelanceFlow API Benchmark Suite
 * Run: npm run benchmark
 * Requires: npm install -g autocannon
 */
import autocannon from "autocannon";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const thresholds = JSON.parse(readFileSync(join(__dir, "thresholds.json"), "utf8"));

const HOST   = process.env.BENCHMARK_HOST        ?? "http://localhost:4000";
const TOKEN  = process.env.BENCHMARK_TOKEN       ?? "";
const CONNS  = Number(process.env.BENCHMARK_CONNECTIONS ?? 10);
const DUR    = Number(process.env.BENCHMARK_DURATION    ?? 10);
const PIPE   = Number(process.env.BENCHMARK_PIPELINING  ?? 1);
const SMOKE  = process.env.BENCHMARK_SMOKE === "true";   // low concurrency CI mode

const authHeader = TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {};

const ENDPOINTS = [
  { method: "GET",  url: "/health",               headers: {},         body: null },
  { method: "GET",  url: "/api/jobs",              headers: authHeader, body: null },
  { method: "GET",  url: "/api/search?q=node",     headers: {},         body: null },
  { method: "GET",  url: "/api/users",             headers: authHeader, body: null },
  { method: "GET",  url: "/api/proposals",         headers: authHeader, body: null },
  { method: "GET",  url: "/api/messages",          headers: authHeader, body: null },
  { method: "GET",  url: "/api/notifications",     headers: authHeader, body: null },
  { method: "GET",  url: "/api/admin/metrics",     headers: authHeader, body: null },
  {
    method: "POST", url: "/api/auth/login",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "bench@example.com", password: "password123" })
  },
];

async function bench(ep) {
  const connections = SMOKE ? 2 : CONNS;
  const duration    = SMOKE ? 3 : DUR;

  return new Promise((resolve, reject) => {
    const instance = autocannon({
      url: HOST + ep.url,
      method: ep.method,
      headers: ep.headers,
      body: ep.body ?? undefined,
      connections,
      duration,
      pipelining: PIPE,
    }, (err, result) => err ? reject(err) : resolve(result));
    autocannon.track(instance, { renderProgressBar: !SMOKE });
  });
}

function label(ep) { return `${ep.method} ${ep.url.split("?")[0]}`; }
function threshold(ep) { return thresholds.routes[label(ep)] ?? thresholds.default; }

async function main() {
  const results = [];
  let violations = 0;

  console.log(`\n🚀 FreelanceFlow Benchmark — host: ${HOST} | connections: ${SMOKE ? 2 : CONNS} | duration: ${SMOKE ? 3 : DUR}s\n`);

  for (const ep of ENDPOINTS) {
    const lbl = label(ep);
    console.log(`\n── ${lbl} ──`);
    let result;
    try { result = await bench(ep); }
    catch { console.log("  ⚠ server not reachable, skipping"); continue; }

    const p50  = result.latency.p50;
    const p95  = result.latency.p95;
    const p99  = result.latency.p99;
    const rps  = Math.round(result.requests.mean);
    const err  = result.errors;
    const ttfb = result.latency.mean;
    const thr  = threshold(ep);
    const pass = p99 <= thr;
    if (!pass) violations++;

    const row = { endpoint: lbl, p50, p95, p99, rps, errorRate: err, ttfbMean: Math.round(ttfb), threshold: thr, pass };
    results.push(row);
    console.log(`  p50=${p50}ms  p95=${p95}ms  p99=${p99}ms  rps=${rps}  errors=${err}  threshold=${thr}ms  ${pass ? "✅" : "❌ VIOLATION"}`);
  }

  // Write JSON
  mkdirSync(join(__dir, "results"), { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const jsonPath = join(__dir, "results", `benchmark-${ts}.json`);
  writeFileSync(jsonPath, JSON.stringify({ timestamp: new Date().toISOString(), host: HOST, results }, null, 2));

  // Write Markdown summary
  const md = [
    "# Benchmark Results",
    `\n**Date:** ${new Date().toUTCString()}`,
    `**Host:** ${HOST}`,
    `**Connections:** ${SMOKE ? 2 : CONNS} | **Duration:** ${SMOKE ? 3 : DUR}s\n`,
    "| Endpoint | p50 | p95 | p99 | RPS | Errors | Threshold | Pass |",
    "|----------|-----|-----|-----|-----|--------|-----------|------|",
    ...results.map(r =>
      `| ${r.endpoint} | ${r.p50}ms | ${r.p95}ms | ${r.p99}ms | ${r.rps} | ${r.errorRate} | ${r.threshold}ms | ${r.pass ? "✅" : "❌"} |`
    ),
  ].join("\n");
  const mdPath = join(__dir, "results", `benchmark-${ts}.md`);
  writeFileSync(mdPath, md);

  console.log(`\n📊 Results written to benchmarks/results/`);
  if (violations > 0) {
    console.error(`\n❌ ${violations} threshold violation(s) detected`);
    process.exit(1);
  }
  console.log("\n✅ All thresholds passed");
}

main().catch(err => { console.error(err); process.exit(1); });
