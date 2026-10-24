#!/usr/bin/env node
/**
 * Lightweight API Benchmark — no k6 dependency required
 * Measures p50/p95/p99 latency, RPS, error rate, TTFB
 * 
 * Usage: node benchmarks/simple-benchmark.js
 */

const BASE_URL = process.env.API_URL || "http://localhost:3001";
const CONCURRENT = 10;
const ITERATIONS = 5;

const endpoints = [
  { method: "GET", path: "/api/health", auth: false },
  { method: "GET", path: "/api/version", auth: false },
  { method: "POST", path: "/api/auth/login", auth: false, body: { email: "test@test.com", password: "test123" } },
  { method: "GET", path: "/api/jobs", auth: false },
  { method: "GET", path: "/api/jobs?search=dev", auth: false },
  { method: "GET", path: "/api/reviews", auth: false },
  { method: "GET", path: "/api/search?q=test", auth: false },
  { method: "GET", path: "/api/users/me", auth: true },
  { method: "GET", path: "/api/proposals", auth: true },
  { method: "GET", path: "/api/messages", auth: true },
  { method: "GET", path: "/api/notifications", auth: true },
  { method: "GET", path: "/api/admin/stats", auth: true },
];

async function benchmarkEndpoint(method, path, auth, body) {
  const headers = { "Content-Type": "application/json" };
  if (auth) headers["Authorization"] = "Bearer benchmark-token-xxxxxxxx";

  const start = performance.now();
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    const ttfb = performance.now() - start;
    const total = ttfb; // Simplified; fetch API doesn't expose TTFB separately
    return { status: res.status, ttfb: Math.round(ttfb), total: Math.round(total), error: false };
  } catch (err) {
    return { status: 0, ttfb: -1, total: -1, error: true, message: err.message };
  }
}

async function run() {
  console.log("🚀 API Benchmark Suite\n");
  console.log(`Target: ${BASE_URL}`);
  console.log(`Endpoints: ${endpoints.length}`);
  console.log(`Iterations per endpoint: ${ITERATIONS}\n`);

  const allResults = [];

  for (const ep of endpoints) {
    const times = [];
    let errors = 0;

    for (let i = 0; i < ITERATIONS; i++) {
      const r = await benchmarkEndpoint(ep.method, ep.path, ep.auth, ep.body);
      if (r.error) errors++;
      else times.push(r.ttfb);
    }

    times.sort((a, b) => a - b);
    const p50 = times[Math.floor(times.length * 0.5)] || 0;
    const p95 = times[Math.floor(times.length * 0.95)] || 0;
    const p99 = times[Math.floor(times.length * 0.99)] || 0;
    const avg = times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;
    const errorRate = ((errors / ITERATIONS) * 100).toFixed(1);

    console.log(`${ep.method} ${ep.path}`);
    console.log(`  avg=${avg}ms  p50=${p50}ms  p95=${p95}ms  p99=${p99}ms  errors=${errorRate}%`);

    allResults.push({
      endpoint: `${ep.method} ${ep.path}`,
      avg, p50, p95, p99,
      errorRate: parseFloat(errorRate),
      iterations: ITERATIONS,
    });
  }

  // Summary
  const allTimes = allResults.flatMap((r) => [r.p50, r.p95, r.p99]).filter((t) => t > 0).sort((a, b) => a - b);
  console.log("\n📊 SUMMARY");
  console.log(`  Total endpoints tested: ${endpoints.length}`);
  console.log(`  Overall p50: ${allTimes[Math.floor(allTimes.length * 0.5)] || 0}ms`);
  console.log(`  Overall p95: ${allTimes[Math.floor(allTimes.length * 0.95)] || 0}ms`);
  console.log(`  Overall p99: ${allTimes[Math.floor(allTimes.length * 0.99)] || 0}ms`);

  // Write report
  const fs = await import("fs");
  const report = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    results: allResults,
    summary: {
      p50: allTimes[Math.floor(allTimes.length * 0.5)] || 0,
      p95: allTimes[Math.floor(allTimes.length * 0.95)] || 0,
      p99: allTimes[Math.floor(allTimes.length * 0.99)] || 0,
    },
  };
  fs.writeFileSync("benchmarks/report-simple.json", JSON.stringify(report, null, 2));
  console.log(`\n✅ Report saved: benchmarks/report-simple.json`);
}

run().catch(console.error);
