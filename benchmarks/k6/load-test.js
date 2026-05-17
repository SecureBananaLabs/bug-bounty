// FreelanceFlow — Full API Load Test (k6)
// Benchmarks every /api/ endpoint with p50/p95/p99 latency, RPS, TTFB, error rate
//
// Usage:
//   k6 run --out json=results/raw.json benchmarks/k6/load-test.js
//   k6 run --summary-export=results/summary.json benchmarks/k6/load-test.js
//   docker compose --profile bench run k6

import { check, group, sleep, trend } from "k6";
import http from "k6/http";

// ── Configuration ──────────────────────────────────────────
const BASE_URL = __ENV.BASE_URL || "http://localhost:4000";
const VUS = parseInt(__ENV.VUS || "50"); // virtual users
const DURATION = __ENV.DURATION || "60s"; // test duration
const WARMUP = __ENV.WARMUP || "10s"; // warmup phase

// Custom sub-metrics for TTFB and request duration
const ttfbTrend = new trend("ttfb", true);
const reqDuration = new trend("api_request_duration", true);

export const options = {
  scenarios: {
    ramp: {
      executor: "ramping-vus",
      startVUs: 1,
      stages: [
        { duration: WARMUP, target: Math.floor(VUS * 0.3) },
        { duration: "20s", target: VUS },
        { duration: DURATION, target: VUS },
        { duration: "20s", target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_duration: ["p(50)<200", "p(95)<500", "p(99)<1000"],
    http_req_failed: ["rate<0.01"],
  },
  summaryTrendStats: [
    "avg",
    "min",
    "med",
    "p(50)",
    "p(90)",
    "p(95)",
    "p(99)",
    "max",
  ],
};

// ── Shared state ───────────────────────────────────────────
let authToken = "";
let testJobId = "";
const testUser = {
  email: `bench-${Date.now()}@test.com`,
  password: "Benchmark123!",
  name: "Benchmark User",
};

// ── Helper: measure TTFB ───────────────────────────────────
function timedGet(path, params = {}) {
  const start = Date.now();
  const res = http.get(`${BASE_URL}${path}`, params);
  const ttfb = Date.now() - start;
  ttfbTrend.add(ttfb);
  reqDuration.add(res.timings.duration);
  return res;
}

function timedPost(path, body, params = {}) {
  const start = Date.now();
  const res = http.post(
    `${BASE_URL}${path}`,
    JSON.stringify(body),
    Object.assign({ headers: { "Content-Type": "application/json" } }, params)
  );
  const ttfb = Date.now() - start;
  ttfbTrend.add(ttfb);
  reqDuration.add(res.timings.duration);
  return res;
}

// ── Setup ──────────────────────────────────────────────────
export function setup() {
  console.log(`🚀 Benchmark setup — BASE_URL=${BASE_URL}`);

  // Health check
  const health = http.get(`${BASE_URL}/health`);
  check(health, { "health OK": (r) => r.status === 200 });

  // Register & login to get token
  const reg = http.post(
    `${BASE_URL}/api/auth/register`,
    JSON.stringify(testUser),
    { headers: { "Content-Type": "application/json" } }
  );
  check(reg, { "register OK": (r) => r.status === 201 || r.status === 200 });

  const login = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({
      email: testUser.email,
      password: testUser.password,
    }),
    { headers: { "Content-Type": "application/json" } }
  );
  check(login, { "login OK": (r) => r.status === 200 });

  const loginBody = login.json();
  authToken = loginBody.data?.token || loginBody.token || "";

  if (!authToken) {
    console.warn("⚠️  No auth token — authenticated routes will 401");
  }

  // Create a test job for job-specific benchmarks
  const job = http.post(
    `${BASE_URL}/api/jobs`,
    JSON.stringify({
      title: "Benchmark Test Job",
      description: "Auto-created by k6 benchmark",
      budget: 5000,
      category: "dev",
    }),
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
    }
  );
  if (job.status === 201 || job.status === 200) {
    testJobId = job.json().data?.id || "";
  }

  return { authToken, testJobId, testUser };
}

// ── Main test ──────────────────────────────────────────────
export default function (data) {
  const authHeaders = data.authToken
    ? { Authorization: `Bearer ${data.authToken}` }
    : {};

  // Group 1: Health (unauthenticated, fast)
  group("GET /health", () => {
    const res = timedGet("/health");
    check(res, {
      "status 200": (r) => r.status === 200,
      "body ok": (r) => r.json().ok === true,
    });
  });

  // Group 2: Auth endpoints
  group("Auth", () => {
    const res = timedPost("/api/auth/login", {
      email: data.testUser.email,
      password: data.testUser.password,
    });
    check(res, { "login 200": (r) => r.status === 200 });
  });

  // Group 3: User endpoints
  group("Users", () => {
    const list = timedGet("/api/users");
    check(list, { "users 200": (r) => r.status === 200 });
  });

  // Group 4: Jobs (GET + POST)
  group("Jobs", () => {
    const list = timedGet("/api/jobs");
    check(list, { "jobs list 200": (r) => r.status === 200 });

    const create = timedPost(
      "/api/jobs",
      {
        title: "Bench Job",
        description: "Temporary benchmark job",
        budget: 1000,
        category: "testing",
      },
      { headers: authHeaders }
    );
    check(create, {
      "job create OK": (r) => r.status === 201 || r.status === 200,
    });
  });

  // Group 5: Proposals
  group("Proposals", () => {
    const list = timedGet("/api/proposals");
    check(list, { "proposals 200": (r) => r.status === 200 });

    if (data.testJobId) {
      const create = timedPost(
        "/api/proposals",
        {
          jobId: data.testJobId,
          coverLetter: "Benchmark proposal",
          bid: 1500,
        },
        { headers: authHeaders }
      );
      check(create, {
        "proposal create OK": (r) => r.status === 201 || r.status === 200,
      });
    }
  });

  // Group 6: Reviews
  group("Reviews", () => {
    const list = timedGet("/api/reviews");
    check(list, { "reviews 200": (r) => r.status === 200 });
  });

  // Group 7: Messages
  group("Messages", () => {
    const list = timedGet("/api/messages");
    check(list, { "messages 200": (r) => r.status === 200 });
  });

  // Group 8: Notifications
  group("Notifications", () => {
    const list = timedGet("/api/notifications");
    check(list, { "notifications 200": (r) => r.status === 200 });
  });

  // Group 9: Search
  group("Search", () => {
    const res = timedGet("/api/search?q=developer&category=dev");
    check(res, { "search 200": (r) => r.status === 200 });
  });

  // Group 10: Admin (authenticated)
  group("Admin", () => {
    if (data.authToken) {
      const metrics = timedGet("/api/admin/metrics", {
        headers: authHeaders,
      });
      check(metrics, {
        "admin metrics OK": (r) =>
          r.status === 200 || r.status === 401 || r.status === 403,
      });
    }
  });

  // Random sleep to simulate realistic traffic pattern
  sleep(Math.random() * 0.5 + 0.1);
}

// ── Teardown ───────────────────────────────────────────────
export function teardown(data) {
  console.log("✅ Benchmark complete");
}

// ── Custom summary for structured output ───────────────────
export function handleSummary(data) {
  const endpoints = [
    "Health",
    "Auth",
    "Users",
    "Jobs",
    "Proposals",
    "Reviews",
    "Messages",
    "Notifications",
    "Search",
    "Admin",
  ];

  const summary = {
    metadata: {
      timestamp: new Date().toISOString(),
      base_url: BASE_URL,
      vus: VUS,
      duration_seconds: DURATION,
      k6_version: "0.52+",
    },
    http_req_duration: {
      avg: data.metrics.http_req_duration?.values?.avg?.toFixed(2) || 0,
      p50: data.metrics.http_req_duration?.values["p(50)"]?.toFixed(2) || 0,
      p90: data.metrics.http_req_duration?.values["p(90)"]?.toFixed(2) || 0,
      p95: data.metrics.http_req_duration?.values["p(95)"]?.toFixed(2) || 0,
      p99: data.metrics.http_req_duration?.values["p(99)"]?.toFixed(2) || 0,
      max: data.metrics.http_req_duration?.values?.max?.toFixed(2) || 0,
    },
    http_reqs: {
      total: data.metrics.http_reqs?.values?.count || 0,
      rate: data.metrics.http_reqs?.values?.rate?.toFixed(2) || 0,
    },
    http_req_failed: {
      rate: data.metrics.http_req_failed?.values?.rate
        ? (data.metrics.http_req_failed.values.rate * 100).toFixed(2) + "%"
        : "0%",
    },
    ttfb_avg: ttfbTrend
      ? (ttfbTrend.values?.avg || 0).toFixed(2) + "ms"
      : "N/A",
    checks_passed: `${((data.metrics.checks?.values?.passes || 0) / ((data.metrics.checks?.values?.passes || 0) + (data.metrics.checks?.values?.fails || 0)) * 100).toFixed(1)}%`,
  };

  return {
    "stdout": JSON.stringify(summary, null, 2),
    "benchmarks/results/summary.json": JSON.stringify(summary, null, 2),
  };
}
