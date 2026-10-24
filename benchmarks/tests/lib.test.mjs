import test from "node:test";
import assert from "node:assert/strict";
import {
  discoverRoutes,
  endpointConfiguration,
  evaluateThresholds,
  percentile,
  validateTarget
} from "../lib.mjs";

test("discovers all mounted Express API routes and de-duplicates them", () => {
  const endpoints = discoverRoutes(
    `
      app.use("/api/auth", authRoutes);
      app.use("/api/jobs", jobRoutes);
    `,
    {
      authRoutes: `router.post("/login", login); router.post("/register", register);`,
      jobRoutes: `router.get("/", list); router.get("/:id", get); router.post("/", create);`
    }
  );

  assert.deepEqual(endpoints, [
    { method: "POST", path: "/api/auth/login" },
    { method: "POST", path: "/api/auth/register" },
    { method: "GET", path: "/api/jobs/" },
    { method: "GET", path: "/api/jobs/:id" },
    { method: "POST", path: "/api/jobs/" }
  ]);
});

test("rejects remote benchmark targets without explicit authorization", () => {
  assert.throws(
    () => validateTarget("https://production.example.com", false),
    /Refusing a non-local benchmark target/
  );
  assert.equal(validateTarget("https://staging.example.com", true), "https://staging.example.com");
  assert.equal(validateTarget("http://localhost:3001/", false), "http://localhost:3001");
});

test("adds benchmark JWT only to protected endpoints", () => {
  const manifest = {
    defaults: { requiresAuth: true },
    overrides: [{ match: "^POST /api/auth/login$", requiresAuth: false }]
  };

  const login = endpointConfiguration(
    { method: "POST", path: "/api/auth/login" },
    manifest,
    "test-token"
  );
  assert.equal(login.headers.authorization, undefined);

  const job = endpointConfiguration(
    { method: "GET", path: "/api/jobs/" },
    manifest,
    "test-token"
  );
  assert.equal(job.headers.authorization, "Bearer test-token");
});

test("skips protected endpoints instead of creating false unauthenticated results", () => {
  const endpoint = endpointConfiguration(
    { method: "GET", path: "/api/jobs/" },
    { defaults: { requiresAuth: true } },
    ""
  );

  assert.match(endpoint.skipped, /BENCHMARK_TOKEN/);
});

test("computes percentile boundaries deterministically", () => {
  assert.equal(percentile([5, 1, 3, 2, 4], 0.5), 3);
  assert.equal(percentile([5, 1, 3, 2, 4], 0.95), 5);
  assert.equal(percentile([], 0.99), null);
});

test("fails the regression gate for p99 or error-rate violations", () => {
  const failures = evaluateThresholds(
    [{
      endpoint: "GET /api/jobs/",
      latencyMs: { p99: 1600 },
      errorRatePercent: 1.5
    }],
    {
      default: { p99Ms: 1500, maxErrorRatePercent: 1 },
      smoke: { p99Ms: 2500, maxErrorRatePercent: 2 },
      overrides: {}
    },
    false
  );

  assert.equal(failures.length, 2);
  assert.match(failures[0], /p99/);
  assert.match(failures[1], /error rate/);
});
