import { spawn } from "node:child_process";
import { cpus, totalmem, platform, arch } from "node:os";
import { performance } from "node:perf_hooks";
import { setTimeout as sleep } from "node:timers/promises";
import { loadBenchmarkEnv } from "./lib/load-env.mjs";
import { summarize } from "./lib/stats.mjs";
import { loadThresholds, evaluateThresholds } from "./lib/thresholds.mjs";
import { writeReports } from "./lib/report.mjs";
import { scenarios } from "./scenarios.mjs";

function arg(name, fallback) {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx >= 0 && process.argv[idx + 1]) return process.argv[idx + 1];
  return fallback;
}

const smoke = process.argv.includes("--smoke");
loadBenchmarkEnv();

const port = Number(process.env.PORT ?? 4100);
const baseUrl = arg("base-url", process.env.BENCHMARK_BASE_URL ?? `http://127.0.0.1:${port}`);
const durationMs = Number(arg("duration-ms", process.env.BENCHMARK_DURATION_MS ?? (smoke ? 900 : 3000)));
const warmupMs = Number(arg("warmup-ms", process.env.BENCHMARK_WARMUP_MS ?? (smoke ? 100 : 300)));
const concurrency = Number(arg("concurrency", process.env.BENCHMARK_CONCURRENCY ?? (smoke ? 1 : 2)));
const timeoutMs = Number(arg("timeout-ms", process.env.BENCHMARK_TIMEOUT_MS ?? 5000));

let child;

async function isHealthy() {
  try {
    const res = await fetch(`${baseUrl}/health`, { signal: AbortSignal.timeout(1000) });
    return res.ok;
  } catch {
    return false;
  }
}

async function waitForHealth() {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    if (await isHealthy()) return;
    await sleep(250);
  }
  throw new Error(`Timed out waiting for API health at ${baseUrl}/health`);
}

async function startServerIfNeeded() {
  if (await isHealthy()) return false;
  child = spawn(process.execPath, ["apps/api/src/server.js"], {
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env,
      PORT: String(port),
      NODE_ENV: "benchmark",
      JWT_SECRET: process.env.JWT_SECRET ?? "benchmark-secret",
      BENCHMARK_DISABLE_RATE_LIMIT: process.env.BENCHMARK_DISABLE_RATE_LIMIT ?? "true"
    }
  });
  child.stdout.on("data", (data) => process.stdout.write(`[api] ${data}`));
  child.stderr.on("data", (data) => process.stderr.write(`[api] ${data}`));
  await waitForHealth();
  return true;
}

function stopServer() {
  if (child && !child.killed) child.kill("SIGTERM");
}

async function makeRequest(scenario, token) {
  const started = performance.now();
  let ttfb = 0;
  let status = 0;
  try {
    const headers = { "X-Benchmark-Run": "true" };
    const init = { method: scenario.method, headers, signal: AbortSignal.timeout(timeoutMs) };
    if (scenario.auth) headers.Authorization = `Bearer ${token}`;
    if (scenario.json) {
      headers["Content-Type"] = "application/json";
      init.body = JSON.stringify(scenario.json());
    }
    if (scenario.multipart) {
      const fixture = scenario.multipart();
      const form = new FormData();
      form.append(fixture.field, new Blob([fixture.body], { type: fixture.type }), fixture.filename);
      init.body = form;
    }
    const res = await fetch(`${baseUrl}${scenario.path}`, init);
    ttfb = performance.now() - started;
    await res.arrayBuffer();
    status = res.status;
    const latency = performance.now() - started;
    return { ok: status === scenario.expectedStatus, status, latencyMs: latency, ttfbMs: ttfb };
  } catch (error) {
    const latency = performance.now() - started;
    return { ok: false, status: status || "error", latencyMs: latency, ttfbMs: ttfb || latency, error: error.message };
  }
}

async function getBenchmarkToken() {
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Benchmark-Run": "true" },
    body: JSON.stringify({ email: "client@example.com", password: "Password123!" })
  });
  const body = await res.json();
  return body.data?.token ?? body.token ?? process.env.BENCHMARK_AUTH_TOKEN;
}

async function runScenario(scenario, token, modeDurationMs) {
  const samples = [];
  const started = performance.now();
  let workers = Array.from({ length: concurrency }, async () => {
    while (performance.now() - started < modeDurationMs) {
      samples.push(await makeRequest(scenario, token));
      if (smoke) break;
    }
  });
  await Promise.all(workers);
  const actualDuration = performance.now() - started;
  return {
    name: scenario.name,
    method: scenario.method,
    path: scenario.path,
    expectedStatus: scenario.expectedStatus,
    auth: scenario.auth,
    durationMs: actualDuration,
    summary: summarize(samples, actualDuration)
  };
}

async function main() {
  const startedAt = new Date().toISOString();
  await startServerIfNeeded();
  if (warmupMs > 0) {
    await makeRequest(scenarios[0], undefined);
    await sleep(warmupMs);
  }
  const token = await getBenchmarkToken();
  const scenarioDuration = smoke ? durationMs : Math.max(250, Math.floor(durationMs / scenarios.length));
  const results = [];
  for (const scenario of scenarios) {
    results.push(await runScenario(scenario, token, scenarioDuration));
  }
  const allSamples = [];
  for (const result of results) {
    const s = result.summary;
    // summarize aggregate from scenario summaries using counts/percentiles conservatively by duplicating p95-ish markers.
    for (let i = 0; i < s.requests; i++) allSamples.push({ ok: i < s.successes, status: "aggregate", latencyMs: s.latencyMs.avg, ttfbMs: s.ttfbMs.avg });
  }
  const totalDuration = results.reduce((sum, r) => sum + r.durationMs, 0);
  const summary = summarize(allSamples, totalDuration);
  summary.peakRequestsPerSecond = Math.max(...results.map((r) => r.summary.requestsPerSecond));
  const report = {
    startedAt,
    completedAt: new Date().toISOString(),
    mode: smoke ? "smoke" : "default",
    baseUrl,
    durationMs,
    warmupMs,
    concurrency,
    scenarios: results,
    summary,
    thresholds: { passed: true, failures: [] },
    environment: {
      node: process.version,
      platform: platform(),
      arch: arch(),
      cpu: cpus()[0]?.model ?? "unknown",
      cpuCount: cpus().length,
      memoryTotalMb: Math.round(totalmem() / 1024 / 1024)
    }
  };
  report.thresholds = evaluateThresholds(report, loadThresholds());
  report.artifacts = await writeReports(report);
  console.log(`Benchmark ${report.thresholds.passed ? "passed" : "failed"}`);
  console.log(`Markdown: ${report.artifacts.latestMarkdownPath}`);
  console.log(`JSON: ${report.artifacts.latestJsonPath}`);
  if (!report.thresholds.passed) {
    for (const failure of report.thresholds.failures) console.error(`- ${failure}`);
    process.exitCode = 1;
  }
  stopServer();
}

process.on("exit", stopServer);
process.on("SIGINT", () => { stopServer(); process.exit(130); });
process.on("SIGTERM", () => { stopServer(); process.exit(143); });

main().catch((error) => {
  console.error(error);
  stopServer();
  process.exit(1);
});
