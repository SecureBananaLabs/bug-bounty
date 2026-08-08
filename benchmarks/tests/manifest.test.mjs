import test from "node:test";
import assert from "node:assert/strict";

import { buildRouteManifest, loadThresholds } from "../lib/manifest.mjs";

test("buildRouteManifest covers health and every mounted api route", () => {
  const manifest = buildRouteManifest();
  const paths = manifest.endpoints.map((endpoint) => `${endpoint.method} ${endpoint.path}`);

  assert.equal(manifest.name, "freelance-platform-api");
  assert.equal(manifest.targetEnv, "local-or-staging");
  assert.ok(paths.includes("GET /health"));
  assert.ok(paths.includes("POST /api/auth/register"));
  assert.ok(paths.includes("GET /api/jobs"));
  assert.ok(paths.includes("POST /api/jobs"));
  assert.ok(paths.includes("POST /api/proposals"));
  assert.ok(paths.includes("GET /api/admin/metrics"));
  assert.equal(new Set(paths).size, paths.length);
  assert.ok(manifest.endpoints.every((endpoint) => endpoint.expectedStatuses.length > 0));
});

test("loadThresholds provides reviewable per-endpoint smoke limits", () => {
  const thresholds = loadThresholds();

  assert.equal(thresholds.defaults.maxP99Ms, 750);
  assert.equal(thresholds.defaults.maxErrorRate, 0);
  assert.ok(thresholds.endpoints["GET /health"].maxP99Ms < thresholds.defaults.maxP99Ms);
  assert.ok(thresholds.endpoints["GET /api/admin/metrics"].requiresAuth);
});
