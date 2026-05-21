import autocannon from "autocannon";
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const RESULTS_DIR = join(__dirname, "results");
const THRESHOLDS_FILE = join(__dirname, "thresholds.json");

const BASE_URL = process.env.BENCH_URL || "http://localhost:4000";
const DURATION = process.env.SMOKE ? 5 : 10;
const CONNECTIONS = process.env.SMOKE ? 10 : 50;
const SMOKE = process.env.SMOKE === "true";

const THRESHOLDS = {
  "GET /health": { p99_ms: 50, error_rate: 0.01 },
  "GET /api/jobs": { p99_ms: 200, error_rate: 0.01 },
  "POST /api/jobs": { p99_ms: 300, error_rate: 0.01 },
  "POST /api/auth/register": { p99_ms: 500, error_rate: 0.02 },
  "POST /api/auth/login": { p99_ms: 500, error_rate: 0.02 },
  "GET /api/users": { p99_ms: 300, error_rate: 0.01 },
  "GET /api/reviews": { p99_ms: 200, error_rate: 0.01 },
  "GET /api/payments": { p99_ms: 200, error_rate: 0.01 },
  "POST /api/payments": { p99_ms: 500, error_rate: 0.02 },
  "GET /api/notifications": { p99_ms: 200, error_rate: 0.01 },
  "GET /api/search": { p99_ms: 300, error_rate: 0.01 },
};

const ENDPOINTS = [
  { name: "GET /health", method: "GET", path: "/health" },
  { name: "GET /api/jobs", method: "GET", path: "/api/jobs" },
  { name: "POST /api/jobs", method: "POST", path: "/api/jobs", body: JSON.stringify({ title: "Bench Job", description: "Load test", budget: 5000, skills: ["node"] }), headers: { "Content-Type": "application/json" } },
  { name: "POST /api/auth/register", method: "POST", path: "/api/auth/register", body: JSON.stringify({ email: `bench${Date.now()}@test.com`, password: "BenchTest123!", name: "Bench User" }), headers: { "Content-Type": "application/json" } },
  { name: "POST /api/auth/login", method: "POST", path: "/api/auth/login", body: JSON.stringify({ email: "bench@test.com", password: "BenchTest123!" }), headers: { "Content-Type": "application/json" } },
  { name: "GET /api/users", method: "GET", path: "/api/users" },
  { name: "GET /api/reviews", method: "GET", path: "/api/reviews" },
  { name: "GET /api/payments", method: "GET", path: "/api/payments" },
  { name: "POST /api/payments", method: "POST", path: "/api/payments", body: JSON.stringify({ amount: 1000, currency: "usd" }), headers: { "Content-Type": "application/json" } },
  { name: "GET /api/notifications", method: "GET", path: "/api/notifications" },
  { name: "GET /api/search", method: "GET", path: "/api/search?q=node" },
];

async function runBenchmark(endpoint) {
  const opts = {
    url: BASE_URL,
    duration: DURATION,
    connections: CONNECTIONS,
    method: endpoint.method,
    path: endpoint.path,
    headers: endpoint.headers || {},
    body: endpoint.body || undefined,
  };

  try {
    const result = await autocannon(opts);
    return {
      endpoint: endpoint.name,
      method: endpoint.method,
      path: endpoint.path,
      latency: {
        p50: result.latency.p50,
        p95: result.latency.p95,
        p99: result.latency.p99,
      },
      throughput: {
        requests_per_sec: result.requests.average,
        max_rps: result.requests.max,
      },
      errors: {
        count: result.errors,
        error_rate: result.errors / (result.requests.average * DURATION + result.errors || 1),
        timeouts: result.timeouts,
      },
      ttfb: {
        p50: result.ttfb.p50,
        p95: result.ttfb.p95,
        p99: result.ttfb.p99,
      },
      status_codes: result.statusCodeStats,
    };
  } catch (err) {
    console.error(`Failed to benchmark ${endpoint.name}:`, err.message);
    return {
      endpoint: endpoint.name,
      method: endpoint.method,
      path: endpoint.path,
      error: err.message,
    };
  }
}

