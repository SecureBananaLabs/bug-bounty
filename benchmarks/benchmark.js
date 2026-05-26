import autocannon from "autocannon";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const TARGET = process.env.BENCHMARK_TARGET || "http://localhost:4000";
const CONNECTIONS = parseInt(process.env.BENCHMARK_CONNECTIONS || "10", 10);
const DURATION = parseInt(process.env.BENCHMARK_DURATION || "10", 10);
const PIPELINING = parseInt(process.env.BENCHMARK_PIPELINING || "1", 10);
const THRESHOLDS_PATH = path.join(__dirname, "thresholds.json");
const RESULTS_DIR = path.join(__dirname, "results");
const VERBOSE = process.env.BENCHMARK_VERBOSE === "1";

const endpoints = [
  { method: "GET", path: "/health", name: "Health Check" },
  { method: "POST", path: "/api/auth/register", name: "Auth Register",
    body: { email: "test@example.com", password: "password123", role: "FREELANCER" } },
  { method: "POST", path: "/api/auth/login", name: "Auth Login",
    body: { email: "test@example.com", password: "password123" } },
  { method: "GET", path: "/api/auth/oauth/:provider/callback?provider=github", name: "OAuth Callback" },
  { method: "POST", path: "/api/auth/refresh", name: "Auth Refresh",
    body: { token: "placeholder" } },
  { method: "GET", path: "/api/users", name: "List Users" },
  { method: "POST", path: "/api/users", name: "Create User",
    body: { email: `bench-${Date.now()}@test.com`, fullName: "Bench User", password: "benchpass123" } },
  { method: "GET", path: "/api/jobs", name: "List Jobs" },
  { method: "POST", path: "/api/jobs", name: "Create Job",
    body: { title: "Bench Job", description: "Benchmark test job",
      budgetMin: 100, budgetMax: 500, categoryId: "cat1", skills: ["node"] } },
  { method: "GET", path: "/api/proposals", name: "List Proposals" },
  { method: "POST", path: "/api/proposals", name: "Create Proposal",
    body: { coverLetter: "Bench proposal", bidAmount: 200, estDuration: "2 weeks", jobId: "job1", freelancerId: "user1" } },
  { method: "POST", path: "/api/payments", name: "Create Payment",
    body: { amount: 100, currency: "USD", jobId: "job1" } },
  { method: "GET", path: "/api/reviews", name: "List Reviews" },
  { method: "POST", path: "/api/reviews", name: "Create Review",
    body: { rating: 5, comment: "Great work", reviewerId: "user1", revieweeId: "user2" } },
  { method: "GET", path: "/api/messages", name: "List Messages" },
  { method: "POST", path: "/api/messages", name: "Create Message",
    body: { body: "Bench message", senderId: "user1", receiverId: "user2" } },
  { method: "GET", path: "/api/notifications", name: "List Notifications" },
  { method: "POST", path: "/api/notifications", name: "Create Notification",
    body: { userId: "user1", title: "Bench", body: "Benchmark test notification" } },
  { method: "GET", path: "/api/search?q=test", name: "Search" },
  { method: "GET", path: "/api/admin/metrics", name: "Admin Metrics",
    headers: { Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbi11c2VyIiwicm9sZSI6IkFETUlOIiwiaWF0IjoxNTE2MjM5MDIyfQ.CqOqY4qPJqG1LjSFHHQJqXa9L6M5mG6H3PvXLkRLZPw" } },
];

function loadThresholds() {
  try {
    return JSON.parse(fs.readFileSync(THRESHOLDS_PATH, "utf8"));
  } catch {
    return { p99LatencyMs: 500, p95LatencyMs: 200, errorRatePct: 1, minRps: 100 };
  }
}

async function runBenchmark(endpoint) {
  const url = new URL(endpoint.path, TARGET);
  const opts = {
    url: url.toString(),
    method: endpoint.method.toUpperCase(),
    connections: CONNECTIONS,
    duration: DURATION,
    pipelining: PIPELINING,
    headers: { "Content-Type": "application/json", ...(endpoint.headers || {}) },
    ...(endpoint.body ? { body: JSON.stringify(endpoint.body) } : {}),
  };

  return new Promise((resolve, reject) => {
    autocannon(opts, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
}

function formatMs(ms) {
  return ms.toFixed(2) + " ms";
}

function formatNum(n) {
  return n.toLocaleString("en-US");
}

async function main() {
  console.log("=".repeat(70));
  console.log("  FreelanceFlow API Benchmark Suite");
  console.log("=".repeat(70));
  console.log(`  Target:         ${TARGET}`);
  console.log(`  Connections:    ${CONNECTIONS}`);
  console.log(`  Duration:       ${DURATION}s`);
  console.log(`  Pipelining:     ${PIPELINING}`);
  console.log("=".repeat(70));
  console.log();

  const thresholds = loadThresholds();
  const results = [];
  let allPassed = true;

  for (const ep of endpoints) {
    if (!VERBOSE) process.stderr.write(`  ${ep.name}... `);
    const raw = await runBenchmark(ep);
    if (!VERBOSE) process.stderr.write("done\n");

    if (!raw || !raw.latency) {
      console.error(`  [SKIP] No valid result for ${ep.name}`);
      continue;
    }

    const latencies = raw.latency;
    const safe = (v, d = 0) => (v != null ? v : d);
    const p50 = safe(latencies.p50);
    const p95 = safe(latencies.p95);
    const p99 = safe(latencies.p99);
    const avg = safe(latencies.average);
    const rps = safe(raw.requests?.average);
    const throughput = safe(raw.throughput?.average);
    const errors = safe(raw.errors);
    const totalRequests = safe(raw.requests?.total);
    const errorRate = totalRequests > 0 ? (errors / totalRequests) * 100 : 0;
    const ttfb = avg;

    const passed = {
      p99: p99 <= thresholds.p99LatencyMs,
      p95: p95 <= thresholds.p95LatencyMs,
      errorRate: errorRate <= thresholds.errorRatePct,
      rps: rps >= thresholds.minRps,
    };
    if (!passed.p99 || !passed.p95 || !passed.errorRate || !passed.rps) allPassed = false;

    const record = {
      endpoint: ep.path,
      method: ep.method,
      name: ep.name,
      latencies: { avg: +avg.toFixed(2), p50: +p50.toFixed(2), p95: +p95.toFixed(2), p99: +p99.toFixed(2) },
      rps: +rps.toFixed(2),
      throughput: +throughput.toFixed(2),
      errors,
      totalRequests,
      errorRate: +errorRate.toFixed(2),
      ttfb: +ttfb.toFixed(2),
      thresholds: { p99LatencyMs: thresholds.p99LatencyMs, p95LatencyMs: thresholds.p95LatencyMs, errorRatePct: thresholds.errorRatePct, minRps: thresholds.minRps },
      passed,
    };
    results.push(record);

    console.log(`  ${ep.method.padEnd(6)} ${ep.path}`);
    console.log(`    Latency:     p50=${formatMs(p50)}  p95=${formatMs(p95)}  p99=${formatMs(p99)}`);
    console.log(`    RPS:         ${formatNum(rps)} req/s`);
    console.log(`    Throughput:  ${formatNum(throughput)} bytes/s`);
    console.log(`    Errors:      ${errors} / ${formatNum(totalRequests)} (${errorRate.toFixed(2)}%)`);
    console.log(`    Thresholds:  ${passed.p99 ? "✓" : "✗"} p99  ${passed.p95 ? "✓" : "✗"} p95  ${passed.errorRate ? "✓" : "✗"} err  ${passed.rps ? "✓" : "✗"} rps`);
    console.log();
  }

  const summary = results.map(r => ({
    endpoint: r.endpoint,
    method: r.method,
    p50: r.latencies.p50,
    p95: r.latencies.p95,
    p99: r.latencies.p99,
    rps: r.rps,
    errorRate: r.errorRate,
    passed: r.passed,
  }));

  const overallPass = allPassed ? "ALL PASSED" : "SOME FAILED";

  const md = [
    "# Benchmark Results",
    "",
    `**Target:** ${TARGET}  `,
    `**Connections:** ${CONNECTIONS}  `,
    `**Duration:** ${DURATION}s  `,
    `**Date:** ${new Date().toISOString()}  `,
    `**Overall:** ${overallPass}`,
    "",
    "| Endpoint | Method | p50 | p95 | p99 | RPS | Errors | Pass? |",
    "|----------|--------|-----|-----|-----|-----|--------|-------|",
    ...summary.map(r =>
      `| ${r.endpoint} | ${r.method} | ${r.p50}ms | ${r.p95}ms | ${r.p99}ms | ${r.rps} | ${r.errorRate}% | ${r.passed.p99 && r.passed.p95 && r.passed.errorRate ? "✓" : "✗"} |`
    ),
    "",
    "## Thresholds",
    `- p99 latency: ≤ ${thresholds.p99LatencyMs} ms`,
    `- p95 latency: ≤ ${thresholds.p95LatencyMs} ms`,
    `- Error rate: ≤ ${thresholds.errorRatePct}%`,
    `- Min RPS: ≥ ${thresholds.minRps}`,
    "",
  ].join("\n");

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const jsonFile = path.join(RESULTS_DIR, `benchmark-${timestamp}.json`);
  const mdFile = path.join(RESULTS_DIR, `benchmark-${timestamp}.md`);

  fs.writeFileSync(jsonFile, JSON.stringify(results, null, 2));
  fs.writeFileSync(mdFile, md);

  console.log("=".repeat(70));
  console.log(`  Overall: ${overallPass}`);
  console.log(`  JSON:    ${jsonFile}`);
  console.log(`  MD:      ${mdFile}`);
  console.log("=".repeat(70));

  process.exit(allPassed ? 0 : 1);
}

main().catch(err => {
  console.error("Benchmark failed:", err);
  process.exit(1);
});
