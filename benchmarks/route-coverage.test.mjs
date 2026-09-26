import test from "node:test";
import assert from "node:assert/strict";
import { benchmarkRoutes } from "./routes.mjs";

const expectedRoutes = [
  "GET /health",
  "POST /api/auth/register",
  "POST /api/auth/login",
  "GET /api/auth/oauth/github/callback?code=benchmark-code&state=benchmark-state",
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
  "GET /api/search?q=enterprise%20performance%20audit",
  "GET /api/admin/metrics"
];

test("benchmark manifest covers the full API surface", () => {
  const actualRoutes = benchmarkRoutes.map((route) => `${route.method} ${route.path}`);
  assert.deepEqual(actualRoutes, expectedRoutes);
  assert.equal(benchmarkRoutes.filter((route) => route.requiresAuth).length, 1);
  assert.equal(benchmarkRoutes.length, expectedRoutes.length);
});
