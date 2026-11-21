import { check, sleep } from "k6";
import http from "k6/http";
import { Rate } from "k6/metrics";

const errorRate = new Rate("errors");

export const options = {
  stages: [
    { duration: "10s", target: 5 },
    { duration: "15s", target: 10 },
    { duration: "10s", target: 5 },
  ],
  thresholds: { http_req_duration: ["p(99)<300"], errors: ["rate<0.01"] },
};

const BASE = __ENV.BENCHMARK_HOST || "http://localhost:3000";
const TOKEN = __ENV.BENCHMARK_TOKEN || "";

export default function () {
  const res = http.get(`${BASE}/api/uploads`, {
    headers: { ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}) },
  });
  errorRate.add(res.status >= 400);
  check(res, { "status OK": (r) => r.status < 500 });
  sleep(0.5);
}
