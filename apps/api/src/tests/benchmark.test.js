import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { benchmarkRoutes } from "../../../../benchmarks/routes.mjs";

test("benchmark manifest covers every mounted /api route group", () => {
  const routeGroups = new Set(benchmarkRoutes.map((route) => route.path.split("?")[0]));

  for (const expectedPath of [
    "/api/auth/register",
    "/api/auth/login",
    "/api/auth/refresh",
    "/api/auth/oauth/github/callback",
    "/api/users",
    "/api/jobs",
    "/api/proposals",
    "/api/payments",
    "/api/reviews",
    "/api/messages",
    "/api/notifications",
    "/api/uploads",
    "/api/search",
    "/api/admin/metrics"
  ]) {
    assert.equal(routeGroups.has(expectedPath), true, `${expectedPath} is missing`);
  }
});

test("benchmark route names are unique and target /api", () => {
  const names = new Set();

  for (const route of benchmarkRoutes) {
    assert.match(route.path, /^\/api\//);
    assert.match(route.method, /^(GET|POST|PUT|PATCH|DELETE)$/);
    assert.equal(names.has(route.name), false, `${route.name} is duplicated`);
    names.add(route.name);
  }
});

test("admin benchmark route uses auth token", () => {
  const adminRoute = benchmarkRoutes.find((route) => route.path === "/api/admin/metrics");

  assert.equal(adminRoute?.auth, true);
});

test("benchmark thresholds are reviewable and positive", () => {
  const thresholdsPath = new URL("../../../../benchmarks/thresholds.json", import.meta.url);
  const thresholds = JSON.parse(fs.readFileSync(thresholdsPath, "utf8"));

  for (const threshold of [thresholds.default, thresholds.smoke]) {
    assert.equal(typeof threshold.p99Ms, "number");
    assert.equal(typeof threshold.errorRatePct, "number");
    assert.ok(threshold.p99Ms > 0);
    assert.ok(threshold.errorRatePct >= 0);
  }
});
