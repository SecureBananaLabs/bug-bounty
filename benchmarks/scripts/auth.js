import { check, sleep } from "k6";
import http from "k6/http";
import { Rate, Trend } from "k6/metrics";

const errorRate = new Rate("errors");
const ttfbTrend = new Trend("ttfb");

export const options = {
  stages: [
    { duration: "10s", target: 5 },
    { duration: "10s", target: 10 },
    { duration: "10s", target: 5 },
  ],
  thresholds: {
    http_req_duration: ["p(99)<200"],
    errors: ["rate<0.01"],
  },
};

const BASE = __ENV.BENCHMARK_HOST || "http://localhost:3000";

export default function () {
  const endpoints = [
    { url: `${BASE}/health`, method: "GET" },
    { url: `${BASE}/api/auth/login`, method: "POST", body: JSON.stringify({ email: "test@test.com", password: "test123" }) },
    { url: `${BASE}/api/auth/register`, method: "POST", body: JSON.stringify({ email: `user${__VU}@test.com`, password: "test123", role: "freelancer" }) },
  ];

  const ep = endpoints[Math.floor(Math.random() * endpoints.length)];
  const params = { headers: { "Content-Type": "application/json" } };
  const res = http.request(ep.method, ep.url, ep.body || null, params);

  errorRate.add(res.status >= 400);
  ttfbTrend.add(res.timings.waiting);

  check(res, {
    "status is 200 or 400": (r) => r.status === 200 || r.status === 400,
    "response time < 500ms": (r) => r.timings.duration < 500,
  });

  sleep(0.5);
}
