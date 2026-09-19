// FreelanceFlow API Benchmark Suite — k6 script
// Usage: k6 run benchmark.js
// Metrics: p50/p95/p99 latency, RPS, error rate, TTFB

import { check, sleep } from "k6";
import http from "k6/http";

export const options = {
  thresholds: {
    http_req_failed: ["rate<0.05"],  // < 5% errors
    http_req_duration: ["p(95)<2000"], // p95 < 2s
  },
  summaryTrendStats: ["min", "med", "avg", "p(50)", "p(90)", "p(95)", "p(99)", "max"],
};

const BASE_URL = __ENV.API_BASE_URL || "http://localhost:3001";
const JWT_TOKEN = __ENV.JWT_TOKEN || "";

const params = {
  headers: {
    "Content-Type": "application/json",
    Authorization: JWT_TOKEN ? `Bearer ${JWT_TOKEN}` : "",
  },
};

// ============ Smoke Test (low concurrency) ============
export const smokeOptions = {
  vus: 1,
  duration: "30s",
};

// ============ Load Test ============
export const loadOptions = {
  stages: [
    { duration: "30s", target: 10 },  // ramp-up
    { duration: "1m", target: 10 },   // sustain
    { duration: "30s", target: 0 },   // ramp-down
  ],
};

// ============ Stress Test ============
export const stressOptions = {
  stages: [
    { duration: "1m", target: 20 },
    { duration: "2m", target:  target: 20 },
    { duration: "1m",  target: 50 },
    { duration: "2m",  target: 50 },
    { duration: "1m",  target: 0 },
  ],
};

const endpointGroup = (__ENV.ENDPOINTS || "full").toLowerCase();

// Collect all endpoint testers
const smokeTesters = [];
const loadTesters = [];

function addTester(name, path, method = "GET", body = null) {
  const execute = () => {
    const url = `${BASE_URL}${path}`;
    const res = method === "GET"
      ? http.get(url, params)
      : http.post(url, JSON.stringify(body), params);

    check(res, {
      [`${name} status 2xx`]: (r) => r.status >= 200 && r.status < 300,
      [`${name} status not 5xx`]: (r) => r.status < 500,
    });

    return res;
  };

  smokeTesters.push({ name, execute });
  loadTesters.push({ name, execute });
}

// ============ Endpoints ============
addTester("Health", "/api/health", "GET");
addTester("Auth Register", "/api/auth/register", "POST", {
  email: "bench@test.local",
  password: "BenchPass123!",
});

addTester("Auth Login", "/api/auth/login", "POST", {
  email: "bench@test.local",
  password: "BenchPass123!",
});

addTester("List Jobs", "/api/jobs", "GET");
addTester("Post Job", "/api/jobs", "POST", {
  title: "Benchmark Project",
  description: "Performance testing job posting",
  budget: 500,
  category: "development",
});

addTester("List Users", "/api/users", "GET");
addTester("Search", "/api/search?q=developer", "GET");

addTester("List Proposals", "/api/proposals", "GET");
addTester("List Reviews", "/api/reviews", "GET");
addTester("List Messages", "/api/messages", "GET");
addTester("Notifications", "/api/notifications", "GET");
addTester("Payments", "/api/payments", "GET");

addTester("Admin Users", "/api/admin/users", "GET");
addTester("Upload (placeholder)", "/api/upload", "GET");

// Add more specific job endpoints
addTester("Get Job by ID", "/api/jobs/1", "GET");
addTester("User Profile", "/api/users/profile", "GET");

// ============ Main Execution ============
const endpointMap = {
  health: () => smokeTesters.filter((t) => t.name === "Health"),
  auth: () => smokeTesters.filter((t) => t.name.includes("Auth")),
  jobs: () => smokeTesters.filter((t) => t.name.includes("Job")),
  full: () => smokeTesters,
};

const testers = (endpointMap[endpointGroup] || endpointMap["full"])();

export default function () {
  testers.forEach((t, i) => {
    t.execute();
    if (i < testers.length - 1) sleep(0.1);
  });
}

// ============ Output Helper ============
export function handleSummary(data) {
  const results = {};
  for (const [key, val] of Object.entries(data.metrics || {})) {
    if (val.type === "trend" || val.type === "counter" || val.type === "rate") {
      results[key] = val.values;
    }
  }

  const markdown = `# Benchmark Results
Generated: ${new Date().toISOString()}
Target: ${BASE_URL}
Endpoints: ${endpointGroup}

## Summary

| Metric | Value |
|--------|-------|
| Total Requests | ${data.metrics.http_reqs?.values?.count || "N/A"} |
| Error Rate | ${(data.metrics.http_req_failed?.values?.rate * 100 || 0).toFixed(2)}% |

## Latency (ms)

| Percentile | Value |
|-----------|-------|
| p50 | ${(data.metrics.http_req_duration?.values?.med || 0).toFixed(2)} |
| p90 | ${(data.metrics.http_req_duration?.values?.["p(90)"] || 0).toFixed(2)} |
| p95 | ${(data.metrics.http_req_duration?.values?.["p(95)"] || 0).toFixed(2)} |
| p99 | ${(data.metrics.http_req_duration?.values?.["p(99)"] || 0).toFixed(2)} |

## Throughput

| Metric | Value |
|--------|-------|
| RPS (avg) | ${(data.metrics.http_reqs?.values?.rate || 0).toFixed(2)} |
| TTFB p50 | ${(data.metrics.http_req_waiting?.values?.med || 0).toFixed(2)} ms |
| TTFB p95 | ${(data.metrics.http_req_waiting?.values?.["p(95)"] || 0).toFixed(2)} ms |
`;

  return {
    "stdout": markdown,
    "results/summary.md": markdown,
    "results/summary.json": JSON.stringify(results, null, 2),
  };
}