/**
 * API Benchmark Suite using autocannon
 * Tests all /api/ endpoints with realistic payloads
 * Measures p50, p95, p99 latency, RPS, error rate
 * Outputs reproducible JSON reports
 */

import autocannon from "autocannon";
import { createApp } from "../app.js";

// Endpoints to benchmark
const ENDPOINTS = [
  {
    name: "GET /health",
    method: "GET",
    path: "/health",
    body: null,
  },
  {
    name: "POST /api/auth/register",
    method: "POST",
    path: "/api/auth/register",
    body: {
      email: `benchmark_${Date.now()}@test.com`,
      password: "TestPassword123!",
      name: "Benchmark User",
    },
  },
  {
    name: "POST /api/auth/login",
    method: "POST",
    path: "/api/auth/login",
    body: {
      email: "benchmark@test.com",
      password: "TestPassword123!",
    },
  },
  {
    name: "GET /api/jobs",
    method: "GET",
    path: "/api/jobs",
    body: null,
  },
  {
    name: "POST /api/jobs",
    method: "POST",
    path: "/api/jobs",
    body: {
      title: "Benchmark Job",
      description: "Test job for benchmarking",
      budget: 1000,
      skills: ["javascript", "nodejs"],
    },
  },
  {
    name: "GET /api/users",
    method: "GET",
    path: "/api/users",
    body: null,
  },
  {
    name: "POST /api/users",
    method: "POST",
    path: "/api/users",
    body: {
      email: `user_${Date.now()}@test.com`,
      name: "Test User",
      role: "freelancer",
    },
  },
  {
    name: "GET /api/proposals",
    method: "GET",
    path: "/api/proposals",
    body: null,
  },
  {
    name: "POST /api/proposals",
    method: "POST",
    path: "/api/proposals",
    body: {
      jobId: "1",
      freelancerId: "1",
      bid: 500,
      message: "I can do this job",
    },
  },
  {
    name: "GET /api/reviews",
    method: "GET",
    path: "/api/reviews",
    body: null,
  },
  {
    name: "POST /api/reviews",
    method: "POST",
    path: "/api/reviews",
    body: {
      targetId: "1",
      rating: 5,
      comment: "Great work!",
    },
  },
  {
    name: "GET /api/messages",
    method: "GET",
    path: "/api/messages",
    body: null,
  },
  {
    name: "POST /api/messages",
    method: "POST",
    path: "/api/messages",
    body: {
      recipientId: "1",
      content: "Hello from benchmark",
    },
  },
  {
    name: "GET /api/notifications",
    method: "GET",
    path: "/api/notifications",
    body: null,
  },
  {
    name: "POST /api/notifications",
    method: "POST",
    path: "/api/notifications",
    body: {
      userId: "1",
      type: "info",
      message: "Benchmark notification",
    },
  },
  {
    name: "GET /api/search",
    method: "GET",
    path: "/api/search?q=javascript",
    body: null,
  },
];

// Start server on random port
function startServer() {
  const app = createApp();
  return new Promise((resolve, reject) => {
    const server = app.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      resolve({ server, port });
    });
    server.on("error", reject);
  });
}

// Run benchmark for a single endpoint
async function benchmarkEndpoint(url, endpoint, duration = 10) {
  const result = await autocannon({
    url,
    method: endpoint.method,
    body: endpoint.body ? JSON.stringify(endpoint.body) : undefined,
    headers: endpoint.body
      ? { "Content-Type": "application/json" }
      : undefined,
    duration,
    connections: 10,
    pipelining: 1,
    threshold: 0,
  });
  return result;
}

// Format results for a single endpoint
function formatResult(endpoint, result) {
  const { latencies, errors, requests } = result;

  return {
    endpoint: endpoint.name,
    method: endpoint.method,
    path: endpoint.path,
    rps: requests.total / result.duration,
    latency: {
      p50: Math.round(latencies.p50 / 1000),
      p95: Math.round(latencies.p95 / 1000),
      p99: Math.round(latencies.p99 / 1000),
      min: Math.round(latencies.min / 1000),
      max: Math.round(latencies.max / 1000),
    },
    throughput: {
      bytes: requests.bytes,
      total: requests.total,
    },
    errors: errors,
    errorRate: requests.total > 0 ? errors / requests.total : 0,
  };
}

// Main benchmark runner
async function runBenchmarks() {
  console.error("🚀 Starting API Benchmark Suite...\n");

  const { server, port } = await startServer();
  console.error(`✅ Server started on port ${port}\n`);

  const results = [];
  const baseUrl = `http://127.0.0.1:${port}`;

  for (const endpoint of ENDPOINTS) {
    const url = `${baseUrl}${endpoint.path}`;
    console.error(`🔥 Benchmarking: ${endpoint.name}...`);

    try {
      const result = await benchmarkEndpoint(url, endpoint);
      const formatted = formatResult(endpoint, result);
      results.push(formatted);

      const rps = formatted.rps.toFixed(2);
      const p50 = formatted.latency.p50;
      const p99 = formatted.latency.p99;
      const errors = formatted.errors;
      console.error(
        `   → RPS: ${rps} | p50: ${p50}ms | p99: ${p99}ms | errors: ${errors}\n`
      );
    } catch (err) {
      console.error(`   ❌ Error: ${err.message}\n`);
      results.push({
        endpoint: endpoint.name,
        method: endpoint.method,
        path: endpoint.path,
        error: err.message,
      });
    }
  }

  server.close();

  // Aggregate stats
  const totalRps = results
    .filter((r) => r.rps !== undefined)
    .reduce((sum, r) => sum + r.rps, 0);

  const totalErrors = results.reduce(
    (sum, r) => sum + (r.errors || 0),
    0
  );

  const summary = {
    timestamp: new Date().toISOString(),
    duration: "10s per endpoint",
    connections: 10,
    totalRps,
    totalErrors,
    endpointCount: ENDPOINTS.length,
    results,
  };

  // Output JSON to stdout
  console.log(JSON.stringify(summary, null, 2));

  console.error("\n✅ Benchmark complete!");
  process.exit(0);
}

runBenchmarks().catch((err) => {
  console.error("❌ Benchmark failed:", err);
  process.exit(1);
});