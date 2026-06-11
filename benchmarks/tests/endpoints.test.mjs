import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { BENCHMARK_ENDPOINTS } from "../endpoints.mjs";

describe("benchmark endpoint registry", () => {
  it("covers health plus every mounted api route", () => {
    const routeKeys = BENCHMARK_ENDPOINTS.map((endpoint) => `${endpoint.method} ${endpoint.path}`);

    assert.deepEqual(routeKeys, [
      "GET /health",
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
      "GET /api/search?q=frontend%20engineer",
      "GET /api/admin/metrics"
    ]);
  });

  it("marks protected and multipart routes with runnable request metadata", () => {
    const adminMetrics = BENCHMARK_ENDPOINTS.find((endpoint) => endpoint.id === "admin.metrics");
    const uploadFile = BENCHMARK_ENDPOINTS.find((endpoint) => endpoint.id === "uploads.create");

    assert.equal(adminMetrics.auth, "admin");
    assert.match(uploadFile.headers["Content-Type"], /^multipart\/form-data; boundary=/);
    assert.match(String(uploadFile.body), /name="file"; filename="portfolio.txt"/);
  });
});
