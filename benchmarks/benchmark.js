#!/usr/bin/env node
/**
 * API Benchmark Suite
 * Measures p50, p95, p99 latency, RPS, error rate, and TTFB
 * Usage: npm run benchmark
 */
const autocannon = require("autocannon");
const fs = require("fs");
const path = require("path");

const BASE_URL = process.env.BENCHMARK_URL || "http://localhost:3000";
const BENCHMARK_TOKEN = process.env.BENCHMARK_TOKEN || "test-token";
const DURATION = parseInt(process.env.BENCHMARK_DURATION || "10");
const CONNECTIONS = parseInt(process.env.BENCHMARK_CONNECTIONS || "10");

const endpoints = [
  { method: "GET",  url: "/api/jobs",            auth: false },
  { method: "GET",  url: "/api/jobs/search",      auth: false },
  { method: "GET",  url: "/api/users/profile",    auth: true  },
  { method: "GET",  url: "/api/notifications",    auth: true  },
  { method: "GET",  url: "/api/messages",         auth: true  },
  { method: "GET",  url: "/api/proposals",        auth: true  },
  { method: "GET",  url: "/api/reviews",          auth: false },
  { method: "POST", url: "/api/auth/login",       auth: false,
    body: JSON.stringify({ email: "bench@test.com", password: "benchpass" }),
    contentType: "application/json" },
];

async function runBenchmark(endpoint) {
  return new Promise((resolve) => {
    const headers = { "Content-Type": "application/json" };
    if (endpoint.auth) headers["Authorization"] = `Bearer ${BENCHMARK_TOKEN}`;

    const config = {
      url: `${BASE_URL}${endpoint.url}`,
      method: endpoint.method,
      headers,
      duration: DURATION,
      connections: CONNECTIONS,
      pipelining: 1,
    };
    if (endpoint.body) config.body = endpoint.body;

    autocannon(config, (err, result) => {
      if (err) { resolve({ endpoint: endpoint.url, error: err.message }); return; }
      resolve({
        endpoint: `${endpoint.method} ${endpoint.url}`,
        auth: endpoint.auth,
        requests: {
          total: result.requests.total,
          rps: Math.round(result.requests.mean),
        },
        latency: {
          p50: result.latency.p50,
          p95: result.latency.p95,
          p99: result.latency.p99,
          mean: result.latency.mean,
          max: result.latency.max,
        },
        ttfb: result.latency.p50,
        errors: result.errors,
        error_rate: result.requests.total > 0
          ? ((result.errors / result.requests.total) * 100).toFixed(2) + "%"
          : "0%",
        throughput_MB_s: (result.throughput.mean / 1024 / 1024).toFixed(3),
      });
    });
  });
}

async function main() {
  console.log("🚀 RIZQ Benchmark Suite");
  console.log(`Target: ${BASE_URL}`);
  console.log(`Duration: ${DURATION}s per endpoint | Connections: ${CONNECTIONS}\n`);
  console.log("=".repeat(70));

  const results = [];
  for (const ep of endpoints) {
    process.stdout.write(`Benchmarking ${ep.method} ${ep.url}... `);
    const r = await runBenchmark(ep);
    results.push(r);
    if (r.error) {
      console.log(`ERROR: ${r.error}`);
    } else {
      console.log(`p50=${r.latency.p50}ms p95=${r.latency.p95}ms p99=${r.latency.p99}ms RPS=${r.requests.rps} err=${r.error_rate}`);
    }
  }

  console.log("\n" + "=".repeat(70));
  console.log("SUMMARY REPORT");
  console.log("=".repeat(70));
  console.log(`${"Endpoint".padEnd(40)} ${"p50".padStart(6)} ${"p95".padStart(6)} ${"p99".padStart(6)} ${"RPS".padStart(6)} ${"ErrRate".padStart(8)}`);
  console.log("-".repeat(70));
  for (const r of results) {
    if (!r.error) {
      const ep = r.endpoint.padEnd(40);
      console.log(`${ep} ${String(r.latency.p50).padStart(6)} ${String(r.latency.p95).padStart(6)} ${String(r.latency.p99).padStart(6)} ${String(r.requests.rps).padStart(6)} ${r.error_rate.padStart(8)}`);
    }
  }

  // Save JSON report
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const reportPath = path.join(__dirname, `report-${ts}.json`);
  fs.writeFileSync(reportPath, JSON.stringify({ timestamp: new Date().toISOString(), config: { base_url: BASE_URL, duration: DURATION, connections: CONNECTIONS }, results }, null, 2));
  console.log(`\n📊 Full report saved: ${reportPath}`);
}

main().catch(console.error);
