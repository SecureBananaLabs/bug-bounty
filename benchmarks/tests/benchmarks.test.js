import assert from "node:assert/strict";
import test from "node:test";
import { registerSchema, loginSchema } from "../../apps/api/src/validators/auth.js";
import { createJobSchema } from "../../apps/api/src/validators/job.js";
import { endpoints, requestHeaders } from "../endpoints.js";
import { errorRate, percentileSorted, summarize } from "../lib/metrics.js";
import { evaluateThresholds, resolveThreshold } from "../lib/thresholds.js";

test("percentile uses nearest-rank over sorted values", () => {
  const values = [1, 2, 3, 4, 5];

  assert.equal(percentileSorted(values, 50), 3);
  assert.equal(percentileSorted(values, 95), 5);
  assert.equal(percentileSorted(values, 99), 5);
  assert.equal(percentileSorted([], 95), null);
});

test("summarize reports p50/p95/p99 and mean", () => {
  const summary = summarize([1, 2, 3, 4, 5]);

  assert.equal(summary.samples, 5);
  assert.equal(summary.mean, 3);
  assert.equal(summary.p50, 3);
  assert.equal(summary.p95, 5);
  assert.equal(summary.p99, 5);
  assert.equal(summary.min, 1);
  assert.equal(summary.max, 5);
});

test("summarize handles an empty sample set", () => {
  assert.deepEqual(summarize([]), {
    samples: 0,
    min: null,
    mean: null,
    p50: null,
    p95: null,
    p99: null,
    max: null
  });
});

test("errorRate includes non-2xx, transport errors and timeouts", () => {
  const rate = errorRate({ completed: 100, non2xx: 2, errors: 1, timeouts: 1 });

  assert.equal(rate, 3.92);
  assert.equal(errorRate({ completed: 0, non2xx: 0, errors: 0, timeouts: 0 }), 0);
});

test("threshold evaluation applies defaults and per-endpoint overrides", () => {
  const thresholds = {
    default: { p99Ms: 300, errorRatePct: 1 },
    endpoints: { "GET /api/jobs": { p99Ms: 50 } }
  };

  assert.deepEqual(resolveThreshold(thresholds, "GET /api/jobs"), {
    p99Ms: 50,
    errorRatePct: 1
  });
  assert.deepEqual(resolveThreshold(thresholds, "GET /api/users"), {
    p99Ms: 300,
    errorRatePct: 1
  });

  const passing = evaluateThresholds(
    [{ key: "GET /api/users", latency: { p99: 120 }, errorRatePct: 0 }],
    thresholds
  );
  assert.equal(passing.passed, true);

  const failing = evaluateThresholds(
    [
      { key: "GET /api/jobs", latency: { p99: 60 }, errorRatePct: 0 },
      { key: "GET /api/users", latency: { p99: 10 }, errorRatePct: 2 }
    ],
    thresholds
  );
  assert.equal(failing.passed, false);
  assert.deepEqual(
    failing.violations.map((violation) => `${violation.key}:${violation.metric}`),
    ["GET /api/jobs:p99", "GET /api/users:errorRate"]
  );
});

test("every benchmarked route is mounted under /api", () => {
  assert.equal(endpoints.length, 20);
  assert.equal(new Set(endpoints.map((endpoint) => endpoint.key)).size, endpoints.length);

  for (const endpoint of endpoints) {
    assert.match(endpoint.route, /^\/api\//, `${endpoint.key} is outside /api`);
    assert.match(endpoint.key, /^(GET|POST) /);
  }
});

test("payloads satisfy the production validators", () => {
  const byKey = Object.fromEntries(endpoints.map((endpoint) => [endpoint.key, endpoint]));

  assert.doesNotThrow(() => registerSchema.parse(JSON.parse(byKey["POST /api/auth/register"].body)));
  assert.doesNotThrow(() => loginSchema.parse(JSON.parse(byKey["POST /api/auth/login"].body)));
  assert.doesNotThrow(() => createJobSchema.parse(JSON.parse(byKey["POST /api/jobs"].body)));
});

test("payload sizes match production-shaped records", () => {
  const byKey = Object.fromEntries(endpoints.map((endpoint) => [endpoint.key, endpoint]));

  assert.ok(Buffer.byteLength(byKey["POST /api/jobs"].body) > 1024);
  assert.ok(Buffer.byteLength(byKey["POST /api/proposals"].body) > 1024);
  assert.ok(Buffer.byteLength(byKey["POST /api/uploads"].body) > 128 * 1024);
  assert.equal(byKey["GET /api/jobs"].body, undefined);
});

test("auth-protected endpoints require and receive a bearer token", () => {
  const admin = endpoints.find((endpoint) => endpoint.key === "GET /api/admin/metrics");

  assert.ok(admin);
  assert.equal(admin.auth, true);
  assert.throws(() => requestHeaders(admin, ""), /requires a benchmark token/);
  assert.equal(requestHeaders(admin, "test-token").authorization, "Bearer test-token");
  assert.equal(requestHeaders(endpoints[0], "").authorization, undefined);
});
