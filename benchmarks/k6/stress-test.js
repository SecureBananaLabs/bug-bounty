// FreelanceFlow — Stress Test
// Pushes the API to its breaking point to find max RPS and saturation
//
// Usage: k6 run benchmarks/k6/stress-test.js

import { check } from "k6";
import http from "k6/http";

const BASE_URL = __ENV.BASE_URL || "http://localhost:4000";
const MAX_VUS = parseInt(__ENV.MAX_VUS || "500");

export const options = {
  scenarios: {
    stress: {
      executor: "ramping-arrival-rate",
      startRate: 10,
      timeUnit: "1s",
      preAllocatedVUs: 10,
      maxVUs: MAX_VUS,
      stages: [
        { duration: "30s", target: 50 },  // ramp to 50 RPS
        { duration: "30s", target: 100 }, // ramp to 100 RPS
        { duration: "30s", target: 200 }, // ramp to 200 RPS
        { duration: "30s", target: 500 }, // push to 500 RPS
        { duration: "30s", target: 50 },  // cool down
      ],
    },
  },
  thresholds: {
    http_req_duration: ["p(95)<2000"],
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

export default function () {
  // Mix of GET/POST to simulate real traffic
  const endpoints = [
    () => http.get(`${BASE_URL}/health`),
    () => http.get(`${BASE_URL}/api/jobs`),
    () =>
      http.post(
        `${BASE_URL}/api/auth/login`,
        JSON.stringify({
          email: "stress@test.com",
          password: "Stress123!",
        }),
        { headers: { "Content-Type": "application/json" } }
      ),
    () => http.get(`${BASE_URL}/api/search?q=react`),
    () => http.get(`${BASE_URL}/api/users`),
  ];

  const fn = endpoints[Math.floor(Math.random() * endpoints.length)];
  const res = fn();
  check(res, { "OK": (r) => r.status < 500 });
}

export function handleSummary(data) {
  return {
    stdout: JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        max_vus: MAX_VUS,
        http_req_duration_p95:
          data.metrics.http_req_duration?.values["p(95)"]?.toFixed(2) + "ms",
        http_req_duration_p99:
          data.metrics.http_req_duration?.values["p(99)"]?.toFixed(2) + "ms",
        peak_rps:
          data.metrics.http_reqs?.values?.rate?.toFixed(2) + " req/s",
        total_requests: data.metrics.http_reqs?.values?.count,
        failure_rate:
          (data.metrics.http_req_failed?.values?.rate
            ? (data.metrics.http_req_failed.values.rate * 100).toFixed(2) + "%"
            : "0%"),
      },
      null,
      2
    ),
  };
}
