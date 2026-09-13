import { writeFile, mkdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { performance } from "node:perf_hooks";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..");
const resultsDir = join(__dirname, "results");
const thresholdsPath = join(__dirname, "thresholds.json");

const target = process.env.BENCHMARK_TARGET || "http://127.0.0.1:3001";
const token = process.env.BENCHMARK_TOKEN || "benchmark-local-token";
const concurrency = Number(process.env.BENCHMARK_CONCURRENCY || 2);
const iterations = Number(process.env.BENCHMARK_ITERATIONS || 5);

const endpoints = [
  { name: "health", method: "GET", path: "/health", auth: false },
  { name: "auth-login", method: "POST", path: "/api/auth/login", auth: false, body: { email: "bench@example.com", password: "password123" } },
  { name: "users-list", method: "GET", path: "/api/users", auth: true },
  { name: "jobs-list", method: "GET", path: "/api/jobs", auth: true },
  { name: "proposals-list", method: "GET", path: "/api/proposals", auth: true },
  { name: "payments-list", method: "GET", path: "/api/payments", auth: true },
  { name: "reviews-list", method: "GET", path: "/api/reviews", auth: true },
  { name: "messages-list", method: "GET", path: "/api/messages", auth: true },
  { name: "notifications-list", method: "GET", path: "/api/notifications", auth: true },
  { name: "search", method: "GET", path: "/api/search?q=benchmark", auth: true },
  { name: "admin", method: "GET", path: "/api/admin", auth: true }
];

const percentile = (values, p) => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return Number(sorted[index].toFixed(2));
};

const runRequest = async (endpoint) => {
  const start = performance.now();
  const response = await fetch(`${target}${endpoint.path}`, {
    method: endpoint.method,
    headers: {
      "content-type": "application/json",
      ...(endpoint.auth ? { authorization: `Bearer ${token}` } : {})
    },
    body: endpoint.body ? JSON.stringify(endpoint.body) : undefined
  });
  const ttfbMs = performance.now() - start;
  await response.arrayBuffer();
  const totalMs = performance.now() - start;
  return { status: response.status, ttfbMs, totalMs, ok: response.status < 500 };
};

const runEndpoint = async (endpoint) => {
  const startedAt = performance.now();
  const requests = [];
  for (let i = 0; i < iterations; i += concurrency) {
    const batch = Array.from({ length: Math.min(concurrency, iterations - i) }, () => runRequest(endpoint));
    requests.push(...(await Promise.all(batch)));
  }
  const elapsedSeconds = (performance.now() - startedAt) / 1000;
  const latencies = requests.map((r) => r.totalMs);
  const ttfb = requests.map((r) => r.ttfbMs);
  const errors = requests.filter((r) => !r.ok).length;
  return {
    endpoint: endpoint.name,
    method: endpoint.method,
    path: endpoint.path,
    requests: requests.length,
    p50_ms: percentile(latencies, 50),
    p95_ms: percentile(latencies, 95),
    p99_ms: percentile(latencies, 99),
    ttfb_p50_ms: percentile(ttfb, 50),
    rps: Number((requests.length / Math.max(elapsedSeconds, 0.001)).toFixed(2)),
    error_rate_percent: Number(((errors / Math.max(requests.length, 1)) * 100).toFixed(2)),
    statuses: requests.reduce((counts, request) => {
      counts[request.status] = (counts[request.status] || 0) + 1;
      return counts;
    }, {})
  };
};

const writeSummary = async (result) => {
  const rows = result.endpoints
    .map((item) => `| ${item.method} ${item.path} | ${item.p50_ms} | ${item.p95_ms} | ${item.p99_ms} | ${item.ttfb_p50_ms} | ${item.rps} | ${item.error_rate_percent}% |`)
    .join("\n");
  const summary = `# API benchmark summary\n\nTarget: ${result.target}\n\n| Endpoint | p50 ms | p95 ms | p99 ms | TTFB p50 ms | RPS | Error rate |\n| --- | ---: | ---: | ---: | ---: | ---: | ---: |\n${rows}\n`;
  await writeFile(join(resultsDir, "latest-summary.md"), summary);
};

const main = async () => {
  await mkdir(resultsDir, { recursive: true });
  const thresholds = JSON.parse(await readFile(thresholdsPath, "utf8"));
  const endpointResults = [];
  for (const endpoint of endpoints) {
    endpointResults.push(await runEndpoint(endpoint));
  }
  const result = {
    target,
    generated_at: new Date().toISOString(),
    node: process.version,
    concurrency,
    iterations,
    endpoints: endpointResults
  };
  await writeFile(join(resultsDir, "latest.json"), `${JSON.stringify(result, null, 2)}\n`);
  await writeSummary(result);

  const failures = endpointResults.filter((item) => item.p99_ms > thresholds.p99_ms || item.error_rate_percent > thresholds.error_rate_percent);
  if (failures.length > 0) {
    console.error("Benchmark threshold failures:", failures.map((item) => item.endpoint).join(", "));
    process.exit(1);
  }
  console.log(`Benchmarked ${endpointResults.length} endpoints. Results written to benchmarks/results/.`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
