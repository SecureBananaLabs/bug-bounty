/**
 * SecureBananaLabs API Benchmark Suite
 * Measures p50/p95/p99 latency, RPS, error rate, TTFB
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import autocannon from "autocannon";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HOST = process.env.BENCHMARK_HOST || "http://localhost:4000";
const AUTH_TOKEN = process.env.BENCHMARK_AUTH_TOKEN || "";
const DURATION = Number(process.env.BENCHMARK_DURATION) || 30;
const CONNECTIONS = Number(process.env.BENCHMARK_CONNECTIONS) || 10;
const OUTPUT_DIR = path.resolve(__dirname, process.env.BENCHMARK_OUTPUT_DIR || "results");

function getEndpoints() {
  const authHeaders = AUTH_TOKEN ? { authorization: "Bearer " + AUTH_TOKEN } : {};
  return [
    { name: "GET /health", method: "GET", path: "/health" },
    { name: "GET /api/jobs/", method: "GET", path: "/api/jobs/" },
    { name: "POST /api/jobs/", method: "POST", path: "/api/jobs/", body: { title: "Test Job", description: "Testing.", budget: 5000, category: "dev", skills: ["node"] }, ...authHeaders },
    { name: "GET /api/users/", method: "GET", path: "/api/users/" },
    { name: "GET /api/search/", method: "GET", path: "/api/search/?q=test" },
    { name: "GET /api/admin/metrics", method: "GET", path: "/api/admin/metrics", ...authHeaders },
  ];
}

async function runBenchmark() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const endpoints = getEndpoints();
  for (const ep of endpoints) {
    const opts = {
      url: new URL(ep.path, HOST).href,
      method: ep.method || "GET",
      connections: CONNECTIONS, duration: DURATION,
      headers: { "content-type": "application/json", ...(ep.authorization ? { authorization: ep.authorization } : {}) },
      body: ep.body ? JSON.stringify(ep.body) : undefined,
      latency: true, skipBodies: true,
    };
    try {
      const result = await autocannon(opts);
      console.log(ep.name, "| p50:", result.latency.p50.toFixed(1), "ms | RPS:", result.requests.average.toFixed(0));
    } catch (err) {
      console.log(ep.name, "| FAIL:", err.message);
    }
  }
  console.log("Done!");
}

runBenchmark().catch(err => { console.error(err); process.exit(1); });
