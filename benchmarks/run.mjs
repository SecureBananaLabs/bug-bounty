
import { createHmac } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import process from "node:process";
import { performance } from "node:perf_hooks";

const baseUrl = (process.env.BENCHMARK_BASE_URL || "http://127.0.0.1:4000").replace(/\/$/, "");
const smoke = process.argv.includes("--smoke");
const concurrency = Number(process.env.BENCHMARK_CONCURRENCY || (smoke ? 2 : 4));
const requestsPerEndpoint = Number(process.env.BENCHMARK_REQUESTS || (smoke ? 4 : 8));
const thresholds = JSON.parse(await readFile(new URL("./thresholds.json", import.meta.url), "utf8"));

function b64url(value) {
  return Buffer.from(value).toString("base64url");
}

function benchmarkToken() {
  if (process.env.BENCHMARK_AUTH_TOKEN) return process.env.BENCHMARK_AUTH_TOKEN;
  const secret = process.env.JWT_SECRET || "development-secret";
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = b64url(JSON.stringify({ sub: "benchmark-user", role: "admin", iat: Math.floor(Date.now() / 1000) }));
  const signature = createHmac("sha256", secret).update(`${header}.${payload}`).digest("base64url");
  return `${header}.${payload}.${signature}`;
}

const token = benchmarkToken();
const json = (body) => ({ headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
const endpoints = [
  ["POST", "/api/auth/register", () => json({ name: "Benchmark User", email: `bench-${Date.now()}-${Math.random()}@example.com`, password: "BenchmarkPass123!" })],
  ["POST", "/api/auth/login", () => json({ email: "bench@example.com", password: "BenchmarkPass123!" })],
  ["GET", "/api/auth/oauth/github/callback?code=benchmark", () => ({})],
  ["POST", "/api/auth/refresh", () => json({ refreshToken: "benchmark-refresh-token" })],
  ["GET", "/api/users", () => ({})],
  ["POST", "/api/users", () => json({ name: "Benchmark User", email: `user-${Date.now()}-${Math.random()}@example.com`, role: "freelancer" })],
  ["GET", "/api/jobs", () => ({})],
  ["POST", "/api/jobs", () => json({ title: "TypeScript API benchmark", description: "Synthetic benchmark job payload for realistic API load testing", budgetMin: 1000, budgetMax: 1200, categoryId: "development", skills: ["typescript", "api"] })],
  ["GET", "/api/proposals", () => ({})],
  ["POST", "/api/proposals", () => json({ jobId: "benchmark-job", coverLetter: "Synthetic proposal for load testing", amount: 1000 })],
  ["POST", "/api/payments", () => json({ proposalId: "benchmark-proposal", amount: 1000, currency: "usd" })],
  ["GET", "/api/reviews", () => ({})],
  ["POST", "/api/reviews", () => json({ subjectId: "benchmark-user", rating: 5, comment: "Benchmark review payload" })],
  ["GET", "/api/messages", () => ({})],
  ["POST", "/api/messages", () => json({ recipientId: "benchmark-user", body: "Benchmark message payload" })],
  ["GET", "/api/notifications", () => ({})],
  ["POST", "/api/notifications", () => json({ userId: "benchmark-user", type: "system", message: "Benchmark notification" })],
  ["POST", "/api/uploads", () => { const form = new FormData(); form.append("file", new Blob(["benchmark fixture"], { type: "text/plain" }), "benchmark.txt"); return { body: form }; }],
  ["GET", "/api/search?q=typescript%20benchmark", () => ({})],
  ["GET", "/api/admin/metrics", () => ({ headers: { authorization: `Bearer ${token}` } })]
];

function percentile(values, p) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)] || 0;
}

async function one(method, path, initFactory) {
  const init = initFactory();
  const started = performance.now();
  try {
    const response = await fetch(`${baseUrl}${path}`, { method, ...init });
    const firstByte = performance.now();
    await response.arrayBuffer();
    const ended = performance.now();
    return { status: response.status, ttfb: firstByte - started, latency: ended - started, failed: response.status >= 400 };
  } catch (error) {
    return { status: 0, ttfb: 0, latency: performance.now() - started, failed: true, error: error.message };
  }
}

