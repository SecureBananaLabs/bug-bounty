import assert from "node:assert/strict";
import test from "node:test";
import { loadBenchmarkConfig } from "./config.mjs";
import { renderMarkdownReport } from "./report.mjs";
import { API_ROUTE_MANIFEST, materializeRequest } from "./routes.mjs";
import { evaluateThresholds } from "./thresholds.mjs";

test("route manifest covers the current API surface", () => {
  const expectedIds = [
    "health",
    "auth.register",
    "auth.login",
    "auth.oauthCallback",
    "auth.refresh",
    "users.list",
    "users.create",
    "jobs.list",
    "jobs.create",
    "proposals.list",
    "proposals.create",
    "payments.create",
    "reviews.list",
    "reviews.create",
    "messages.list",
    "messages.create",
    "notifications.list",
    "notifications.create",
    "uploads.create",
    "search.query",
    "admin.metrics"
  ];

  assert.deepEqual(
    API_ROUTE_MANIFEST.map((route) => route.id).sort(),
    expectedIds.sort()
  );

  const uniqueIds = new Set(API_ROUTE_MANIFEST.map((route) => route.id));
  assert.equal(uniqueIds.size, API_ROUTE_MANIFEST.length);
  assert.ok(API_ROUTE_MANIFEST.every((route) => route.path === "/health" || route.path.startsWith("/api/")));
});

test("materializeRequest creates realistic request options", () => {
  const adminRoute = API_ROUTE_MANIFEST.find((route) => route.id === "admin.metrics");
  const adminRequest = materializeRequest(adminRoute, { authToken: "benchmark-token", sequence: 7 });

  assert.equal(adminRequest.headers.authorization, "Bearer benchmark-token");
  assert.equal(adminRequest.method, "GET");

  const jobRoute = API_ROUTE_MANIFEST.find((route) => route.id === "jobs.create");
  const jobRequest = materializeRequest(jobRoute, { authToken: "benchmark-token", sequence: 11 });

  assert.equal(jobRequest.headers["content-type"], "application/json");
  assert.match(jobRequest.body, /Benchmark marketplace API tuning 11/);

  const uploadRoute = API_ROUTE_MANIFEST.find((route) => route.id === "uploads.create");
  const uploadRequest = materializeRequest(uploadRoute, { authToken: "benchmark-token", sequence: 3 });

  assert.match(uploadRequest.headers["content-type"], /^multipart\/form-data; boundary=/);
  assert.match(uploadRequest.body, /benchmark-upload-3.txt/);
});

test("threshold evaluation reports reviewable failures", () => {
  const failures = evaluateThresholds(
    [
      {
        id: "jobs.list",
        metrics: {
          latency: { p99: 901 },
          rps: { sustained: 8 },
          errorRate: 0.25
        }
      }
    ],
    {
      defaults: {
        maxP99Ms: 900,
        maxErrorRatePct: 1,
        minSustainedRps: 5
      },
      routes: {}
    }
  );

  assert.equal(failures.length, 1);
  assert.match(failures[0].message, /p99/);
});

test("config and markdown report expose benchmark context", () => {
  const config = loadBenchmarkConfig(["--smoke"], {
    BENCHMARK_BASE_URL: "http://127.0.0.1:4999",
    BENCHMARK_CONNECTIONS: "2"
  });

  assert.equal(config.smoke, true);
  assert.equal(config.baseUrl, "http://127.0.0.1:4999");
  assert.equal(config.connections, 2);

  const markdown = renderMarkdownReport({
    mode: "smoke",
    target: "local",
    generatedAt: "2026-05-17T00:00:00.000Z",
    config: { connections: 1, requests: 5 },
    environment: { node: "v24.15.0", platform: "win32", cpu: "test cpu", logicalCores: 8, totalMemoryMb: 1024 },
    results: [
      {
        id: "jobs.list",
        method: "GET",
        path: "/api/jobs",
        expectedStatus: [200],
        metrics: {
          latency: { p50: 10, p95: 20, p99: 30 },
          rps: { sustained: 50, peak: 60 },
          errorRate: 0,
          ttfb: { p50: 9, p95: 19, p99: 29 }
        }
      }
    ],
    thresholdFailures: []
  });

  assert.match(markdown, /p50/);
  assert.match(markdown, /p95/);
  assert.match(markdown, /p99/);
  assert.match(markdown, /TTFB/);
});
