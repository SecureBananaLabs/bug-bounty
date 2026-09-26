import test from "node:test";
import assert from "node:assert/strict";

import { getBenchmarkEndpoints } from "../../../../benchmarks/api/endpoints.mjs";

test("benchmark manifest covers every mounted API endpoint", () => {
  const endpoints = getBenchmarkEndpoints({ token: "benchmark-token" });
  const routeKeys = endpoints.map((endpoint) => `${endpoint.method} ${endpoint.path}`);

  assert.deepEqual(new Set(routeKeys), new Set([
    "POST /api/auth/register",
    "POST /api/auth/login",
    "GET /api/auth/oauth/github/callback",
    "POST /api/auth/refresh",
    "GET /api/users",
    "POST /api/users",
    "GET /api/jobs",
    "POST /api/jobs",
    "GET /api/proposals",
    "POST /api/proposals",
    "POST /api/payments",
    "GET /api/reviews",
    "POST /api/reviews",
    "GET /api/messages",
    "POST /api/messages",
    "GET /api/notifications",
    "POST /api/notifications",
    "POST /api/uploads",
    "GET /api/search?q=design%20systems%20react",
    "GET /api/admin/metrics"
  ]));

  assert.ok(endpoints.every((endpoint) => endpoint.path.startsWith("/api/")));
  assert.equal(
    endpoints.find((endpoint) => endpoint.name === "GET /api/admin/metrics").headers.authorization,
    "Bearer benchmark-token"
  );
});