async function benchmarkEndpoint(method, path, initFactory) {
  await one(method, path, initFactory);
  const samples = [];
  const started = performance.now();
  for (let offset = 0; offset < requestsPerEndpoint; offset += concurrency) {
    const count = Math.min(concurrency, requestsPerEndpoint - offset);
    samples.push(...await Promise.all(Array.from({ length: count }, () => one(method, path, initFactory))));
  }
  const elapsedMs = performance.now() - started;
  const latencies = samples.map((s) => s.latency);
  const ttfbs = samples.map((s) => s.ttfb);
  const statuses = {};
  for (const sample of samples) statuses[sample.status] = (statuses[sample.status] || 0) + 1;
  const failed = samples.filter((s) => s.failed).length;
  const key = `${method} ${path.split("?")[0]}`;
  const threshold = { ...thresholds.default, ...(thresholds.overrides[key] || {}) };
  const result = {
    method, path, requests: samples.length,
    p50Ms: +percentile(latencies, 50).toFixed(2),
    p95Ms: +percentile(latencies, 95).toFixed(2),
    p99Ms: +percentile(latencies, 99).toFixed(2),
    ttfbP95Ms: +percentile(ttfbs, 95).toFixed(2),
    sustainedRps: +(samples.length / (elapsedMs / 1000)).toFixed(2),
    peakRps: +(concurrency / (Math.max(1, percentile(latencies, 50)) / 1000)).toFixed(2),
    errorRatePct: +((failed / samples.length) * 100).toFixed(2), statuses
  };
  result.passed = result.p99Ms <= threshold.p99Ms && result.errorRatePct <= threshold.errorRatePct;
  return result;
}

const results = [];
for (const endpoint of endpoints) {
  const result = await benchmarkEndpoint(...endpoint);
  results.push(result);
  console.log(`${result.passed ? "PASS" : "FAIL"} ${result.method} ${result.path} p99=${result.p99Ms}ms errors=${result.errorRatePct}% statuses=${JSON.stringify(result.statuses)}`);
}

const report = {
  generatedAt: new Date().toISOString(), mode: smoke ? "smoke" : "full", target: baseUrl,
  environment: { node: process.version, platform: `${os.platform()} ${os.release()} ${os.arch()}`, cpu: os.cpus()[0]?.model, cpuCount: os.cpus().length, totalMemoryMb: Math.round(os.totalmem() / 1024 / 1024), freeMemoryMb: Math.round(os.freemem() / 1024 / 1024), concurrency, requestsPerEndpoint },
  results
};
const header = "| Method | Endpoint | Requests | p50 ms | p95 ms | p99 ms | TTFB p95 ms | Sustained RPS | Peak RPS | Error % | Gate |\n|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---|";
const rows = results.map((r) => `| ${r.method} | ${r.path} | ${r.requests} | ${r.p50Ms} | ${r.p95Ms} | ${r.p99Ms} | ${r.ttfbP95Ms} | ${r.sustainedRps} | ${r.peakRps} | ${r.errorRatePct} | ${r.passed ? "PASS" : "FAIL"} |`).join("\n");
const markdown = `# API Benchmark Report\n\n- Generated: ${report.generatedAt}\n- Target: ${baseUrl}\n- Mode: ${report.mode}\n- Runtime: ${report.environment.node}\n- Platform: ${report.environment.platform}\n- CPU: ${report.environment.cpu} (${report.environment.cpuCount} cores)\n- Memory: ${report.environment.totalMemoryMb} MB total / ${report.environment.freeMemoryMb} MB free\n- Concurrency: ${concurrency}\n- Requests per endpoint: ${requestsPerEndpoint}\n\n${header}\n${rows}\n`;
await mkdir(new URL("./results/", import.meta.url), { recursive: true });
await writeFile(new URL("./results/latest.json", import.meta.url), `${JSON.stringify(report, null, 2)}\n`);
await writeFile(new URL("./results/latest.md", import.meta.url), markdown);
if (results.some((r) => !r.passed)) process.exitCode = 1;
