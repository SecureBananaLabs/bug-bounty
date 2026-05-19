#!/usr/bin/env node
import autocannon from "autocannon";
import { writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const RESULTS_DIR = resolve(__dirname, "results");
const HOST = process.env.BENCHMARK_HOST || "http://localhost:3000";
const CONNECTIONS = parseInt(process.env.BENCHMARK_CONNECTIONS || "10");
const DURATION = parseInt(process.env.BENCHMARK_DURATION || "10");
const TOKEN = process.env.BENCHMARK_TOKEN || "";
const P99_THRESHOLD = parseInt(process.env.BENCHMARK_P99_THRESHOLD_MS || "500");
const ERROR_THRESHOLD = parseFloat(process.env.BENCHMARK_ERROR_RATE_THRESHOLD || "0.05");

const ENDPOINTS = [
  { name: "Health", method: "GET", path: "/health" },
  { name: "Auth Register", method: "POST", path: "/api/auth/register", body: JSON.stringify({ email: "test@test.com", password: "Test123!", name: "Test" }) },
  { name: "Auth Login", method: "POST", path: "/api/auth/login", body: JSON.stringify({ email: "test@test.com", password: "Test123!" }) },
  { name: "Users List", method: "GET", path: "/api/users" },
  { name: "Jobs List", method: "GET", path: "/api/jobs" },
  { name: "Proposals List", method: "GET", path: "/api/proposals" },
  { name: "Reviews List", method: "GET", path: "/api/reviews" },
  { name: "Messages List", method: "GET", path: "/api/messages" },
  { name: "Search", method: "GET", path: "/api/search?q=test" },
];

const headers = { "Content-Type": "application/json" };
if (TOKEN) headers["Authorization"] = `Bearer ${TOKEN}`;

async function runBenchmark(endpoint, idx, total) {
  return new Promise((resolve) => {
    console.log(`[${idx}/${total}] ${endpoint.method} ${endpoint.path}...`);
    const instance = autocannon({
      url: `${HOST}${endpoint.path}`,
      method: endpoint.method,
      connections: CONNECTIONS,
      duration: DURATION,
      headers,
      body: endpoint.body || undefined,
    });
    autocannon.track(instance, { renderProgressBar: false });
    instance.on("done", (result) => {
      resolve({
        endpoint: endpoint.name, method: endpoint.method, path: endpoint.path,
        latency: { p50: result.latency.p50, p95: result.latency.p95, p99: result.latency.p99, avg: result.latency.average },
        rps: { mean: result.requests.mean, max: result.requests.max, total: result.requests.total },
        errors: result.errors, error_rate: result.errors / (result.requests.total || 1),
        status_2xx: result["2xx"] || 0, status_4xx: result["4xx"] || 0, status_5xx: result["5xx"] || 0,
      });
    });
    instance.on("error", (err) => resolve({ endpoint: endpoint.name, error: err.message, latency: { p50:0,p95:0,p99:0,avg:0 }, rps: { mean:0,max:0,total:0 }, errors: 0, error_rate: 0 }));
  });
}

async function main() {
  mkdirSync(RESULTS_DIR, { recursive: true });
  console.log(`Target: ${HOST} | Connections: ${CONNECTIONS} | Duration: ${DURATION}s\\n`);
  const results = [];
  for (let i = 0; i < ENDPOINTS.length; i++) results.push(await runBenchmark(ENDPOINTS[i], i + 1, ENDPOINTS.length));
  writeFileSync(resolve(RESULTS_DIR, "results.json"), JSON.stringify(results, null, 2));
  const mdLines = ["# API Benchmark Results", "", `**Target:** ${HOST} | **Connections:** ${CONNECTIONS} | **Duration:** ${DURATION}s`, "", "| Endpoint | Method | p50 | p95 | p99 | RPS | Errors |", "|----------|--------|-----|-----|-----|-----|--------|"];
  let passed = 0;
  for (const r of results) {
    const p99Pass = r.latency.p99 <= P99_THRESHOLD, errPass = r.error_rate <= ERROR_THRESHOLD;
    (p99Pass && errPass) ? passed++ : 0;
    mdLines.push(`| ${r.endpoint} | ${r.method} | ${r.latency.p50}ms | ${r.latency.p95}ms | ${r.latency.p99}ms | ${r.rps.mean.toFixed(1)} | ${r.errors} |`);
  }
  mdLines.push("", `**Passed:** ${passed} / ${results.length}`);
  writeFileSync(resolve(RESULTS_DIR, "results.md"), mdLines.join("\\n"));
  console.log(`\\nResults saved to ${RESULTS_DIR}`);
  process.exit(passed === results.length ? 0 : 1);
}
main().catch((err) => { console.error(err); process.exit(1); });
