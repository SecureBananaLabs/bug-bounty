import autocannon from "autocannon";
import { writeFileSync } from "fs";

const BASE_URL = process.env.BASE_URL || "http://localhost:4000";
const AUTH_TOKEN = process.env.BENCHMARK_AUTH_TOKEN || "";

const endpoints = [
  { method: "GET", path: "/api/health" },
  { method: "POST", path: "/api/auth/login", body: { email: "benchmark@test.com", password: "test123" } },
  { method: "GET", path: "/api/jobs" },
  { method: "GET", path: "/api/users" },
  { method: "POST", path: "/api/payments", body: { amount: 50, currency: "usd" } },
];

async function runBenchmark() {
  const results = [];

  for (const ep of endpoints) {
    console.log(`Benchmarking ${ep.method} ${ep.path}...`);

    const headers = { "Content-Type": "application/json" };
    if (AUTH_TOKEN) headers["Authorization"] = `Bearer ${AUTH_TOKEN}`;

    const result = await new Promise((resolve, reject) => {
      autocannon({
        url: `${BASE_URL}${ep.path}`,
        connections: 10,
        pipelining: 1,
        duration: 10,
        method: ep.method,
        headers,
        ...(ep.body ? { body: JSON.stringify(ep.body) } : {}),
      }, (err, res) => (err ? reject(err) : resolve(res)));
    });

    results.push({
      endpoint: ep.path,
      method: ep.method,
      latency: {
        p50: result.latency.p50,
        p95: result.latency.p95,
        p99: result.latency.p99,
      },
      requestsPerSecond: result.requests.average,
      throughput: result.throughput.average,
      errorRate: result.errors ? result.errors.length / result.requests.total : 0,
      timeouts: result.timeouts || 0,
    });

    console.log(`  p50: ${result.latency.p50}ms, p95: ${result.latency.p95}ms, p99: ${result.latency.p99}ms`);
    console.log(`  RPS: ${result.requests.average}, errors: ${result.errors?.length || 0}`);
  }

  const report = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    results,
  };

  writeFileSync("benchmark-report.json", JSON.stringify(report, null, 2));
  console.log("\nBenchmark report written to benchmark-report.json");
}

runBenchmark().catch(console.error);