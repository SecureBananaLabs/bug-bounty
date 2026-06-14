/**
 * FreelanceFlow API Benchmark Runner
 *
 * Runs autocannon against all configured API endpoints and produces
 * JSON + Markdown results. Supports CI mode for regression gates.
 *
 * Usage:
 *   node benchmark.js              # Full benchmark (all endpoints)
 *   node benchmark.js --ci         # CI smoke test (light load + thresholds)
 *   TARGET=http://staging:4000 node benchmark.js
 */

import autocannon from "autocannon";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import config from "./config.json" with { type: "json" };

// ── Constants ───────────────────────────────────────────────────────

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const resultsDir = path.join(__dirname, "results");
const thresholdsPath = path.join(__dirname, "thresholds.json");
const isCi = process.argv.includes("--ci");

// ── Load thresholds ─────────────────────────────────────────────────

function loadThresholds() {
  try {
    return JSON.parse(fs.readFileSync(thresholdsPath, "utf-8"));
  } catch {
    return null;
  }
}

// ── Ensure results directory ────────────────────────────────────────

fs.mkdirSync(resultsDir, { recursive: true });

// ── Get target URL ──────────────────────────────────────────────────

const target = process.env.TARGET || config.target;
const concurrency = isCi ? config.ciConcurrency : config.concurrency;
const duration = isCi ? config.ciDuration : config.duration;

// ── Benchmark a single endpoint ─────────────────────────────────────

async function benchmarkEndpoint(ep) {
  if (isCi && ep.skipInCi) {
    console.log(`   ⏭️  Skipped (CI): ${ep.method} ${ep.path}`);
    return null;
  }

  const url = new URL(ep.path, target);

  const opts = {
    url: url.href,
    method: ep.method,
    connections: concurrency,
    duration,
    title: ep.description,
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "FreelanceFlow-Benchmark/1.0",
    },
  };

  if (ep.auth && process.env.BENCHMARK_TOKEN) {
    opts.headers["Authorization"] = `Bearer ${process.env.BENCHMARK_TOKEN}`;
  }

  if (ep.body) {
    opts.body = JSON.stringify(ep.body);
  }

  console.log(`   🏃 ${ep.method} ${ep.path} (${concurrency} conn, ${duration}s)`);

  return new Promise((resolve, reject) => {
    autocannon(opts, (err, result) => {
      if (err) return reject(err);
      resolve({
        endpoint: `${ep.method} ${ep.path}`,
        description: ep.description,
        ...extractMetrics(result),
      });
    });
  });
}

// ── Extract key metrics from autocannon result ──────────────────────

function extractMetrics(r) {
  const lt = r.latency;
  return {
    p50: lt.p50?.toFixed(2),
    p95: lt.p95?.toFixed(2),
    p99: lt.p99?.toFixed(2),
    avgLatency: lt.average?.toFixed(2),
    maxLatency: lt.max?.toFixed(2),
    requestsPerSecond: r.requests.average?.toFixed(2),
    requestsTotal: r.requests.total,
    throughputBytesPerSecond: r.throughput.average?.toFixed(0),
    errorRate: calculateErrorRate(r),
    timeToFirstByte: r.latency?.p50?.toFixed(2), // TTFB approximated by p50
    non2xx: r.non2xx,
    timeouts: r.timeouts,
    errors: r.errors,
  };
}

function calculateErrorRate(r) {
  const total = r.requests.total || 1;
  const errors = (r.errors || 0) + (r.timeouts || 0) + (r.non2xx || 0);
  return ((errors / total) * 100).toFixed(2);
}

// ── Check thresholds (CI mode) ──────────────────────────────────────

