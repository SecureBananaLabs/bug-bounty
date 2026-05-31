import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const mountedRoutes = [
  "/api/auth/register",
  "/api/auth/login",
  "/api/auth/oauth/github/callback",
  "/api/auth/refresh",
  "/api/users",
  "/api/jobs",
  "/api/proposals",
  "/api/payments",
  "/api/reviews",
  "/api/messages",
  "/api/notifications",
  "/api/uploads",
  "/api/search?q=benchmark",
  "/api/admin/metrics"
];

test("benchmark endpoint config covers mounted API routes", async () => {
  const endpoints = JSON.parse(
    await readFile(new URL("../../../../benchmarks/endpoints.json", import.meta.url), "utf8")
  );
  const configuredPaths = new Set(endpoints.map((endpoint) => endpoint.path));

  for (const route of mountedRoutes) {
    assert.ok(configuredPaths.has(route), `${route} is missing from benchmark config`);
  }
});

test("benchmark thresholds define defaults", async () => {
  const thresholds = JSON.parse(
    await readFile(new URL("../../../../benchmarks/thresholds.json", import.meta.url), "utf8")
  );

  assert.equal(typeof thresholds.defaults.p99Ms, "number");
  assert.equal(typeof thresholds.defaults.errorRatePercent, "number");
});
