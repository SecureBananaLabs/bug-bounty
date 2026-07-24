// k6 Benchmark Suite — FreelanceFlow API
// Measures p50/p95/p99 latency, RPS, error rate, and TTFB across all /api/ endpoints
//
// Usage:
//   k6 run benchmarks/api-benchmark.js
//   k6 run --vus 50 --duration 60s benchmarks/api-benchmark.js

import http from "k6/http";
import { check, sleep, group } from "k6";
import { Trend, Rate, Counter } from "k6/metrics";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

// ── Custom Metrics ──────────────────────────────────────────
const ttfb = new Trend("ttfb", true);
const latencyP50 = new Trend("latency_p50");
const latencyP95 = new Trend("latency_p95");
const latencyP99 = new Trend("latency_p99");
const errorRate = new Rate("error_rate");
const requestCount = new Counter("request_count");

// ── Configuration ───────────────────────────────────────────
const BASE_URL = __ENV.API_URL || "http://localhost:3001";
// Test token for auth-protected routes — get from setup or env
const TEST_TOKEN = __ENV.TEST_TOKEN || "benchmark-token-xxxxxxxx";

// ── Test Scenarios ──────────────────────────────────────────
export const options = {
  thresholds: {
    http_req_duration: ["p(95)<2000"], // 95% of requests under 2s
    http_req_failed: ["rate<0.05"],     // Less than 5% error rate
  },
  scenarios: {
    // Scenario 1: Constant load for steady-state measurement
    steady_load: {
      executor: "constant-arrival-rate",
      rate: 20,
      timeUnit: "1s",
      duration: "30s",
      preAllocatedVUs: 10,
      maxVUs: 50,
      exec: "runEndpointSuite",
    },
    // Scenario 2: Ramp-up to find breaking point
    stress_test: {
      executor: "ramping-arrival-rate",
      startRate: 5,
      timeUnit: "1s",
      stages: [
        { target: 20, duration: "15s" },
        { target: 40, duration: "15s" },
        { target: 60, duration: "15s" },
        { target: 10, duration: "10s" },
      ],
      preAllocatedVUs: 20,
      maxVUs: 80,
      exec: "runEndpointSuite",
    },
  },
};

// ── Utility: Make a benchmarked request ─────────────────────
function benchRequest(method, path, body = null, auth = false) {
  const headers = { "Content-Type": "application/json" };
  if (auth) headers["Authorization"] = `Bearer ${TEST_TOKEN}`;

  const params = { headers };
  if (body) params.body = JSON.stringify(body);

  const start = Date.now();
  const res = http.request(method, `${BASE_URL}${path}`, body ? JSON.stringify(body) : null, params);
  const duration = Date.now() - start;

  // Record metrics
  ttfb.add(res.timings.waiting);
  requestCount.add(1);
  
  const isError = res.status >= 400 || res.status === 0;
  errorRate.add(isError);

  // Check response
  check(res, {
    [`${method} ${path} — status < 500`]: (r) => r.status < 500,
    [`${method} ${path} — response time < 5s`]: () => duration < 5000,
  });

  return { duration, status: res.status, ttfb: res.timings.waiting };
}

