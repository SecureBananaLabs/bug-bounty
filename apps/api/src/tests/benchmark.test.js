import test from "node:test";
import assert from "node:assert/strict";
import { createEndpoints } from "../../../../benchmarks/endpoints.js";
import { createBenchmarkToken, percentile, summarize } from "../../../../benchmarks/runner.js";

const routes = [
  "POST /api/auth/register",
  "POST /api/auth/login",
  "GET /api/auth/oauth/:provider/callback",
  "POST /api/auth/refresh",
  "GET /api/users/",
  "POST /api/users/",
  "GET /api/jobs/",
  "POST /api/jobs/",
  "GET /api/proposals/",
  "POST /api/proposals/",
  "POST /api/payments/",
  "GET /api/reviews/",
  "POST /api/reviews/",
  "GET /api/messages/",
  "POST /api/messages/",
  "GET /api/notifications/",
  "POST /api/notifications/",
  "POST /api/uploads/",
  "GET /api/search/",
  "GET /api/admin/metrics"
];

test("benchmark scenarios cover every registered API route", () => {
  const actual = createEndpoints().map(({ method, path }) => `${method} ${path.replace("/api/auth/oauth/github/callback", "/api/auth/oauth/:provider/callback")}`);
  assert.deepEqual(actual, routes);
  assert.equal(createEndpoints().filter((endpoint) => endpoint.auth).length, 1);
});

test("percentile uses nearest-rank values and handles empty samples", () => {
  assert.equal(percentile([], 99), null);
  assert.equal(percentile([8, 1, 4, 2], 50), 2);
  assert.equal(percentile([8, 1, 4, 2], 95), 8);
});

test("summary reports percentiles, errors, average and peak throughput", () => {
  const summary = summarize([
    { latencyMs: 10, ttfbMs: 5, error: false, second: 0 },
    { latencyMs: 20, ttfbMs: 8, error: true, second: 0 },
    { latencyMs: 30, ttfbMs: 12, error: false, second: 1 }
  ], 2);

  assert.deepEqual(summary, {
    requests: 3,
    errors: 1,
    errorRatePercent: 33.33,
    latencyMs: { p50: 20, p95: 30, p99: 30 },
    ttfbMs: { p50: 8, p95: 12, p99: 12 },
    requestsPerSecond: { average: 1.5, peak: 2 }
  });
});

test("benchmark token is an HS256 JWT accepted by jsonwebtoken", async () => {
  const { default: jwt } = await import("jsonwebtoken");
  const secret = "test-secret";
  const token = createBenchmarkToken(secret, "test-admin");
  const payload = jwt.verify(token, secret);
  assert.equal(payload.sub, "test-admin");
  assert.equal(payload.role, "admin");
});
