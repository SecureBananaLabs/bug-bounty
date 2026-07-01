import test from "node:test";
import assert from "node:assert/strict";
import { percentile, scenarios } from "../../benchmarks/api-benchmark.mjs";

const expectedScenarios = [
  "GET /health",
  "POST /api/auth/register",
  "POST /api/auth/login",
  "GET /api/auth/oauth/:provider/callback",
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
  "GET /api/search",
  "GET /api/admin/metrics"
];

test("api benchmark covers every public API endpoint scenario", () => {
  assert.deepEqual(
    scenarios.map((scenario) => scenario.name),
    expectedScenarios
  );
});

test("percentile selects stable nearest-rank values", () => {
  assert.equal(percentile([10, 20, 30, 40], 50), 20);
  assert.equal(percentile([10, 20, 30, 40], 95), 40);
  assert.equal(percentile([], 95), 0);
});
