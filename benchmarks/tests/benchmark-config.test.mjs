import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { benchmarkEndpointIds, benchmarkEndpoints } from "../endpoints.mjs";

const thresholds = JSON.parse(
  fs.readFileSync(new URL("../thresholds.json", import.meta.url), "utf8")
);

test("benchmark suite covers every mounted API route plus health", () => {
  const appSource = fs.readFileSync(new URL("../../apps/api/src/app.js", import.meta.url), "utf8");
  const mountedPaths = [...appSource.matchAll(/app\.(?:get|use)\("([^"]+)"/g)].map((match) => match[1]);
  const benchmarkedRoots = new Set(benchmarkEndpoints.map((endpoint) => endpoint.path.split("?")[0]));

  for (const mountedPath of mountedPaths) {
    assert(
      [...benchmarkedRoots].some((benchmarkedPath) => benchmarkedPath === mountedPath || benchmarkedPath.startsWith(`${mountedPath}/`)),
      `Expected benchmark coverage for mounted route ${mountedPath}`
    );
  }
});

test("endpoint IDs and thresholds stay valid", () => {
  assert.equal(new Set(benchmarkEndpointIds).size, benchmarkEndpointIds.length);

  for (const endpoint of benchmarkEndpoints) {
    assert.match(endpoint.id, /^[a-z0-9-]+$/);
    assert.match(endpoint.path, /^\//);
    assert.ok(["GET", "POST", "PUT", "PATCH", "DELETE"].includes(endpoint.method));
  }

  for (const endpointId of Object.keys(thresholds.endpoints)) {
    assert.ok(benchmarkEndpointIds.includes(endpointId), `Unknown threshold endpoint ${endpointId}`);
  }
});
