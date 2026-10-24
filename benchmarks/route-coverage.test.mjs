import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { benchmarkEndpoints, endpointRouteKey } from "./endpoints.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");

function normalizeRoutePath(basePath, routePath) {
  if (routePath === "/") {
    return `${basePath}/`;
  }

  return `${basePath}${routePath}`;
}

async function mountedApiRouters() {
  const appSource = await readFile(path.join(repoRoot, "apps/api/src/app.js"), "utf8");
  const mounts = new Map();
  const mountPattern = /app\.use\("([^"]+)",\s*([a-zA-Z0-9_]+)\)/g;

  for (const match of appSource.matchAll(mountPattern)) {
    const [, basePath, routerName] = match;
    if (basePath.startsWith("/api/")) {
      mounts.set(routerName, basePath);
    }
  }

  return mounts;
}

async function apiRouteKeys() {
  const keys = ["GET /health"];
  const mounts = await mountedApiRouters();

  for (const [routerName, basePath] of mounts) {
    const routeSource = await readFile(
      path.join(repoRoot, `apps/api/src/routes/${routerName.replace(/Routes$/, "Routes")}.js`),
      "utf8"
    ).catch(async () => {
      const routeFile = routerName.replace(/Routes$/, "Routes");
      return readFile(path.join(repoRoot, `apps/api/src/routes/${routeFile}.js`), "utf8");
    });
    const routePattern = new RegExp(`${routerName}\\.(get|post|put|patch|delete)\\("([^"]+)"`, "g");

    for (const match of routeSource.matchAll(routePattern)) {
      const [, method, routePath] = match;
      keys.push(`${method.toUpperCase()} ${normalizeRoutePath(basePath, routePath)}`);
    }
  }

  return keys.sort();
}

test("benchmark endpoint inventory covers every mounted API route", async () => {
  const expected = await apiRouteKeys();
  const actual = benchmarkEndpoints.map(endpointRouteKey).sort();

  assert.deepEqual(actual, expected);
});

test("benchmark endpoint ids are unique", () => {
  const ids = benchmarkEndpoints.map((endpoint) => endpoint.id);
  assert.equal(new Set(ids).size, ids.length);
});
