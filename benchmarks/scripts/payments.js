import { check, sleep } from "k6";
import http from "k6/http";
import { Rate } from "k6/metrics";

const errorRate = new Rate("errors");

export const options = {
  stages: [
    { duration: "5s", target: 3 },
    { duration: "15s", target: 8 },
    { duration: "10s", target: 3 },
  ],
  thresholds: {
    http_req_duration: ["p(99)<300"],
    errors: ["rate<0.01"],
  },
};

const BASE = __ENV.BENCHMARK_HOST || "http://localhost:3000";
const TOKEN = __ENV.BENCHMARK_TOKEN || "";

export default function () {
  const endpoints = [
    { url: `${BASE}/api/payments`, method: "GET" },
    { url: `${BASE}/api/payments/intent`, method: "POST", body: { amount: 5000, currency: "usd" } },
  ];

  const ep = endpoints[Math.floor(Math.random() * endpoints.length)];
  const res = http.request(ep.method, ep.url, ep.body ? JSON.stringify(ep.body) : null, {
    headers: { "Content-Type": "application/json", ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}) },
  });

  errorRate.add(res.status >= 400);

  check(res, { "status OK": (r) => r.status < 500 });
  sleep(0.5);
}