async function main() {
  mkdirSync(RESULTS_DIR, { recursive: true });

  console.log(`\n${"=".repeat(60)}`);
  console.log(`FreelanceFlow API Benchmark Suite`);
  console.log(`Target: ${BASE_URL}`);
  console.log(`Duration: ${DURATION}s | Connections: ${CONNECTIONS}`);
  console.log(`Mode: ${SMOKE ? "SMOKE (CI)" : "FULL"}`);
  console.log(`${"=".repeat(60)}\n`);

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const results = [];

  for (const endpoint of ENDPOINTS) {
    console.log(`Benchmarking ${endpoint.name}...`);
    const result = await runBenchmark(endpoint);
    results.push(result);

    if (result.error) {
      console.log(`  ERROR: ${result.error}\n`);
    } else {
      console.log(`  p50: ${result.latency.p50}ms | p95: ${result.latency.p95}ms | p99: ${result.latency.p99}ms`);
      console.log(`  RPS: ${result.throughput.requests_per_sec} | Errors: ${result.errors.count} | TTFB p50: ${result.ttfb.p50}ms\n`);
    }
  }

  const jsonResult = { timestamp, config: { base_url: BASE_URL, duration: DURATION, connections: CONNECTIONS, smoke: SMOKE }, results };
  const jsonFile = join(RESULTS_DIR, `bench-${timestamp}.json`);
  writeFileSync(jsonFile, JSON.stringify(jsonResult, null, 2));
  console.log(`Results written to ${jsonFile}`);

  const markdown = generateMarkdown(jsonResult);
  const mdFile = join(RESULTS_DIR, `bench-${timestamp}.md`);
  writeFileSync(mdFile, markdown);
  console.log(`Markdown summary written to ${mdFile}`);

  if (SMOKE) {
    const failures = checkThresholds(results);
    if (failures.length > 0) {
      console.error("\nThreshold violations:");
      failures.forEach(f => console.error(`  FAIL: ${f.endpoint} - ${f.metric}: ${f.actual} ${f.comparison} ${f.threshold}`));
      console.error(`\n${failures.length} threshold violation(s) detected.`);
      process.exit(1);
    } else {
      console.log("\nAll threshold checks passed.");
    }
  }
}

function checkThresholds(results) {
  const failures = [];
  for (const result of results) {
    if (result.error) continue;
    const threshold = THRESHOLDS[result.endpoint];
    if (!threshold) continue;
    if (result.latency.p99 > threshold.p99_ms) {
      failures.push({ endpoint: result.endpoint, metric: "p99", actual: result.latency.p99, comparison: ">", threshold: threshold.p99_ms });
    }
    const errorRate = result.errors.error_rate || 0;
    if (errorRate > threshold.error_rate) {
      failures.push({ endpoint: result.endpoint, metric: "error_rate", actual: errorRate, comparison: ">", threshold: threshold.error_rate });
    }
  }
  return failures;
}

function generateMarkdown(data) {
  let md = `# API Benchmark Results\n\n`;
  md += `**Date:** ${data.timestamp}\n`;
  md += `**Target:** \`${data.config.base_url}\`\n`;
  md += `**Duration:** ${data.config.duration}s | **Connections:** ${data.config.connections}\n`;
  md += `**Mode:** ${data.config.smoke ? "SMOKE (CI)" : "FULL"}\n\n`;
  md += `| Endpoint | p50 (ms) | p95 (ms) | p99 (ms) | RPS | Error Rate | TTFB p50 |\n`;
  md += `|----------|----------|----------|----------|-----|------------|----------|\n`;
  for (const r of data.results) {
    if (r.error) {
      md += `| ${r.endpoint} | ERROR | - | - | - | - | - |\n`;
    } else {
      md += `| ${r.endpoint} | ${r.latency.p50} | ${r.latency.p95} | ${r.latency.p99} | ${r.throughput.requests_per_sec} | ${(r.errors.error_rate * 100).toFixed(2)}% | ${r.ttfb.p50} |\n`;
    }
  }
  md += `\n---\n_Generated by FreelanceFlow benchmark suite_\n`;
  return md;
}

main().catch(err => { console.error(err); process.exit(1); });