// ── Endpoint Suite ──────────────────────────────────────────
export function runEndpointSuite() {
  const results = [];

  group("Health & Meta", () => {
    results.push(benchRequest("GET", "/api/health"));
    results.push(benchRequest("GET", "/api/version"));
  });

  group("Authentication", () => {
    results.push(benchRequest("POST", "/api/auth/login", {
      email: "benchmark@test.com",
      password: "benchmark-pass-123",
    }));
    results.push(benchRequest("POST", "/api/auth/register", {
      email: `bench-${Date.now()}@test.com`,
      password: "benchmark-pass-123",
      name: "Benchmark User",
    }));
  });

  group("Users (auth)", () => {
    results.push(benchRequest("GET", "/api/users/me", null, true));
    results.push(benchRequest("GET", "/api/users", null, true));
  });

  group("Jobs", () => {
    results.push(benchRequest("GET", "/api/jobs"));
    results.push(benchRequest("GET", "/api/jobs?search=developer&page=1"));
    results.push(benchRequest("POST", "/api/jobs", {
      title: `Benchmark Job ${Date.now()}`,
      description: "Automated benchmark test job",
      budget: 100,
    }, true));
  });

  group("Proposals (auth)", () => {
    results.push(benchRequest("GET", "/api/proposals", null, true));
  });

  group("Messages (auth)", () => {
    results.push(benchRequest("GET", "/api/messages", null, true));
  });

  group("Notifications (auth)", () => {
    results.push(benchRequest("GET", "/api/notifications", null, true));
  });

  group("Reviews", () => {
    results.push(benchRequest("GET", "/api/reviews"));
  });

  group("Search", () => {
    results.push(benchRequest("GET", "/api/search?q=developer"));
  });

  group("Admin (auth)", () => {
    results.push(benchRequest("GET", "/api/admin/stats", null, true));
  });

  group("Upload", () => {
    results.push(benchRequest("GET", "/api/upload/presigned", null, true));
  });

  // Collect latency stats
  const durations = results.map((r) => r.duration).sort((a, b) => a - b);
  if (durations.length > 0) {
    const p50 = durations[Math.floor(durations.length * 0.5)];
    const p95 = durations[Math.floor(durations.length * 0.95)];
    const p99 = durations[Math.floor(durations.length * 0.99)];
    const avg = durations.reduce((a, b) => a + b, 0) / durations.length;

    // Record to custom trends (scoped to this iteration)
    // Note: Trends aggregate across all VUs, giving us overall percentiles
  }

  sleep(0.5);
}

// ── Summary Report ──────────────────────────────────────────
export function handleSummary(data) {
  const metrics = data.metrics;
  
  const report = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    summary: {
      totalRequests: metrics.http_reqs?.values?.count || 0,
      totalFailed: metrics.http_req_failed?.values?.passes || 0,
      failureRate: metrics.http_req_failed?.values?.rate
        ? (metrics.http_req_failed.values.rate * 100).toFixed(2) + "%"
        : "N/A",
      httpReqDuration: {
        avg: metrics.http_req_duration?.values?.avg?.toFixed(2) + "ms" || "N/A",
        p50: metrics.http_req_duration?.values?.["p(50)"]?.toFixed(2) + "ms" || "N/A",
        p95: metrics.http_req_duration?.values?.["p(95)"]?.toFixed(2) + "ms" || "N/A",
        p99: metrics.http_req_duration?.values?.["p(99)"]?.toFixed(2) + "ms" || "N/A",
        min: metrics.http_req_duration?.values?.min?.toFixed(2) + "ms" || "N/A",
        max: metrics.http_req_duration?.values?.max?.toFixed(2) + "ms" || "N/A",
      },
      ttfb: {
        avg: metrics.ttfb?.values?.avg?.toFixed(2) + "ms" || "N/A",
      },
      rps: metrics.http_reqs?.values?.rate?.toFixed(2) || "N/A",
      dataReceived: ((metrics.data_received?.values?.count || 0) / 1024).toFixed(2) + " KB",
    },
    endpoints: data.root_group?.groups?.map((g) => ({
      name: g.name,
      checks: g.checks?.map((c) => ({
        name: c.name,
        passes: c.passes,
        fails: c.fails,
      })) || [],
    })) || [],
  };

  return {
    "benchmarks/report.json": JSON.stringify(report, null, 2),
    stdout: textSummary(data, { indent: "  ", enableColors: false }),
  };
}

// ── Setup: Called once per test run ─────────────────────────
export function setup() {
  console.log(`\n🚀 Benchmark Suite Starting`);
  console.log(`   Target: ${BASE_URL}`);
  console.log(`   VUs: ${options.scenarios.steady_load.preAllocatedVUs}`);
  console.log(`   Duration: ${options.scenarios.steady_load.duration}\n`);
  return {};
}

export function teardown() {
  console.log("\n✅ Benchmark Suite Complete\n");
}
