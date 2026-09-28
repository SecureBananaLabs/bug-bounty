import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { endpointRegistry } from "../api/endpoints.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

function normalizeRoute(route) {
  if (route === "/") return "";
  return route.replace(/\/$/, "");
}

function routeKey(method, pathValue) {
  const normalized = pathValue === "/health" ? pathValue : pathValue.replace(/\/$/, "");
  return `${method.toUpperCase()} ${normalized}`;
}

function extractRoutes(routeFile, mountPath, routerName) {
  const content = fs.readFileSync(routeFile, "utf8");
  const regex = new RegExp(`${routerName}\\.(get|post|put|patch|delete)\\("([^"]+)"`, "g");
  const routes = [];
  let match;

  while ((match = regex.exec(content)) !== null) {
    const method = match[1].toUpperCase();
    const routePath = normalizeRoute(match[2]);
    routes.push(routeKey(method, `${mountPath}${routePath}`));
  }

  return routes;
}

test("endpoint registry covers every mounted API route plus health", () => {
  const routeSpecs = [
    ["apps/api/src/routes/authRoutes.js", "/api/auth", "authRoutes"],
    ["apps/api/src/routes/userRoutes.js", "/api/users", "userRoutes"],
    ["apps/api/src/routes/jobRoutes.js", "/api/jobs", "jobRoutes"],
    ["apps/api/src/routes/proposalRoutes.js", "/api/proposals", "proposalRoutes"],
    ["apps/api/src/routes/paymentRoutes.js", "/api/payments", "paymentRoutes"],
    ["apps/api/src/routes/reviewRoutes.js", "/api/reviews", "reviewRoutes"],
    ["apps/api/src/routes/messageRoutes.js", "/api/messages", "messageRoutes"],
    ["apps/api/src/routes/notificationRoutes.js", "/api/notifications", "notificationRoutes"],
    ["apps/api/src/routes/uploadRoutes.js", "/api/uploads", "uploadRoutes"],
    ["apps/api/src/routes/searchRoutes.js", "/api/search", "searchRoutes"],
    ["apps/api/src/routes/adminRoutes.js", "/api/admin", "adminRoutes"]
  ];

  const sourceRoutes = new Set(["GET /health"]);
  for (const [relativeFile, mountPath, routerName] of routeSpecs) {
    const routes = extractRoutes(path.join(repoRoot, relativeFile), mountPath, routerName);
    for (const route of routes) {
      sourceRoutes.add(route);
    }
  }

  const benchmarkRoutes = new Set(
    endpointRegistry.map((endpoint) => routeKey(endpoint.method, endpoint.routePattern ?? endpoint.path))
  );

  assert.deepEqual(
    [...benchmarkRoutes].sort(),
    [...sourceRoutes].sort(),
    "Benchmark registry must stay in sync with Express API route files"
  );
});

test("endpoint registry IDs are unique and requests are executable", () => {
  const ids = endpointRegistry.map((endpoint) => endpoint.id);
  assert.equal(ids.length, new Set(ids).size, "Endpoint IDs must be unique");

  const context = {
    runId: "test",
    adminToken: "token"
  };

  for (const endpoint of endpointRegistry) {
    const request = endpoint.request(context);
    assert.equal(typeof endpoint.id, "string");
    assert.equal(typeof endpoint.method, "string");
    assert.equal(typeof endpoint.path, "string");
    assert.ok(request && typeof request === "object");
  }
});
