/**
 * Benchmark Runner — SecureBananaLabs/bug-bounty
 *
 * Runs autocannon against all /api/* endpoints, captures p50/p95/p99
 * latency, RPS, error rate, and TTFB. Writes JSON + Markdown results.
 *
 * Usage: node benchmarks/run-benchmarks.mjs
 * Requires: npm install autocannon
 * Server must be running: npm run dev (in apps/api)
 */

import autocannon from "autocannon";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const config = JSON.parse(readFileSync(join(__dirname, "endpoints.json"), "utf-8"));
const thresholds = JSON.parse(readFileSync(join(__dirname, "thresholds.json"), "utf-8"));
const benchDir = join(__dirname, "results");
mkdirSync(benchDir, { recursive: true });

const host = process.env.BENCHMARK_HOST || "http://localhost:4000";
const token = process.env.BENCHMARK_TOKEN || "bench-test-token";

function runBenchmark(endpoint) {
  return new Promise((resolve) => {
    const headers = { "Content-Type": "application/json" };
    if (endpoint.protected) headers["Authorization"] = `Bearer ${token}`;

    const opts = {
      url: `${host}${endpoint.path}`,
      method: endpoint.method || "GET",
      connections: config.defaults.connections,
      duration: config.defaults.duration,
      pipelining: config.defaults.pipelining,
      headers,
    };

    if (endpoint.payload) opts.body = JSON.stringify(endpoint.payload);

    autocannon(opts, (err, result) => {
      if (err) return resolve({ endpoint: endpoint.path, method: endpoint.method, error: err.message });
      resolve({
        endpoint: endpoint.path,
        method: endpoint.method || "GET",
        protected: endpoint.protected,
        p50: result.latency.p50,
        p95: result.latency.p95,
        p99: result.latency.p99,
        rps: result.requests.average,
        peakRps: result.requests.max,
        errorRate: ((result.non2xx / result["2xx"] + result.non2xx) * 100 || 0).toFixed(2),
        ttfb: result.latency.p50, // approx TTFB = p50 for first response
        totalRequests: result.requests.total,
        errors: result.errors,
        timeouts: result.timeouts,
      });
    });
  });
}

async function main() {
  console.log(`\n🚀 Benchmark Suite — ${config.endpoints.length} endpoints`);
  console.log(`   Target: ${host}`);
  console.log(`   Connections: ${config.defaults.connections} | Duration: ${config.defaults.duration}s\n`);

  const results = [];
  for (const ep of config.endpoints) {
    process.stdout.write(`  ${ep.method || "GET"} ${ep.path.padEnd(40)}`);
    const r = await runBenchmark(ep);
    if (r.error) {
      console.log(`❌ ${r.error}`);
    } else {
      console.log(`p50=${r.p50}ms p95=${r.p95}ms p99=${r.p99}ms rps=${r.rps} err=${r.errorRate}%`);
    }
    results.push(r);
  }

  // Write JSON
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const jsonPath = join(benchDir, `benchmark-${timestamp}.json`);
  writeFileSync(jsonPath, JSON.stringify({ timestamp, host, results, thresholds }, null, 2));

  // Write Markdown summary
  let md = `# Benchmark Results\n\n`;
  md += `**Date:** ${new Date().toISOString()}\n`;
  md += `**Target:** ${host}\n`;
  md += `**Connections:** ${config.defaults.connections} | **Duration:** ${config.defaults.duration}s\n\n`;
  md += `| Method | Endpoint | p50 (ms) | p95 (ms) | p99 (ms) | RPS | Peak RPS | Error Rate | TTFB (ms) | Status |\n`;
  md += `|--------|----------|----------|----------|----------|-----|----------|------------|-----------|--------|\n`;

  let allPassed = true;
  for (const r of results) {
    if (r.error) {
      md += `| ${r.method} | ${r.endpoint} | - | - | - | - | - | - | - | ❌ Error | \n`;
      allPassed = false;
      continue;
    }
    const p99Pass = r.p99 <= thresholds.p99_ms;
    const p95Pass = r.p95 <= thresholds.p95_ms;
    const errPass = parseFloat(r.errorRate) <= thresholds.error_rate_pct;
    const rpsPass = r.rps >= thresholds.min_rps;
    const passed = p99Pass && p95Pass && errPass && rpsPass;
    if (!passed) allPassed = false;
    md += `| ${r.method} | ${r.endpoint} | ${r.p50} | ${r.p95} | ${r.p99} | ${r.rps} | ${r.peakRps} | ${r.errorRate}% | ${r.ttfb} | ${passed ? "✅ Pass" : "❌ Fail"} |\n`;
  }

  md += `\n## Thresholds\n\n`;
  md += `| Metric | Threshold | Status |\n|--------|-----------|--------|\n`;
  md += `| p99 Latency | <= ${thresholds.p99_ms}ms | ${allPassed ? "✅" : "❌"} |\n`;
  md += `| p95 Latency | <= ${thresholds.p95_ms}ms | ${allPassed ? "✅" : "❌"} |\n`;
  md += `| Error Rate | <= ${thresholds.error_rate_pct}% | ${allPassed ? "✅" : "❌"} |\n`;
  md += `| Min RPS | >= ${thresholds.min_rps} | ${allPassed ? "✅" : "❌"} |\n`;

  const mdPath = join(benchDir, `benchmark-${timestamp}.md`);
  writeFileSync(mdPath, md);

  console.log(`\n📄 Results written:`);
  console.log(`   JSON: ${jsonPath}`);
  console.log(`   Markdown: ${mdPath}`);
  console.log(`\n${allPassed ? "✅ All endpoints passed thresholds." : "❌ Some endpoints failed thresholds."}\n`);

  if (!allPassed) process.exitCode = 1;
}

main();
