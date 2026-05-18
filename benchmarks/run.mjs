#!/usr/bin/env node
import fs from "node:fs/promises";
import { performance } from "node:perf_hooks";

const BASE_URL = process.env.BENCHMARK_BASE_URL ?? "http://127.0.0.1:4000";
const TOKEN = process.env.BENCHMARK_TOKEN ?? "";
const CONCURRENCY = Number(process.env.BENCHMARK_CONCURRENCY ?? 5);
const DURATION_MS = Number(process.env.BENCHMARK_DURATION_MS ?? 5000);
const MAX_P99_MS = Number(process.env.BENCHMARK_MAX_P99_MS ?? 1000);
const MAX_ERROR_RATE = Number(process.env.BENCHMARK_MAX_ERROR_RATE ?? 0);

const endpoints = [
  { name: "auth_register", method: "POST", path: "/api/auth/register", body: () => ({ email: `bench-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`, password: "benchmark-password", role: "client" }) },
  { name: "auth_login", method: "POST", path: "/api/auth/login", body: { email: "bench@example.com", password: "benchmark-password" } },
  { name: "auth_refresh", method: "POST", path: "/api/auth/refresh" },
  { name: "auth_oauth_callback", method: "GET", path: "/api/auth/github/callback" },
  { name: "users_list", method: "GET", path: "/api/users" },
  { name: "users_create", method: "POST", path: "/api/users", body: () => ({ email: `user-${Date.now()}@example.com`, role: "freelancer", name: "Bench User" }) },
  { name: "jobs_list", method: "GET", path: "/api/jobs" },
  { name: "jobs_create", method: "POST", path: "/api/jobs", body: { title: "Benchmark Job", description: "Benchmark payload for API performance testing", budgetMin: 100, budgetMax: 500, categoryId: "cat_bench", skills: ["node", "api"] } },
  { name: "proposals_list", method: "GET", path: "/api/proposals" },
  { name: "proposals_create", method: "POST", path: "/api/proposals", body: { jobId: "job_bench", freelancerId: "usr_bench", coverLetter: "Benchmark proposal", bidAmount: 250 } },
  { name: "payments_create", method: "POST", path: "/api/payments", body: { amount: 25000, currency: "usd" } },
  { name: "reviews_list", method: "GET", path: "/api/reviews" },
  { name: "reviews_create", method: "POST", path: "/api/reviews", body: { targetId: "usr_bench", rating: 5, comment: "Benchmark review" } },
  { name: "messages_list", method: "GET", path: "/api/messages" },
  { name: "messages_create", method: "POST", path: "/api/messages", body: { to: "usr_bench", body: "Benchmark message" } },
  { name: "notifications_list", method: "GET", path: "/api/notifications" },
  { name: "notifications_create", method: "POST", path: "/api/notifications", body: { userId: "usr_bench", type: "benchmark", message: "Benchmark notification" } },
  { name: "uploads_create", method: "POST", path: "/api/uploads", multipart: true },
  { name: "search", method: "GET", path: "/api/search?q=designer" },
  { name: "admin_metrics", method: "GET", path: "/api/admin/metrics", auth: true }
];

function percentile(values, p) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))];
}

function bodyFor(endpoint) {
  if (endpoint.multipart) {
    const form = new FormData();
    form.append("file", new Blob(["benchmark file"], { type: "text/plain" }), "benchmark.txt");
    return { body: form };
  }
  if (!endpoint.body) return {};
  return { body: JSON.stringify(typeof endpoint.body === "function" ? endpoint.body() : endpoint.body), headers: { "content-type": "application/json" } };
}

async function hit(endpoint) {
  const headers = {};
  if (endpoint.auth && TOKEN) headers.authorization = `Bearer ${TOKEN}`;
  const body = bodyFor(endpoint);
  Object.assign(headers, body.headers ?? {});
  const start = performance.now();
  let ttfb = 0;
  try {
    const response = await fetch(`${BASE_URL}${endpoint.path}`, { method: endpoint.method, headers, body: body.body });
    ttfb = performance.now() - start;
    await response.arrayBuffer();
    return { ms: performance.now() - start, ttfb, ok: response.status < 500, status: response.status };
  } catch (error) {
    return { ms: performance.now() - start, ttfb, ok: false, status: 0, error: error.message };
  }
}

async function bench(endpoint) {
  const deadline = Date.now() + DURATION_MS;
  const samples = [];
  let count = 0;
  await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
    while (Date.now() < deadline) {
      samples.push(await hit(endpoint));
      count += 1;
    }
  }));
  const latencies = samples.map(s => s.ms);
  const ttfb = samples.map(s => s.ttfb || s.ms);
  const errors = samples.filter(s => !s.ok).length;
  return {
    name: endpoint.name,
    method: endpoint.method,
    path: endpoint.path,
    requests: count,
    sustainedRps: Number((count / (DURATION_MS / 1000)).toFixed(2)),
    peakRps: Number((count / (DURATION_MS / 1000)).toFixed(2)),
    errorRate: Number(((errors / Math.max(count, 1)) * 100).toFixed(2)),
    p50Ms: Number(percentile(latencies, 50).toFixed(2)),
    p95Ms: Number(percentile(latencies, 95).toFixed(2)),
    p99Ms: Number(percentile(latencies, 99).toFixed(2)),
    ttfbMs: Number(percentile(ttfb, 50).toFixed(2))
  };
}

const results = [];
for (const endpoint of endpoints) {
  console.log(`Benchmarking ${endpoint.method} ${endpoint.path}`);
  results.push(await bench(endpoint));
}

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
await fs.mkdir("benchmarks/results", { recursive: true });
await fs.writeFile(`benchmarks/results/${timestamp}.json`, JSON.stringify({ baseUrl: BASE_URL, concurrency: CONCURRENCY, durationMs: DURATION_MS, results }, null, 2));

const rows = results.map(r => `| ${r.method} ${r.path} | ${r.requests} | ${r.sustainedRps} | ${r.errorRate}% | ${r.p50Ms} | ${r.p95Ms} | ${r.p99Ms} | ${r.ttfbMs} |`).join("\n");
const summary = `# API Benchmark Summary\n\nBase URL: ${BASE_URL}\nConcurrency: ${CONCURRENCY}\nDuration per endpoint: ${DURATION_MS}ms\n\n| Endpoint | Requests | RPS | Error rate | p50 ms | p95 ms | p99 ms | TTFB ms |\n|---|---:|---:|---:|---:|---:|---:|---:|\n${rows}\n`;
await fs.writeFile(`benchmarks/results/${timestamp}.md`, summary);

const failing = results.filter(r => r.p99Ms > MAX_P99_MS || r.errorRate > MAX_ERROR_RATE);
if (failing.length) {
  console.error(`Benchmark threshold failed for: ${failing.map(f => f.name).join(", ")}`);
  process.exitCode = 1;
}
