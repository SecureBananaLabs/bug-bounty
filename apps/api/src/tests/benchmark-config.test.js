import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { benchmarkRoutes } from "../../../../benchmarks/routes.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");

test("benchmark route inventory covers every current /api route", () => {
  const expectedRoutes = [
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

  assert.deepEqual(
    benchmarkRoutes.map((route) => route.name),
    expectedRoutes
  );
});

test("benchmark thresholds define reviewable smoke gate limits", () => {
  const thresholds = JSON.parse(
    fs.readFileSync(path.join(repoRoot, "benchmarks/thresholds.json"), "utf8")
  );

  assert.equal(typeof thresholds.defaults.maxP99Ms, "number");
  assert.equal(typeof thresholds.defaults.maxErrorRate, "number");
  assert.equal(typeof thresholds.defaults.maxNon2xxRate, "number");
});
