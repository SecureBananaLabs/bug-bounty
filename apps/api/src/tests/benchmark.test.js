import test from "node:test";
import { createApp } from "../app.js";

/**
 * Benchmark: p50, p95, p99 latency, RPS, error rate per endpoint.
 *
 * Usage: node --test src/tests/benchmark.test.js
 */
const ITERATIONS = 500;
const CONCURRENCY = 10;

function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

async function measureLatency(fn) {
  const start = performance.now();
  try {
    await fn();
    return performance.now() - start;
  } catch {
    return -1; // negative = error
  }
}

async function benchmarkEndpoint(name, runner, iterations = ITERATIONS) {
  const results = [];
  const errors = [];

  // Warmup
  for (let i = 0; i < 5; i++) {
    await runner();
  }

  // Benchmark in concurrent batches
  for (let i = 0; i < iterations; i += CONCURRENCY) {
    const batch = [];
    for (let j = 0; j < CONCURRENCY && i + j < iterations; j++) {
      batch.push(measureLatency(runner));
    }
    const latencies = await Promise.all(batch);
    for (const lat of latencies) {
      if (lat < 0) {
        errors.push(lat);
      } else {
        results.push(lat);
      }
    }
  }

  const sorted = [...results].sort((a, b) => a - b);
  const total = results.length + errors.length;
  const errorRate = total > 0 ? (errors.length / total) * 100 : 0;
  const rps = results.length / (sorted.reduce((a, b) => a + b, 0) / 1000);

  return {
    endpoint: name,
    iterations: results.length,
    errors: errors.length,
    errorRate: `${errorRate.toFixed(2)}%`,
    p50: `${percentile(sorted, 50).toFixed(2)}ms`,
    p95: `${percentile(sorted, 95).toFixed(2)}ms`,
    p99: `${percentile(sorted, 99).toFixed(2)}ms`,
    min: `${sorted[0]?.toFixed(2) ?? "N/A"}ms`,
    max: `${sorted[sorted.length - 1]?.toFixed(2) ?? "N/A"}ms`,
    avg: `${(sorted.reduce((a, b) => a + b, 0) / sorted.length).toFixed(2)}ms`,
    rps: `${rps.toFixed(1)} req/s`,
  };
}

async function runAllBenchmarks(port) {
  const base = `http://127.0.0.1:${port}`;

  const endpoints = [
    {
      name: "GET /health",
      run: () => fetch(`${base}/health`).then((r) => r.json()),
    },
    {
      name: "POST /api/auth/login",
      run: () =>
        fetch(`${base}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "bench@test.com", password: "test123" }),
        }).then((r) => r.json()),
    },
    {
      name: "POST /api/auth/register",
      run: () =>
        fetch(`${base}/api/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: `bench${Date.now()}@test.com`,
            password: "test123",
            name: "Bench User",
          }),
        }).then((r) => r.json()),
    },
    {
      name: "GET /api/jobs",
      run: () => fetch(`${base}/api/jobs`).then((r) => r.json()),
    },
    {
      name: "POST /api/jobs",
      run: () =>
        fetch(`${base}/api/jobs`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "Bench Job",
            description: "Benchmark test job",
            budget: 100,
          }),
        }).then((r) => r.json()),
    },
    {
      name: "GET /api/users",
      run: () => fetch(`${base}/api/users`).then((r) => r.json()),
    },
    {
      name: "GET /api/reviews",
      run: () => fetch(`${base}/api/reviews`).then((r) => r.json()),
    },
    {
      name: "GET /api/proposals",
      run: () => fetch(`${base}/api/proposals`).then((r) => r.json()),
    },
    {
      name: "GET /api/search?q=test",
      run: () => fetch(`${base}/api/search?q=test`).then((r) => r.json()),
    },
  ];

  console.log("\n========================================");
  console.log("  API Benchmark Report");
  console.log("========================================\n");
  console.log(`Iterations per endpoint: ${ITERATIONS}`);
  console.log(`Concurrency:            ${CONCURRENCY}\n`);

  const results = [];
  for (const ep of endpoints) {
    const result = await benchmarkEndpoint(ep.name, ep.run);
    results.push(result);
    console.log(`${result.endpoint}`);
    console.log(`  P50: ${result.p50}  P95: ${result.p95}  P99: ${result.p99}`);
    console.log(`  RPS: ${result.rps}  Errors: ${result.errorRate}`);
    console.log(`  Min: ${result.min}  Max: ${result.max}  Avg: ${result.avg}\n`);
  }

  console.log("========================================");
  console.log("  Summary");
  console.log("========================================\n");

  const table = results.map((r) => ({
    Endpoint: r.endpoint,
    P50: r.p50,
    P95: r.p95,
    P99: r.p99,
    RPS: r.rps,
    Errors: r.errorRate,
  }));
  console.table(table);

  return results;
}

test("API benchmark suite", { timeout: 120_000 }, async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  try {
    await runAllBenchmarks(port);
  } finally {
    // Graceful shutdown
    server.closeAllConnections?.();
    await new Promise((resolve) => server.close(resolve));
  }
});
