import test from "node:test";
import assert from "node:assert/strict";

import { endpoints, endpointKey } from "../endpoints.mjs";

const expectedApiRoutes = [
  "POST /api/auth/register",
  "POST /api/auth/login",
  "GET /api/auth/oauth/github/callback",
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

test("benchmark endpoint catalog covers every mounted /api route", () => {
  const actual = endpoints.map(endpointKey).sort();
  assert.deepEqual(actual, expectedApiRoutes.sort());
});

test("write endpoints define realistic request payloads", () => {
  for (const endpoint of endpoints.filter((item) => item.method !== "GET")) {
    assert.ok(endpoint.body || endpoint.multipart || endpoint.path.includes("/auth/refresh"), `${endpointKey(endpoint)} needs a payload fixture`);
  }
});

test("protected endpoints are marked for benchmark token usage", () => {
  const protectedEndpoints = endpoints.filter((endpoint) => endpoint.auth).map(endpointKey);
  assert.deepEqual(protectedEndpoints, ["GET /api/admin/metrics"]);
});
