import test from "node:test";
import assert from "node:assert/strict";
import { benchmarkEndpoints } from "../../../../benchmarks/endpoints.mjs";

test("benchmark suite covers every mounted API route", () => {
  const expectedRoutes = new Set([
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
    "GET /api/search?q=react%20payments%20benchmark",
    "GET /api/admin/metrics"
  ]);

  const benchmarkRoutes = new Set(
    benchmarkEndpoints
      .filter((endpoint) => endpoint.path.startsWith("/api/"))
      .map((endpoint) => `${endpoint.method} ${endpoint.path}`)
  );

  assert.deepEqual(benchmarkRoutes, expectedRoutes);
});
