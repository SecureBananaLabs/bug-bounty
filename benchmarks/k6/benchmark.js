import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";
import { SharedArray } from "k6/data";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.2/index.js";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
const BASE_URL = __ENV.BASE_URL || "http://localhost:4000";
const BENCHMARK_TOKEN = __ENV.BENCHMARK_TOKEN || "";

// Custom metrics
const ttfb = new Trend("ttfb", true);
const errorRate = new Rate("errors");

// Load thresholds from file (defaults provided)
const defaultThresholds = {
  p99_latency_ms: 500,
  error_rate_percent: 5,
  min_rps: 50,
};

// ---------------------------------------------------------------------------
// Test options
// ---------------------------------------------------------------------------
export const options = {
  scenarios: {
    // --- Public endpoints: moderate load ---
    public_endpoints: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "10s", target: 20 },
        { duration: "30s", target: 20 },
        { duration: "10s", target: 0 },
      ],
      gracefulRampDown: "5s",
      tags: { scenario: "public" },
      exec: "publicEndpoints",
    },
    // --- Auth endpoints: lighter load ---
    auth_endpoints: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "10s", target: 10 },
        { duration: "20s", target: 10 },
        { duration: "10s", target: 0 },
      ],
      gracefulRampDown: "5s",
      tags: { scenario: "auth" },
      exec: "authEndpoints",
    },
    // --- Auth-protected endpoints: light load ---
    protected_endpoints: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "10s", target: 10 },
        { duration: "20s", target: 10 },
        { duration: "10s", target: 0 },
      ],
      gracefulRampDown: "5s",
      tags: { scenario: "protected" },
      exec: "protectedEndpoints",
    },
  },
  thresholds: {
    http_req_duration: [`p(99)<${defaultThresholds.p99_latency_ms}`],
    errors: [`rate<${defaultThresholds.error_rate_percent / 100}`],
    http_reqs: [`rate>${defaultThresholds.min_rps}`],
  },
  summaryTrendStats: ["avg", "min", "med", "p90", "p95", "p99", "max"],
};

// ---------------------------------------------------------------------------
// Helper: authenticated headers
// ---------------------------------------------------------------------------
function authHeaders() {
  return BENCHMARK_TOKEN
    ? { Authorization: `Bearer ${BENCHMARK_TOKEN}` }
    : {};
}

// ---------------------------------------------------------------------------
// Scenario: Public endpoints
// ---------------------------------------------------------------------------
export function publicEndpoints() {
  const tags = { endpoint: "health" };
  let res = http.get(`${BASE_URL}/health`, { tags });
  recordMetrics(res, tags);
  check(res, { "health ok": (r) => r.status === 200 });
  sleep(0.5);

  // GET /api/jobs
  tags.endpoint = "get_jobs";
  res = http.get(`${BASE_URL}/api/jobs`, { tags });
  recordMetrics(res, tags);
  check(res, { "jobs status 2xx": (r) => r.status >= 200 && r.status < 300 });
  sleep(0.5);

  // GET /api/users
  tags.endpoint = "get_users";
  res = http.get(`${BASE_URL}/api/users`, { tags });
  recordMetrics(res, tags);
  check(res, { "users status 2xx": (r) => r.status >= 200 && r.status < 300 });
  sleep(0.5);

  // GET /api/search?q=test
  tags.endpoint = "search";
  res = http.get(`${BASE_URL}/api/search?q=test`, { tags });
  recordMetrics(res, tags);
  check(res, { "search status 2xx": (r) => r.status >= 200 && r.status < 300 });
  sleep(0.5);

  // GET /api/reviews
  tags.endpoint = "get_reviews";
  res = http.get(`${BASE_URL}/api/reviews`, { tags });
  recordMetrics(res, tags);
  check(res, { "reviews status 2xx": (r) => r.status >= 200 && r.status < 300 });
  sleep(0.5);
}