function checkThresholds(results) {
  const thresholds = loadThresholds();
  if (!thresholds) {
    console.log("\n   ⚠️  No thresholds.json found — skipping threshold check.");
    return true;
  }

  let allPassed = true;
  for (const r of results) {
    if (!r) continue;
    const threshold = thresholds[r.endpoint];
    if (!threshold) continue;

    if (threshold.maxP99 && r.p99 > threshold.maxP99) {
      console.log(`   ❌ ${r.endpoint}: p99 ${r.p99}ms exceeds threshold ${threshold.maxP99}ms`);
      allPassed = false;
    }
    if (threshold.maxErrorRate && parseFloat(r.errorRate) > threshold.maxErrorRate) {
      console.log(`   ❌ ${r.endpoint}: error rate ${r.errorRate}% exceeds threshold ${threshold.maxErrorRate}%`);
      allPassed = false;
    }
    if (threshold.minRPS && parseFloat(r.requestsPerSecond) < threshold.minRPS) {
      console.log(`   ❌ ${r.endpoint}: RPS ${r.requestsPerSecond} below threshold ${threshold.minRPS}`);
      allPassed = false;
    }
  }
  return allPassed;
}

// ── Generate Markdown summary ───────────────────────────────────────

function generateMarkdown(results) {
  const timestamp = new Date().toISOString().replace("T", " ").substring(0, 19);
  let md = `# API Benchmark Results\n\n`;
  md += `- **Target:** \`${target}\`\n`;
  md += `- **Concurrency:** ${concurrency}\n`;
  md += `- **Duration:** ${duration}s per endpoint\n`;
  md += `- **CI mode:** ${isCi}\n`;
  md += `- **Timestamp:** ${timestamp}\n\n`;
  md += `| Endpoint | Method | p50 (ms) | p95 (ms) | p99 (ms) | RPS | Error Rate |\n`;
  md += `|----------|--------|----------|----------|----------|-----|------------|\n`;

  for (const r of results) {
    if (!r) continue;
    md += `| ${r.description} | ${r.endpoint.split(" ")[0]} | ${r.p50} | ${r.p95} | ${r.p99} | ${r.requestsPerSecond} | ${r.errorRate}% |\n`;
  }

  md += `\n---\n`;
  md += `_Generated by FreelanceFlow Benchmark Runner_\n`;
  return md;
}

// ── Main ────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n========================================`);
  console.log(`  FreelanceFlow API Benchmark Suite`);
  console.log(`  Target: ${target}`);
  console.log(`  Mode:   ${isCi ? "CI (smoke)" : "Full"}`);
  console.log(`========================================\n`);

  const results = [];
  for (const ep of config.endpoints) {
    try {
      const r = await benchmarkEndpoint(ep);
      if (r) {
        results.push(r);
        const status = parseFloat(r.errorRate) > 0 ? "⚠️" : "✅";
        console.log(`   ${status} p50=${r.p50}ms | p95=${r.p95}ms | p99=${r.p99}ms | RPS=${r.requestsPerSecond} | err=${r.errorRate}%`);
      }
    } catch (err) {
      console.error(`   ❌ Error benchmarking ${ep.method} ${ep.path}:`, err.message);
    }
    console.log("");
  }

  // Write JSON results
  const jsonPath = path.join(resultsDir, `benchmark-${Date.now()}.json`);
  const latestPath = path.join(resultsDir, "latest.json");
  fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2));
  fs.writeFileSync(latestPath, JSON.stringify(results, null, 2));
  console.log(`   💾 JSON results saved to ${jsonPath}`);

  // Write Markdown summary
  const md = generateMarkdown(results);
  const mdPath = path.join(resultsDir, `benchmark-${Date.now()}.md`);
  const mdLatestPath = path.join(resultsDir, "latest.md");
  fs.writeFileSync(mdPath, md);
  fs.writeFileSync(mdLatestPath, md);
  console.log(`   📝 Markdown summary saved to ${mdPath}`);

  // Threshold check (CI)
  if (isCi) {
    console.log("\n--- Threshold Check ---");
    const passed = checkThresholds(results);
    if (!passed) {
      console.log("\n❌ Threshold check FAILED. See results above.\n");
      process.exitCode = 1;
    } else {
      console.log("\n✅ All threshold checks passed.\n");
    }
  }

  console.log("Done.\n");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exitCode = 1;
});
