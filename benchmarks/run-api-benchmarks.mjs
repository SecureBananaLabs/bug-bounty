import { createServer } from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { scenarios } from "./scenarios.mjs";

const args = new Set(process.argv.slice(2));
const smokeMode = args.has("--smoke");
const rootDir = path.resolve(new URL("..", import.meta.url).pathname);

loadEnvFile(path.join(rootDir, ".env.benchmark"));
loadEnvFile(path.join(rootDir, "benchmarks", ".env.benchmark"));

const config = {
  mode: smokeMode ? "smoke" : "full",
  requestsPerEndpoint: readInt("BENCHMARK_REQUESTS", smokeMode ? 3 : 8),
  concurrency: readInt("BENCHMARK_CONCURRENCY", smokeMode ? 1 : 2),
  warmupRequests: readInt("BENCHMARK_WARMUP_REQUESTS", smokeMode ? 0 : 1),
  outputDir: process.env.BENCHMARK_OUTPUT_DIR ?? path.join("benchmarks", "results"),
  targetUrl: normalizeBaseUrl(process.env.BENCHMARK_TARGET_URL),
  thresholdsPath: process.env.BENCHMARK_THRESHOLDS ?? path.join("benchmarks", "thresholds.json")
};

validateConfig(config);

let localServer;
try {
  const target = config.targetUrl ? { baseUrl: config.targetUrl, label: "external" } : await startLocalServer();
  localServer = target.close;

  const thresholds = await readJson(path.resolve(rootDir, config.thresholdsPath));
  const authToken = await resolveAuthToken(target.baseUrl);
  const startedAt = new Date();
  const endpointResults = [];

  for (const scenario of scenarios) {
    endpointResults.push(await runScenario({ scenario, target, authToken, config, thresholds }));
  }

  const report = buildReport({
    startedAt,
    endedAt: new Date(),
    target,
    config,
    thresholds,
    endpointResults
  });

  await writeReports(report, config.outputDir);
  process.stdout.write(renderConsoleSummary(report));

  if (report.summary.failedGateCount > 0) {
    process.exitCode = 1;
  }
} finally {
  if (localServer) {
    await localServer();
  }
}

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return;
  }

  const raw = readFileSync(filePath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const equalsIndex = trimmed.indexOf("=");
    if (equalsIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, equalsIndex).trim();
    let value = trimmed.slice(equalsIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}


function readInt(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === "") {
    return fallback;
  }

  const value = Number.parseInt(raw, 10);
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${name} must be a non-negative integer`);
  }
  return value;
}

function validateConfig(value) {
  if (value.requestsPerEndpoint < 1) {
    throw new Error("BENCHMARK_REQUESTS must be at least 1");
  }
  if (value.concurrency < 1) {
    throw new Error("BENCHMARK_CONCURRENCY must be at least 1");
  }
}

function normalizeBaseUrl(raw) {
  if (!raw) {
    return "";
  }
  return raw.replace(/\/+$/, "");
}

async function startLocalServer() {
  const { createApp } = await import("../apps/api/src/app.js");
  const server = createServer(createApp());

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });

  const address = server.address();
  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    label: "local-in-process",
    close: () => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
  };
}

async function readJson(filePath) {
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw);
}

async function resolveAuthToken(baseUrl) {
  if (process.env.BENCHMARK_AUTH_TOKEN) {
    return process.env.BENCHMARK_AUTH_TOKEN;
  }

  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email: "benchmark-admin@example.test",
      password: "BenchmarkPass123!"
    })
  });
  const payload = await response.json();
  const token = payload?.data?.token;

  if (!token) {
    throw new Error("Unable to obtain a benchmark auth token. Set BENCHMARK_AUTH_TOKEN for protected routes.");
  }
  return token;
}

async function runScenario({ scenario, target, authToken, config, thresholds }) {
  if (scenario.requiresAuth && !authToken) {
    throw new Error(`${scenario.id} requires BENCHMARK_AUTH_TOKEN`);
  }

  for (let iteration = 0; iteration < config.warmupRequests; iteration += 1) {
    await runSingleRequest({ scenario, baseUrl: target.baseUrl, authToken, iteration: `warmup-${iteration}` });
  }

  const samples = [];
  let nextIteration = 0;
  const scenarioStartedAt = performance.now();

  async function worker() {
    while (nextIteration < config.requestsPerEndpoint) {
      const iteration = nextIteration;
      nextIteration += 1;
      samples.push(await runSingleRequest({ scenario, baseUrl: target.baseUrl, authToken, iteration }));
    }
  }

  await Promise.all(Array.from({ length: config.concurrency }, worker));
  const scenarioDurationMs = performance.now() - scenarioStartedAt;

  return summarizeScenario({ scenario, samples, durationMs: scenarioDurationMs, thresholds });
}

async function runSingleRequest({ scenario, baseUrl, authToken, iteration }) {
  const request = scenario.buildRequest({ iteration, authToken });
  const url = new URL(request.path, baseUrl).toString();
  const startedAt = performance.now();

  try {
    const response = await fetch(url, {
      method: request.method,
      headers: request.headers,
      body: request.body
    });
    const ttfbMs = performance.now() - startedAt;
    const text = await response.text();
    const latencyMs = performance.now() - startedAt;
    const expected = scenario.expectedStatuses.includes(response.status);

    return {
      iteration,
      status: response.status,
      ok: expected,
      error: expected ? null : `expected ${scenario.expectedStatuses.join("/")}, got ${response.status}`,
      bytes: Buffer.byteLength(text),
      latencyMs,
      ttfbMs,
      completedAtMs: performance.now()
    };
  } catch (error) {
    return {
      iteration,
      status: 0,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      bytes: 0,
      latencyMs: performance.now() - startedAt,
      ttfbMs: null,
      completedAtMs: performance.now()
    };
  }
}

function summarizeScenario({ scenario, samples, durationMs, thresholds }) {
  const latencies = samples.map((sample) => sample.latencyMs);
  const ttfbs = samples.map((sample) => sample.ttfbMs).filter((value) => Number.isFinite(value));
  const statusCounts = countBy(samples, (sample) => String(sample.status));
  const errors = samples.filter((sample) => !sample.ok);
  const threshold = {
    ...thresholds.default,
    ...(thresholds.endpoints?.[scenario.id] ?? {})
  };
  const latency = percentileSummary(latencies);
  const ttfb = percentileSummary(ttfbs);
  const durationSec = Math.max(durationMs / 1000, 0.001);
  const sustainedRps = samples.length / durationSec;
  const peakRps = calculatePeakRps(samples);
  const errorRatePct = (errors.length / samples.length) * 100;
  const violations = [];

  if (latency.p99Ms > threshold.p99LatencyMs) {
    violations.push(`p99 ${formatNumber(latency.p99Ms)}ms exceeds ${threshold.p99LatencyMs}ms`);
  }
  if (errorRatePct > threshold.errorRatePct) {
    violations.push(`error rate ${formatNumber(errorRatePct)}% exceeds ${threshold.errorRatePct}%`);
  }
  if (threshold.minSustainedRps && sustainedRps < threshold.minSustainedRps) {
    violations.push(`sustained RPS ${formatNumber(sustainedRps)} below ${threshold.minSustainedRps}`);
  }

  return {
    id: scenario.id,
    name: scenario.name,
    method: scenario.method,
    path: scenario.path,
    expectedStatuses: scenario.expectedStatuses,
    samples: samples.length,
    statusCounts,
    latency,
    ttfb,
    sustainedRps: round(sustainedRps),
    peakRps: round(peakRps),
    errorRatePct: round(errorRatePct),
    bytesTotal: samples.reduce((total, sample) => total + sample.bytes, 0),
    threshold,
    gate: violations.length === 0 ? "pass" : "fail",
    violations,
    errors: errors.slice(0, 5).map((sample) => ({
      iteration: sample.iteration,
      status: sample.status,
      error: sample.error
    }))
  };
}

function percentileSummary(values) {
  if (values.length === 0) {
    return { p50Ms: 0, p95Ms: 0, p99Ms: 0, minMs: 0, maxMs: 0 };
  }
  const sorted = [...values].sort((a, b) => a - b);
  return {
    p50Ms: round(percentile(sorted, 50)),
    p95Ms: round(percentile(sorted, 95)),
    p99Ms: round(percentile(sorted, 99)),
    minMs: round(sorted[0]),
    maxMs: round(sorted[sorted.length - 1])
  };
}

function percentile(sorted, p) {
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[index];
}

function countBy(values, keyFn) {
  return values.reduce((counts, value) => {
    const key = keyFn(value);
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
}

function calculatePeakRps(samples) {
  if (samples.length === 0) {
    return 0;
  }
  const first = Math.min(...samples.map((sample) => sample.completedAtMs));
  const buckets = new Map();
  for (const sample of samples) {
    const bucket = Math.floor((sample.completedAtMs - first) / 1000);
    buckets.set(bucket, (buckets.get(bucket) ?? 0) + 1);
  }
  return Math.max(...buckets.values());
}

function buildReport({ startedAt, endedAt, target, config, thresholds, endpointResults }) {
  const violations = endpointResults.flatMap((endpoint) => endpoint.violations.map((violation) => ({
    endpoint: endpoint.id,
    violation
  })));

  return {
    schemaVersion: 1,
    generatedAt: endedAt.toISOString(),
    mode: config.mode,
    target: {
      label: target.label,
      baseUrl: target.label === "external" ? target.baseUrl : "local-in-process"
    },
    environment: collectEnvironment(),
    config: {
      requestsPerEndpoint: config.requestsPerEndpoint,
      concurrency: config.concurrency,
      warmupRequests: config.warmupRequests,
      thresholdsPath: config.thresholdsPath
    },
    summary: {
      endpoints: endpointResults.length,
      requests: endpointResults.reduce((total, endpoint) => total + endpoint.samples, 0),
      failedGateCount: violations.length,
      durationMs: round(endedAt.getTime() - startedAt.getTime())
    },
    thresholds,
    endpoints: endpointResults,
    violations
  };
}

function collectEnvironment() {
  const cpus = os.cpus();
  return {
    node: process.version,
    platform: process.platform,
    arch: process.arch,
    cpuModel: cpus[0]?.model ?? "unknown",
    cpuCount: cpus.length,
    totalMemoryMb: Math.round(os.totalmem() / 1024 / 1024),
    freeMemoryMb: Math.round(os.freemem() / 1024 / 1024),
    network: "loopback for local-in-process benchmarks unless BENCHMARK_TARGET_URL is set"
  };
}

async function writeReports(report, outputDir) {
  const absoluteOutputDir = path.resolve(rootDir, outputDir);
  await mkdir(absoluteOutputDir, { recursive: true });

  const stamp = report.generatedAt.replace(/[:.]/g, "-");
  const jsonPath = path.join(absoluteOutputDir, `api-benchmark-${stamp}.json`);
  const markdownPath = path.join(absoluteOutputDir, `api-benchmark-${stamp}.md`);
  const latestJsonPath = path.join(absoluteOutputDir, "latest.json");
  const latestMarkdownPath = path.join(absoluteOutputDir, "latest.md");

  await writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
  await writeFile(markdownPath, renderMarkdown(report));
  await writeFile(latestJsonPath, `${JSON.stringify(report, null, 2)}\n`);
  await writeFile(latestMarkdownPath, renderMarkdown(report));

  report.output = {
    json: path.relative(rootDir, jsonPath),
    markdown: path.relative(rootDir, markdownPath),
    latestJson: path.relative(rootDir, latestJsonPath),
    latestMarkdown: path.relative(rootDir, latestMarkdownPath)
  };
}

function renderMarkdown(report) {
  const rows = report.endpoints.map((endpoint) => [
    endpoint.id,
    endpoint.method,
    endpoint.path,
    formatStatusCounts(endpoint.statusCounts),
    `${formatNumber(endpoint.latency.p50Ms)} / ${formatNumber(endpoint.latency.p95Ms)} / ${formatNumber(endpoint.latency.p99Ms)}`,
    formatNumber(endpoint.ttfb.p95Ms),
    formatNumber(endpoint.sustainedRps),
    formatNumber(endpoint.peakRps),
    `${formatNumber(endpoint.errorRatePct)}%`,
    endpoint.gate
  ]);

  const violationLines = report.violations.length === 0
    ? "No threshold violations.\n"
    : report.violations.map((item) => `- ${item.endpoint}: ${item.violation}`).join("\n") + "\n";

  return `# API Benchmark Summary\n\n` +
    `Generated: ${report.generatedAt}\n\n` +
    `Mode: ${report.mode}\n\n` +
    `Target: ${report.target.label}\n\n` +
    `Node: ${report.environment.node} on ${report.environment.platform}/${report.environment.arch}\n\n` +
    `Requests per endpoint: ${report.config.requestsPerEndpoint}; concurrency: ${report.config.concurrency}; warmup requests: ${report.config.warmupRequests}\n\n` +
    `| Endpoint | Method | Path | Statuses | Latency p50/p95/p99 ms | TTFB p95 ms | Sustained RPS | Peak RPS | Error rate | Gate |\n` +
    `|---|---|---|---:|---:|---:|---:|---:|---:|---|\n` +
    rows.map((row) => `| ${row.join(" | ")} |`).join("\n") +
    `\n\n## Gate Violations\n\n${violationLines}`;
}

function renderConsoleSummary(report) {
  const lines = [
    `API benchmark ${report.mode} run complete`,
    `Target: ${report.target.label}`,
    `Endpoints: ${report.summary.endpoints}`,
    `Requests: ${report.summary.requests}`,
    `Gate violations: ${report.summary.failedGateCount}`,
    `JSON: ${report.output.json}`,
    `Markdown: ${report.output.markdown}`,
    ""
  ];
  return lines.join("\n");
}

function formatStatusCounts(statusCounts) {
  return Object.entries(statusCounts)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([status, count]) => `${status}:${count}`)
    .join(", ");
}

function formatNumber(value) {
  return Number.isFinite(value) ? String(round(value)) : "0";
}

function round(value) {
  return Math.round(value * 100) / 100;
}