// ---------------------------------------------------------------------------
// Scenario: Auth endpoints (write-only, creates test data)
// ---------------------------------------------------------------------------
export function authEndpoints() {
  const tags = { endpoint: "register" };
  const timestamp = Date.now();
  const payload = JSON.stringify({
    email: `bench_${timestamp}_${Math.random().toString(36).slice(2, 8)}@example.com`,
    password: "BenchTest123!",
    name: "Benchmark User",
  });
  const params = { tags, headers: { "Content-Type": "application/json" } };

  let res = http.post(`${BASE_URL}/api/auth/register`, payload, params);
  recordMetrics(res, tags);
  check(res, { "register status": (r) => r.status === 201 || r.status === 400 || r.status === 409 });
  sleep(1);

  // POST /api/auth/login
  tags.endpoint = "login";
  const loginPayload = JSON.stringify({
    email: `bench_${timestamp}_${Math.random().toString(36).slice(2, 8)}@example.com`,
    password: "BenchTest123!",
  });
  res = http.post(`${BASE_URL}/api/auth/login`, loginPayload, params);
  recordMetrics(res, tags);
  check(res, { "login status": (r) => r.status === 200 || r.status === 401 });
  sleep(1);

  // POST /api/auth/refresh
  tags.endpoint = "refresh";
  res = http.post(`${BASE_URL}/api/auth/refresh`, "{}", params);
  recordMetrics(res, tags);
  check(res, { "refresh status": (r) => r.status === 200 || r.status === 401 });
  sleep(1);
}

// ---------------------------------------------------------------------------
// Scenario: Auth-protected endpoints
// ---------------------------------------------------------------------------
export function protectedEndpoints() {
  const headers = { ...authHeaders(), "Content-Type": "application/json" };
  const tags = { endpoint: "get_proposals" };
  const params = { tags, headers };

  // GET /api/proposals
  let res = http.get(`${BASE_URL}/api/proposals`, params);
  recordMetrics(res, tags);
  check(res, { "proposals status": (r) => r.status === 200 || r.status === 401 });
  sleep(0.5);

  // GET /api/messages
  tags.endpoint = "get_messages";
  res = http.get(`${BASE_URL}/api/messages`, params);
  recordMetrics(res, tags);
  check(res, { "messages status": (r) => r.status === 200 || r.status === 401 });
  sleep(0.5);

  // GET /api/notifications
  tags.endpoint = "get_notifications";
  res = http.get(`${BASE_URL}/api/notifications`, params);
  recordMetrics(res, tags);
  check(res, { "notifications status": (r) => r.status === 200 || r.status === 401 });
  sleep(0.5);

  // POST /api/jobs
  tags.endpoint = "post_job";
  const jobPayload = JSON.stringify({
    title: "Benchmark Test Job",
    description: "This is a benchmark test job posting",
    budget: 1000,
    category: "development",
  });
  res = http.post(`${BASE_URL}/api/jobs`, jobPayload, params);
  recordMetrics(res, tags);
  check(res, { "post job status": (r) => r.status === 201 || r.status === 401 });
  sleep(0.5);

  // POST /api/payments
  tags.endpoint = "post_payment";
  const paymentPayload = JSON.stringify({ amount: 1000, currency: "usd" });
  res = http.post(`${BASE_URL}/api/payments`, paymentPayload, params);
  recordMetrics(res, tags);
  check(res, { "payment status": (r) => r.status === 201 || r.status === 401 || r.status === 400 });
  sleep(0.5);

  // GET /api/admin/metrics
  tags.endpoint = "admin_metrics";
  res = http.get(`${BASE_URL}/api/admin/metrics`, params);
  recordMetrics(res, tags);
  check(res, { "admin metrics status": (r) => r.status === 200 || r.status === 401 || r.status === 403 });
  sleep(0.5);
}

// ---------------------------------------------------------------------------
// Record custom metrics
// ---------------------------------------------------------------------------
function recordMetrics(res, tags) {
  if (res.timings) {
    ttfb.add(res.timings.waiting, tags);
  }
  errorRate.add(res.status >= 400, tags);
}

