#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";
import { createApp } from "../apps/api/src/app.js";
import { signAccessToken } from "../apps/api/src/utils/jwt.js";
import { createScenarios } from "./scenarios.mjs";

const ROOT = new URL("..", import.meta.url);
const RESULTS_DIR = new URL("benchmarks/results/", ROOT);
const THRESHOLDS_FILE = new URL("benchmarks/thresholds.json", ROOT);
const isSmoke = process.argv.includes("--smoke") || process.env.BENCHMARK_SMOKE === "1";

function readNumber(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function readNonNegativeNumber(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

function percentile(values, pct) {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((pct / 100) * sorted.length) - 1);
  return sorted[index];
}

function round(value, digits = 2) {
  return Number(value.toFixed(digits));
}

async function startLocalServer() {
  const app = createApp();
  const server = app.listen(0, "127.0.0.1");

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())))
  };
}

async function requestOnce(baseUrl, scenario, index) {
  const url = new URL(scenario.path, baseUrl);
  const headers = { ...(scenario.headers ?? {}) };
  const init = { method: scenario.method, headers };
  if (scenario.json) {
    init.body = JSON.stringify(scenario.json(index));
  }
  if (scenario.formData) {
    init.body = scenario.formData(index);
  }

  const start = performance.now();
  let response;
  let ttfbMs;
  let body = "";
  let error;

  try {
    response = await fetch(url, init);
    ttfbMs = performance.now() - start;
    body = await response.text();
  } catch (caught) {
    error = caught;
    ttfbMs = performance.now() - start;
  }

  const latencyMs = performance.now() - start;
  const status = response?.status ?? 0;
  const ok = Boolean(response?.ok);

  return {
    status,
    ok,
    startedAtMs: start,
    latencyMs,
    ttfbMs,
    bytes: Buffer.byteLength(body),
    error: error?.message
  };
}

async function runScenario(baseUrl, scenario, options) {
  const total = options.iterations;
  const concurrency = Math.min(options.concurrency, total);
  let cursor = 0;
  const results = [];
  const startedAt = performance.now();

  async function worker() {
    while (cursor < total) {
      const current = cursor;
      cursor += 1;
      results.push(await requestOnce(baseUrl, scenario, current));
    }
  }

  await Promise.all(Array.from({ length: concurrency }, worker));
  const durationMs = performance.now() - startedAt;
  const latencies = results.map((result) => result.latencyMs);
  const ttfb = results.map((result) => result.ttfbMs);
  const errors = results.filter((result) => !result.ok).length;

  return {
    name: scenario.name,
    method: scenario.method,
    path: scenario.path,
    requests: results.length,
    errors,
    errorRatePct: round((errors / Math.max(results.length, 1)) * 100),
    sustainedRps: round(results.length / Math.max(durationMs / 1000, 0.001)),
    peakRps: round(Math.max(...chunkedRps(results), 0)),
    latencyMs: {
      p50: round(percentile(latencies, 50)),
      p95: round(percentile(latencies, 95)),
      p99: round(percentile(latencies, 99))
    },
    ttfbMs: {
      p50: round(percentile(ttfb, 50)),
      p95: round(percentile(ttfb, 95)),
      p99: round(percentile(ttfb, 99))
    },
    statuses: summarizeStatuses(results),
    sampleError: results.find((result) => result.error)?.error
  };
}

function chunkedRps(results) {
  const firstStart = Math.min(...results.map((result) => result.startedAtMs));
  const buckets = new Map();
  for (const result of results) {
    const bucket = Math.floor((result.startedAtMs - firstStart) / 1000);
    buckets.set(bucket, (buckets.get(bucket) ?? 0) + 1);
  }
  return [...buckets.values()];
}

function summarizeStatuses(results) {
  const counts = {};
  for (const result of results) {
    counts[result.status] = (counts[result.status] ?? 0) + 1;
  }
  return counts;
}

function thresholdFor(thresholds, name) {
  return {
    ...thresholds.defaults,
    ...(thresholds.endpoints?.[name] ?? {})
  };
}

function evaluateThresholds(summaries, thresholds) {
  return summaries.map((summary) => {
    const threshold = thresholdFor(thresholds, summary.name);
    return {
      name: summary.name,
      passed:
        summary.latencyMs.p99 <= threshold.p99LatencyMs &&
        summary.errorRatePct <= threshold.errorRatePct,
      threshold,
      p99LatencyMs: summary.latencyMs.p99,
      errorRatePct: summary.errorRatePct
    };
  });
}

function renderMarkdown(report) {
  const lines = [
    "# API Benchmark Summary",
    "",
    `Mode: ${report.mode}`,
    `Target: ${report.target}`,
    `Generated: ${report.generatedAt}`,
    `Iterations per endpoint: ${report.options.iterations}`,
    `Concurrency per endpoint: ${report.options.concurrency}`,
    "",
    "| Endpoint | Method | Requests | Error % | Sustained RPS | p50 | p95 | p99 | TTFB p95 | Gate |",
    "| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |"
  ];

  for (const summary of report.summaries) {
    const gate = report.gates.find((item) => item.name === summary.name);
    lines.push(
      `| ${summary.name} | ${summary.method} ${summary.path} | ${summary.requests} | ${summary.errorRatePct} | ${summary.sustainedRps} | ${summary.latencyMs.p50} ms | ${summary.latencyMs.p95} ms | ${summary.latencyMs.p99} ms | ${summary.ttfbMs.p95} ms | ${gate?.passed ? "pass" : "fail"} |`
    );
  }

  return `${lines.join("\n")}\n`;
}

async function main() {
  const localServer = process.env.BENCHMARK_TARGET_URL ? null : await startLocalServer();
  const baseUrl = process.env.BENCHMARK_TARGET_URL ?? localServer.baseUrl;
  const authToken = process.env.BENCHMARK_AUTH_TOKEN ?? signAccessToken({ sub: "usr_benchmark_admin", role: "admin" });
  const options = {
    iterations: isSmoke ? 3 : readNumber("BENCHMARK_ITERATIONS", 20),
    concurrency: isSmoke ? 1 : readNumber("BENCHMARK_CONCURRENCY", 4)
  };

  try {
    const scenarios = createScenarios({ authToken });
    const thresholds = JSON.parse(await readFile(THRESHOLDS_FILE, "utf8"));
    thresholds.defaults.p99LatencyMs = readNumber("BENCHMARK_P99_THRESHOLD_MS", thresholds.defaults.p99LatencyMs);
    thresholds.defaults.errorRatePct = readNonNegativeNumber(
      "BENCHMARK_ERROR_RATE_THRESHOLD",
      thresholds.defaults.errorRatePct
    );
    const summaries = [];

    for (const scenario of scenarios) {
      summaries.push(await runScenario(baseUrl, scenario, options));
    }

    const gates = evaluateThresholds(summaries, thresholds);
    const report = {
      generatedAt: new Date().toISOString(),
      mode: isSmoke ? "smoke" : "full",
      target: process.env.BENCHMARK_TARGET_URL ? baseUrl : "local Express app",
      options,
      summaries,
      gates
    };

    await mkdir(RESULTS_DIR, { recursive: true });
    await writeFile(new URL("latest.json", RESULTS_DIR), `${JSON.stringify(report, null, 2)}\n`);
    await writeFile(new URL("latest.md", RESULTS_DIR), renderMarkdown(report));

    const failed = gates.filter((gate) => !gate.passed);
    if (failed.length > 0) {
      console.error(`Benchmark threshold failures: ${failed.map((gate) => gate.name).join(", ")}`);
      process.exitCode = 1;
    }
  } finally {
    await localServer?.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
