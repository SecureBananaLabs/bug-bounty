#!/usr/bin/env node
/**
 * Benchmark runner — runs autocannon against each API target.
 * Outputs results to benchmarks/results/<timestamp>.json and a markdown summary.
 *
 * Usage: node benchmarks/run-benchmarks.js [--host http://localhost:3000] [--iterations 3]
 */

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TARGETS_FILE = join(__dirname, "targets.js");
const RESULTS_DIR = join(__dirname, "results");
const THRESHOLDS_FILE = join(__dirname, "thresholds.json");

// Defaults
const HOST = process.argv.includes("--host")
  ? process.argv[process.argv.indexOf("--host") + 1]
  : process.env.API_BASE_URL || "http://localhost:3000";
const CONCURRENCY = 10;
const DURATION = 10; // seconds per endpoint
const ITERATIONS = parseInt(process.argv.find(a => a === "--iterations")?.split("=")?.[1] || "1");
const BENCHMARK_TOKEN = process.env.BENCHMARK_TOKEN || "";

// Load thresholds if they exist
let thresholds = {};
try {
  thresholds = JSON.parse(readFileSync(THRESHOLDS_FILE, "utf-8"));
} catch { /* no thresholds yet */ }

mkdirSync(RESULTS_DIR, { recursive: true });

// Load targets
const { TARGETS } = await import(TARGETS_FILE).catch(() => ({ TARGETS: [] }));

if (!TARGETS || TARGETS.length === 0) {
  console.error("No targets defined in targets.js — please add API endpoints first.");
  process.exit(1);
}

console.log(`\n🚀 Benchmark Suite — ${TARGETS.length} endpoints\n`);
console.log(`   Host: ${HOST}`);
console.log(`   Duration: ${DURATION}s @ ${CONCURRENCY} concurrent connections\n`);
console.log("─".repeat(60));

const results = [];
const timestamp = new Date().toISOString().replace(/[:.]+/g, "-");
let hasFailures = false;

for (const target of TARGETS) {
  const url = `${HOST}${target.path}`;
  const args = [
    "-c", CONCURRENCY.toString(),
    "-d", DURATION.toString(),
    "-t", "1", // 1 connection per thread
    "-H", `Content-Type: application/json`,
    "-H", `Authorization: Bearer ${BENCHMARK_TOKEN}`,
    "-m", `${target.method}:${target.path}`,
  ];

  if (target.payload && target.method !== "GET") {
    const bodyFile = join(RESULTS_DIR, `body-${target.name.replace(/[^a-z]/gi, "-")}.json`);
    writeFileSync(bodyFile, JSON.stringify(target.payload));
    args.push("-b", JSON.stringify(target.payload));
  }

  args.push(url);

  console.log(`\n📊 ${target.name} (${target.method} ${target.path})`);
  if (target.description) console.log(`   ${target.description}`);

  try {
    const result = await runAutocannon(args);
    const parsed = parseAutocannon(result.stdout);

    const rps = parsed.rps || 0;
    const p50 = parsed.latency.p50 || 0;
    const p95 = parsed.latency.p95 || 0;
    const p99 = parsed.latency.p99 || 0;
    const errorRate = parsed.errors > 0 ? (parsed.errors / (parsed.requests || 1)) * 100 : 0;
    const ttfb = parsed.ttfb?.mean || 0;

    const threshold = thresholds[target.name] || {};
    const p99Ok = !threshold.p99 || p99 <= threshold.p99;
    const rpsOk = !threshold.minRps || rps >= threshold.minRps;

    const status = p99Ok && rpsOk ? "✅ PASS" : "❌ FAIL";
    if (!p99Ok || !rpsOk) hasFailures = true;

    console.log(`   ${status} — p50:${p50.toFixed(1)}ms p95:${p95.toFixed(1)}ms p99:${p99.toFixed(1)}ms rps:${rps.toFixed(1)} errors:${errorRate.toFixed(2)}%`);

    results.push({
      name: target.name,
      method: target.method,
      path: target.path,
      timestamp,
      p50_ms: parseFloat(p50.toFixed(2)),
      p95_ms: parseFloat(p95.toFixed(2)),
      p99_ms: parseFloat(p99.toFixed(2)),
      rps: parseFloat(rps.toFixed(2)),
      error_rate_pct: parseFloat(errorRate.toFixed(4)),
      ttfb_ms: parseFloat(ttfb.toFixed(2)),
      threshold_p99_ms: threshold.p99 || null,
      passes: p99Ok && rpsOk,
    });
  } catch (err) {
    console.log(`   ❌ ERROR: ${err.message}`);
    results.push({
      name: target.name,
      method: target.method,
      path: target.path,
      error: err.message,
      passes: false,
    });
    hasFailures = true;
  }
}

// Write JSON results
const jsonPath = join(RESULTS_DIR, `${timestamp}.json`);
writeFileSync(jsonPath, JSON.stringify({ timestamp, host: HOST, results }, null, 2));

// Generate markdown summary
const mdPath = join(RESULTS_DIR, `${timestamp}.md`);
const mdLines = [
  `# API Benchmark Results — ${timestamp}`,
  "",
  `**Host:** ${HOST}`,
  `**Duration:** ${DURATION}s @ ${CONCURRENCY} concurrent`,
  "",
  "| Endpoint | Method | p50 | p95 | p99 | RPS | Errors | Status |",
  "|---|---|---|---|---|---|---|---|",
];
for (const r of results) {
  const status = r.passes ? "✅" : "❌";
  const errStr = r.error ? `ERR: ${r.error}` : `${r.error_rate_pct?.toFixed(2)}%`;
  mdLines.push(`| ${r.name} | ${r.method} | ${r.p50_ms}ms | ${r.p95_ms}ms | ${r.p99_ms}ms | ${r.rps} | ${errStr} | ${status} |`);
}
writeFileSync(mdPath, mdLines.join("\n") + "\n");

console.log("\n" + "─".repeat(60));
console.log(`\n✅ Results written to benchmarks/results/${timestamp}.json`);
console.log(`📄 Markdown: benchmarks/results/${timestamp}.md`);
if (hasFailures) {
  console.log("\n⚠️  Some endpoints failed thresholds — CI should fail.");
  process.exit(1);
} else {
  console.log("\n✅ All endpoints passed benchmarks.");
}

// ── Helpers ──────────────────────────────────────────────────────────────

function runAutocannon(args) {
  return new Promise((resolve, reject) => {
    const p = spawn("npx", ["autocannon", ...args], { stdio: "pipe" });
    let stdout = "", stderr = "";
    p.stdout.on("data", d => (stdout += d));
    p.stderr.on("data", d => (stderr += d));
    p.on("close", code => resolve({ stdout, stderr, code }));
    p.on("error", reject);
  });
}

function parseAutocannon(stdout) {
  try {
    return JSON.parse(stdout);
  } catch {
    // Try to parse from text
    const lines = stdout.split("\n");
    const data = {};
    for (const line of lines) {
      const m = line.match(/^\s*([\w\s]+):\s*(.+)$/);
      if (m) data[m[1].trim()] = m[2].trim();
    }
    return data;
  }
}