// ---------------------------------------------------------------------------
// Handle summary — write JSON results + markdown summary
// ---------------------------------------------------------------------------
export function handleSummary(data) {
  const resultsDir = "benchmarks/results";

  // JSON output
  const jsonOutput = JSON.stringify(data, null, 2);

  // Markdown summary
  const md = generateMarkdownSummary(data);

  return {
    stdout: textSummary(data, { indent: "  ", limitCols: 80 }),
    [`${resultsDir}/latest.json`]: jsonOutput,
    [`${resultsDir}/latest.md`]: md,
  };
}

function generateMarkdownSummary(data) {
  const lines = [];
  lines.push("# Benchmark Results");
  lines.push(`\n**Date:** ${new Date().toISOString()}`);
  lines.push(`**Base URL:** ${BASE_URL}`);
  lines.push("");

  // Overall metrics
  const metrics = data.metrics;
  lines.push("## Overall Metrics");
  lines.push("");
  lines.push("| Metric | Value |");
  lines.push("|--------|-------|");

  if (metrics.http_req_duration) {
    lines.push(`| p50 latency | ${metrics.http_req_duration.values["med"].toFixed(2)} ms |`);
    lines.push(`| p95 latency | ${metrics.http_req_duration.values["p(95)"].toFixed(2)} ms |`);
    lines.push(`| p99 latency | ${metrics.http_req_duration.values["p(99)"].toFixed(2)} ms |`);
  }
  if (metrics.http_reqs) {
    lines.push(`| Requests/sec | ${metrics.http_reqs.values.rate.toFixed(2)} |`);
    lines.push(`| Total requests | ${metrics.http_reqs.values.count} |`);
  }
  if (metrics.errors) {
    lines.push(`| Error rate | ${(metrics.errors.values.rate * 100).toFixed(2)}% |`);
  }
  if (metrics.ttfb) {
    lines.push(`| TTFB (avg) | ${metrics.ttfb.values.avg.toFixed(2)} ms |`);
    lines.push(`| TTFB (p95) | ${metrics.ttfb.values["p(95)"].toFixed(2)} ms |`);
  }

  lines.push("");

  // Per-scenario breakdown
  lines.push("## Scenario Breakdown");
  lines.push("");

  for (const [name, scenario] of Object.entries(data.scenarios || {})) {
    lines.push(`### ${name}`);
    if (scenario.metrics) {
      lines.push("");
      lines.push("| Metric | p50 | p95 | p99 | RPS | Error Rate |");
      lines.push("|--------|-----|-----|-----|-----|------------|");

      const duration = scenario.metrics.http_req_duration?.values;
      const reqs = scenario.metrics.http_reqs?.values;
      const errors = scenario.metrics.errors?.values;

      const p50 = duration?.med?.toFixed(2) || "-";
      const p95 = duration?.["p(95)"]?.toFixed(2) || "-";
      const p99 = duration?.["p(99)"]?.toFixed(2) || "-";
      const rps = reqs?.rate?.toFixed(2) || "-";
      const errRate = errors ? `${(errors.rate * 100).toFixed(2)}%` : "-";

      lines.push(`| ${name} | ${p50} ms | ${p95} ms | ${p99} ms | ${rps} | ${errRate} |`);
    }
    lines.push("");
  }

  // Thresholds
  lines.push("## Thresholds");
  lines.push("");
  lines.push(`| Threshold | Value | Passed |`);
  lines.push(`|-----------|-------|--------|`);
  if (metrics.http_req_duration?.thresholds) {
    for (const [key, val] of Object.entries(metrics.http_req_duration.thresholds)) {
      lines.push(`| http_req_duration ${key} | ${JSON.stringify(val)} | ${val.ok ? "✅" : "❌"} |`);
    }
  }

  lines.push("");
  lines.push("---");
  lines.push(`*Generated by k6 benchmark suite*`);

  return lines.join("\n");
}
