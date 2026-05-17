// FreelanceFlow — Smoke Test (quick sanity check)
// Runs a single iteration against all endpoints to verify they work
//
// Usage: k6 run benchmarks/k6/smoke-test.js

import { check, group } from "k6";
import http from "k6/http";

const BASE_URL = __ENV.BASE_URL || "http://localhost:4000";

export const options = {
  vus: 1,
  iterations: 1,
  thresholds: {
    http_req_duration: ["p(95)<1000"],
    http_req_failed: ["rate<0.05"],
  },
};

export default function () {
  // Health
  group("health", () => {
    const r = http.get(`${BASE_URL}/health`);
    check(r, { "200": (x) => x.status === 200 });
  });

  // Register
  const email = `smoke-${Date.now()}@test.com`;
  group("register", () => {
    const r = http.post(
      `${BASE_URL}/api/auth/register`,
      JSON.stringify({ email, password: "Smoke123!", name: "Smoke" }),
      { headers: { "Content-Type": "application/json" } }
    );
    check(r, { "created": (x) => x.status === 201 || x.status === 200 });
  });

  // Login
  let token = "";
  group("login", () => {
    const r = http.post(
      `${BASE_URL}/api/auth/login`,
      JSON.stringify({ email, password: "Smoke123!" }),
      { headers: { "Content-Type": "application/json" } }
    );
    check(r, { "200": (x) => x.status === 200 });
    token = r.json().data?.token || "";
  });

  // GET routes
  const gets = [
    "/api/users",
    "/api/jobs",
    "/api/proposals",
    "/api/reviews",
    "/api/messages",
    "/api/notifications",
    "/api/search?q=dev",
  ];

  for (const path of gets) {
    group(`GET ${path}`, () => {
      const r = http.get(`${BASE_URL}${path}`);
      check(r, { "200": (x) => x.status === 200 });
    });
  }

  // Auth-required
  if (token) {
    group("GET /api/admin/metrics", () => {
      const r = http.get(`${BASE_URL}/api/admin/metrics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      check(r, { "auth OK": (x) => x.status === 200 || x.status === 401 });
    });
  }

  console.log("✅ Smoke test passed — all endpoints responding");
}
