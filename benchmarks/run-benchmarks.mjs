import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import autocannon from "autocannon";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

function parseEnvFile(content) {
  return content
    .split(/\r?\n/)
    .filter((line) => line && !line.trim().startsWith("#"))
    .reduce((acc, line) => {
      const idx = line.indexOf("=");
      if (idx === -1) return acc;
      const key = line.slice(0, idx).trim();
      const value = line.slice(idx + 1).trim();
      acc[key] = value;
      return acc;
    }, {});
}

async function loadBenchmarkEnv() {
  const envPath = path.join(rootDir, ".env.benchmark");
  try {
    const content = await fs.readFile(envPath, "utf8");
    const parsed = parseEnvFile(content);
    for (const [k, v] of Object.entries(parsed)) {
      if (!process.env[k]) process.env[k] = v;
    }
  } catch {
    // optional
  }
}

async function measureTtfbMs(url, method, headers, body) {
  const start = performance.now();
  const response = await fetch(url, { method, headers, body });
  await response.arrayBuffer();
  return performance.now() - start;
}

function runAutocannon(config) {
  return new Promise((resolve, reject) => {
    autocannon(config, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

function summarize(result, ttfbMs) {
  const p95 = result.latency.p95 ?? result.latency.p97_5 ?? result.latency.p90 ?? 0;
  return {
    p50Ms: Number(result.latency.p50.toFixed(2)),
    p95Ms: Number(p95.toFixed(2)),
    p99Ms: Number(result.latency.p99.toFixed(2)),
    rpsAvg: Number(result.requests.average.toFixed(2)),
    rpsMax: Number(result.requests.max.toFixed(2)),
    errorRatePct: Number(((result.errors / Math.max(result.requests.total, 1)) * 100).toFixed(3)),
    ttfbMs: Number(ttfbMs.toFixed(2)),
  };
}

await loadBenchmarkEnv();
const baseUrl = process.env.BENCHMARK_BASE_URL || "http://127.0.0.1:4000";
const authToken = process.env.BENCHMARK_AUTH_TOKEN || "benchmark-token";
const connections = Number(process.env.BENCHMARK_CONNECTIONS || 10);
const duration = Number(process.env.BENCHMARK_DURATION || 5);
const smokeMode = process.env.BENCHMARK_SMOKE === "1";

const endpoints = [
  { method: "GET", path: "/api/jobs" },
  { method: "POST", path: "/api/jobs", body: { title: "Bench Job", budget: 1500, description: "Node API benchmark payload", skills: ["node", "express"] } },
  { method: "GET", path: "/api/users" },
  { method: "POST", path: "/api/users", body: { name: "Bench User", email: "bench@example.com", role: "freelancer" } },
  { method: "GET", path: "/api/proposals" },
  { method: "POST", path: "/api/proposals", body: { jobId: "job-1", coverLetter: "Benchmark proposal", bid: 300 } },
  { method: "POST", path: "/api/payments", body: { proposalId: "prop-1", amount: 300, currency: "USD" } },
  { method: "GET", path: "/api/reviews" },
  { method: "POST", path: "/api/reviews", body: { projectId: "proj-1", rating: 5, comment: "Great work" } },
  { method: "GET", path: "/api/messages" },
  { method: "POST", path: "/api/messages", body: { toUserId: "user-2", body: "Benchmark message payload" } },
  { method: "GET", path: "/api/notifications" },
  { method: "POST", path: "/api/notifications", body: { type: "job_update", message: "Benchmark notification" } },
  { method: "POST", path: "/api/uploads", body: { fileName: "benchmark.txt", content: "placeholder" } },
  { method: "GET", path: "/api/search", query: "q=benchmark" },
  { method: "GET", path: "/api/admin/metrics", auth: true },
  { method: "POST", path: "/api/auth/register", body: { email: "bench-register@example.com", password: "Password123!", name: "Bench Register" } },
  { method: "POST", path: "/api/auth/login", body: { email: "bench-register@example.com", password: "Password123!" } },
  { method: "POST", path: "/api/auth/refresh", body: { refreshToken: "benchmark-refresh-token" } },
  { method: "GET", path: "/api/auth/oauth/github/callback", query: "code=benchmark&state=benchmark" }
];

const results = [];
for (const endpoint of endpoints) {
  const target = `${baseUrl}${endpoint.path}${endpoint.query ? `?${endpoint.query}` : ""}`;
  const jsonBody = endpoint.body ? JSON.stringify(endpoint.body) : undefined;
  const headers = {
    "content-type": "application/json",
    ...(endpoint.auth ? { authorization: `Bearer ${authToken}` } : {}),
  };

  const ttfbMs = await measureTtfbMs(target, endpoint.method, headers, jsonBody);
  const run = await runAutocannon({
    url: target,
    method: endpoint.method,
    connections,
    duration,
    headers,
    body: jsonBody,
  });

  results.push({
    endpoint: `${endpoint.method} ${endpoint.path}`,
    target,
    ...summarize(run, ttfbMs),
  });
}

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const outputDir = path.join(rootDir, "benchmarks", "results");
await fs.mkdir(outputDir, { recursive: true });

const meta = {
  generatedAt: new Date().toISOString(),
  baseUrl,
  nodeVersion: process.version,
  platform: process.platform,
  arch: process.arch,
  smokeMode,
  connections,
  duration,
};
const jsonPath = path.join(outputDir, `benchmark-${timestamp}.json`);
await fs.writeFile(jsonPath, JSON.stringify({ meta, results }, null, 2));

const mdLines = [
  "# API Benchmark Summary",
  "",
  `- Generated: ${meta.generatedAt}`,
  `- Base URL: ${baseUrl}`,
  `- Node: ${meta.nodeVersion}`,
  `- Platform: ${meta.platform}/${meta.arch}`,
  `- Connections: ${connections}`,
  `- Duration (s): ${duration}`,
  "",
  "| Endpoint | p50 (ms) | p95 (ms) | p99 (ms) | RPS avg | RPS max | Error % | TTFB (ms) |",
  "|---|---:|---:|---:|---:|---:|---:|---:|",
  ...results.map((r) => `| ${r.endpoint} | ${r.p50Ms} | ${r.p95Ms} | ${r.p99Ms} | ${r.rpsAvg} | ${r.rpsMax} | ${r.errorRatePct} | ${r.ttfbMs} |`),
  "",
  `JSON output: \`${path.relative(rootDir, jsonPath)}\``,
];
const mdPath = path.join(outputDir, `benchmark-${timestamp}.md`);
await fs.writeFile(mdPath, mdLines.join("\n"));

const thresholds = JSON.parse(await fs.readFile(path.join(rootDir, "benchmarks", "thresholds.json"), "utf8"));
const violations = results.filter((row) => {
  const threshold = thresholds.endpoints[row.endpoint] ?? thresholds.defaultP99Ms;
  return row.p99Ms > threshold;
});

console.log(`Wrote ${path.relative(rootDir, jsonPath)}`);
console.log(`Wrote ${path.relative(rootDir, mdPath)}`);
if (smokeMode && violations.length > 0) {
  console.error("Smoke benchmark threshold violations:");
  for (const v of violations) {
    const threshold = thresholds.endpoints[v.endpoint] ?? thresholds.defaultP99Ms;
    console.error(`- ${v.endpoint}: p99=${v.p99Ms}ms > ${threshold}ms`);
  }
  process.exit(1);
}
