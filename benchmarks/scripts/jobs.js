import { check, sleep } from "k6";
import http from "k6/http";
import { Rate } from "k6/metrics";
import { randomString } from "https://jslib.k6.io/k6-utils/1.2.0/index.js";

const errorRate = new Rate("errors");

export const options = {
  stages: [
    { duration: "10s", target: 5 },
    { duration: "15s", target: 15 },
    { duration: "10s", target: 5 },
  ],
  thresholds: {
    http_req_duration: ["p(99)<300"],
    errors: ["rate<0.01"],
  },
};

const BASE = __ENV.BENCHMARK_HOST || "http://localhost:3000";
const TOKEN = __ENV.BENCHMARK_TOKEN || "";

const params = (token) => ({
  headers: {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  },
});

export default function () {
  const jobs = [
    { url: `${BASE}/api/jobs`, method: "GET" },
    { url: `${BASE}/api/jobs`, method: "POST", body: { title: `Job ${randomString(8)}`, description: "Test job description", budget: 100, category: "development" } },
    { url: `${BASE}/api/jobs/search?q=developer`, method: "GET" },
  ];

  const ep = jobs[Math.floor(Math.random() * jobs.length)];
  const res = http.request(ep.method, ep.url, ep.body ? JSON.stringify(ep.body) : null, params(TOKEN));

  errorRate.add(res.status >= 400);

  check(res, {
    "status OK": (r) => r.status >= 200 && r.status < 500,
    "response time < 1000ms": (r) => r.timings.duration < 1000,
  });

  sleep(0.3);
}
