import test from "node:test";
import assert from "node:assert/strict";
import { benchmarkScenarios, requiredEndpointKeys } from "../../../../benchmarks/scenarios.mjs";

test("benchmark manifest covers every public API endpoint", () => {
  const scenarioKeys = benchmarkScenarios.map((scenario) => `${scenario.method} ${scenario.path}`);

  assert.deepEqual(scenarioKeys, requiredEndpointKeys);
});

test("benchmark manifest includes realistic payload and auth metadata", () => {
  const register = benchmarkScenarios.find(
    (scenario) => scenario.method === "POST" && scenario.path === "/api/auth/register"
  );
  const adminMetrics = benchmarkScenarios.find(
    (scenario) => scenario.method === "GET" && scenario.path === "/api/admin/metrics"
  );
  const upload = benchmarkScenarios.find(
    (scenario) => scenario.method === "POST" && scenario.path === "/api/uploads"
  );

  assert.equal(register.body.role, "client");
  assert.equal(register.expectedStatus, 201);
  assert.equal(adminMetrics.auth, true);
  assert.equal(upload.multipart, true);
  assert.equal(upload.expectedStatus, 201);
});

test("benchmark write scenarios declare their successful status code", () => {
  const createdResourcePaths = new Set([
    "/api/auth/register",
    "/api/users",
    "/api/jobs",
    "/api/proposals",
    "/api/payments",
    "/api/reviews",
    "/api/messages",
    "/api/notifications",
    "/api/uploads"
  ]);

  for (const scenario of benchmarkScenarios) {
    if (scenario.method === "POST" && createdResourcePaths.has(scenario.path)) {
      assert.equal(scenario.expectedStatus, 201, `${scenario.method} ${scenario.path}`);
    }
  }
});
