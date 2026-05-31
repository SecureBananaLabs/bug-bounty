import autocannon from "autocannon";
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TARGET = process.env.BENCHMARK_TARGET ?? "http://localhost:4000";
const DURATION = Number(process.env.BENCHMARK_DURATION ?? 10);
const CONNECTIONS = Number(process.env.BENCHMARK_CONNECTIONS ?? 10);

const endpoints = [
  { path: "/health", method: "GET" },
  { path: "/api/auth/register", method: "POST", body: { email: "bench@test.com", password: "BenchPass123!", name: "Bench User", role: "freelancer" } },
  { path: "/api/auth/login", method: "POST", body: { email: "bench@test.com", password: "BenchPass123!" } },
  { path: "/api/users", method: "GET" },
  { path: "/api/jobs", method: "GET" },
  { path: "/api/jobs", method: "POST", body: { title: "Benchmark Job", description: "Performance test job", budget: 1000, category: "engineering", skills: ["benchmark"], experienceLevel: "mid" } },
  { path: "/api/proposals", method: "GET" },
  { path: "/api/payments", method: "POST", body: { amount: 100, currency: "usd", jobId: "bench-job-001" } },
  { path: "/api/reviews", method: "GET" },
  { path: "/api/messages", method: "GET" },
  { path: "/api/notifications", method: "GET" },
  { path: "/api/search", method: "GET" },
];

async function runBenchmark(endpoint) {
  const opts = {
    url: `${TARGET}${endpoint.path}`,
    method: endpoint.method,
    connections: CONNECTIONS,
    duration: DURATION,
    headers: { "Content-Type": "application/json" },
    ...(endpoint.body ? { body: JSON.stringify(endpoint.body) } : {}),
  };

  const result = await autocannon(opts);
  const { latency, requests, errors, throughput } = result;
  const p50 = latency.p50 != null ? latency.p50 : (latency.average ?? 0);
  const p95 = latency.p95 != null ? latency.p95 : (latency.p99 ?? 0);
  const p99 = latency.p99 != null ? latency.p99 : (latency.p99 ?? 0);
  const totalSent = errors.sent || 0;
  const errorRate = totalSent > 0 ? ((errors.timeout + errors.fail) / totalSent * 100).toFixed(2) : "0.00";
  return {
    endpoint: endpoint.path,
    method: endpoint.method,
    latencyMs: { p50: Math.round(p50), p95: Math.round(p95), p99: Math.round(p99) },
    requestsPerSecond: Math.round(requests.average ?? 0),
    errorRate,
    totalRequests: requests.total ?? 0,
    throughputBytesPerSec: Math.round(throughput.average ?? 0),
  };
}

async function main() {
  console.log(`Benchmarking ${TARGET} — ${DURATION}s, ${CONNECTIONS} connections\n`);

  const results = [];
  for (const ep of endpoints) {
    console.log(`  ${ep.method} ${ep.path}...`);
    try {
      const r = await runBenchmark(ep);
      results.push(r);
      console.log(`    p50: ${r.latencyMs.p50}ms, p95: ${r.latencyMs.p95}ms, p99: ${r.latencyMs.p99}ms, RPS: ${r.requestsPerSecond}`);
    } catch (err) {
      console.error(`    FAILED: ${err.message}`);
    }
  }

  const output = {
    target: TARGET,
    duration: DURATION,
    connections: CONNECTIONS,
    timestamp: new Date().toISOString(),
    results,
  };

  const resultsDir = resolve(__dirname, "results");
  mkdirSync(resultsDir, { recursive: true });
  writeFileSync(resolve(resultsDir, "benchmark.json"), JSON.stringify(output, null, 2));

  const md = generateMarkdown(output);
  writeFileSync(resolve(resultsDir, "benchmark-summary.md"), md);
  console.log("\nResults written to benchmarks/results/");
  console.log(md);
}

function generateMarkdown(data) {
  let md = `# API Benchmark Results\n\n`;
  md += `- **Target:** \`${data.target}\`\n`;
  md += `- **Duration:** ${data.duration}s\n`;
  md += `- **Connections:** ${data.connections}\n`;
  md += `- **Timestamp:** ${data.timestamp}\n\n`;
  md += `| Endpoint | Method | p50 (ms) | p95 (ms) | p99 (ms) | RPS | Error Rate |\n`;
  md += `|----------|--------|----------|----------|----------|-----|------------|\n`;
  for (const r of data.results) {
    md += `| \`${r.endpoint}\` | ${r.method} | ${r.latencyMs.p50} | ${r.latencyMs.p95} | ${r.latencyMs.p99} | ${r.requestsPerSecond} | ${r.errorRate}% |\n`;
  }
  return md;
}

main().catch(console.error);
