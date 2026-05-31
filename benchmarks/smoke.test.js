import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { createApp } from "../apps/api/src/app.js";
import { createBenchmarkScenarios, discoverExpressRoutes } from "./routes.js";

test("benchmark manifest covers every mounted API route plus health", () => {
  const app = createApp();
  const discovered = discoverExpressRoutes(app);
  const scenarios = createBenchmarkScenarios(discovered);
  const scenarioNames = new Set(scenarios.map((scenario) => `${scenario.method} ${scenario.path}`));

  for (const route of discovered) {
    const concretePath = route.path.replace(":provider", "github");
    assert.equal(
      scenarioNames.has(`${route.method} ${concretePath}`),
      true,
      `missing benchmark scenario for ${route.method} ${route.path}`
    );
  }

  assert.equal(scenarioNames.has("GET /health"), true);
  assert.equal(scenarioNames.has("GET /api/admin/metrics"), true);
});

test("benchmark thresholds are reviewable per endpoint", async () => {
  const thresholds = JSON.parse(await fs.readFile("benchmarks/thresholds.json", "utf8"));

  assert.equal(typeof thresholds.default.p99Ms, "number");
  assert.equal(typeof thresholds.default.errorRate, "number");
  assert.equal(typeof thresholds.default.minRequestsPerSecond, "number");
  assert.equal(typeof thresholds["GET /health"].p99Ms, "number");
});
