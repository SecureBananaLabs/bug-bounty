#!/usr/bin/env node
import autocannon from "autocannon";
import jwt from "jsonwebtoken";
import { readFileSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";
import { endpoints } from "./endpoints.mjs";

const benchmarkDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(benchmarkDir, "..");

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

async function main() {
  loadDotEnv(path.join(repoRoot, ".env.benchmark"));

  const args = parseArgs(process.argv.slice(2));
  const smoke = args.smoke === true || process.env.BENCHMARK_MODE === "smoke";
  const thresholds = await readJson(path.join(benchmarkDir, "thresholds.json"));
  const config = buildConfig(args, smoke);

  console.log(`\nBenchmark target: ${config.target}`);
  console.log(`Mode: ${config.mode}; endpoints: ${endpoints.length}; requests per endpoint: ${config.amount}\n`);

  await assertTargetReachable(config.target);

  const results = [];
  for (const endpoint of endpoints) {
    const benchmark = await runEndpointBenchmark(endpoint, config);
    results.push(benchmark);
    console.log(formatConsoleLine(benchmark));
  }

  const thresholdedResults = results.map((result) => applyThresholds(result, thresholds));
  const report = {
    generatedAt: new Date().toISOString(),
    mode: config.mode,
    target: config.target,
    config: {
      connections: config.connections,
      requestsPerEndpoint: config.amount,
      timeoutSeconds: config.timeoutSeconds,
      failOnThreshold: config.failOnThreshold
    },
    environment: getEnvironmentSummary(),
    endpoints: thresholdedResults
  };

  await mkdir(config.outputDir, { recursive: true });
  const jsonPath = path.join(config.outputDir, "latest.json");
  const markdownPath = path.join(config.outputDir, "latest.md");
  await writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
  await writeFile(markdownPath, renderMarkdown(report));

  console.log(`\nWrote ${path.relative(repoRoot, jsonPath)}`);
  console.log(`Wrote ${path.relative(repoRoot, markdownPath)}`);

  const failures = thresholdedResults.filter((result) => !result.thresholds.passed);
  if (config.failOnThreshold && failures.length > 0) {
    console.error("\nBenchmark thresholds failed:");
    for (const failure of failures) {
      console.error(`  - ${failure.id}: ${failure.thresholds.failures.join("; ")}`);
    }
    process.exitCode = 1;
  }
}

function buildConfig(args, smoke) {
  const target = args.target ?? process.env.BENCHMARK_TARGET ?? "http://127.0.0.1:4000";
  const outputDir = path.resolve(
    repoRoot,
    args.outputDir ?? process.env.BENCHMARK_OUTPUT_DIR ?? "benchmarks/results"
  );
  const jwtSecret = process.env.BENCHMARK_JWT_SECRET ?? process.env.JWT_SECRET ?? "development-secret";
  const authToken =
    process.env.BENCHMARK_AUTH_TOKEN ??
    jwt.sign(
      {
        sub: "benchmark-admin",
        role: "admin",
        scope: "api-benchmark",
        aud: "freelanceflow-api"
      },
      jwtSecret,
      { expiresIn: "10m" }
    );

  return {
    target: trimTrailingSlash(target),
    outputDir,
    authToken,
    mode: smoke ? "smoke" : "full",
    connections: toPositiveInt(process.env.BENCHMARK_CONNECTIONS, smoke ? 1 : 2),
    amount: toPositiveInt(process.env.BENCHMARK_REQUESTS_PER_ENDPOINT, smoke ? 2 : 8),
    timeoutSeconds: toPositiveInt(process.env.BENCHMARK_TIMEOUT_SECONDS, 10),
    failOnThreshold: process.env.BENCHMARK_FAIL_ON_THRESHOLD !== "false"
  };
}

async function runEndpointBenchmark(endpoint, config) {
  const request = buildRequest(endpoint, config);
  const ttfb = await measureTtfb(request, endpoint.expectedStatuses);
  const autocannonResult = await autocannon({
    url: request.url,
    method: endpoint.method,
    connections: config.connections,
    amount: config.amount,
    timeout: config.timeoutSeconds,
    headers: request.headers,
    body: request.body
  });

  const totalRequests = autocannonResult.requests.total || config.amount;
  const failedRequests =
    (autocannonResult.errors ?? 0) +
    (autocannonResult.timeouts ?? 0) +
    (autocannonResult.non2xx ?? 0);

  return {
    id: `${endpoint.method} ${endpoint.path}`,
    name: endpoint.name,
    method: endpoint.method,
    path: endpoint.path,
    expectedStatuses: endpoint.expectedStatuses,
    statusCode: ttfb.status,
    ttfbMs: round(ttfb.ms),
    latencyMs: {
      p50: metric(autocannonResult.latency, ["p50", "average", "mean"]),
      p95: metric(autocannonResult.latency, ["p95", "p90", "p99", "max"]),
      p99: metric(autocannonResult.latency, ["p99", "max"]),
      max: metric(autocannonResult.latency, ["max", "p99"])
    },
    requestsPerSecond: {
      sustained: metric(autocannonResult.requests, ["average", "mean"]),
      peak: metric(autocannonResult.requests, ["max", "p99", "average", "mean"])
    },
    errorRatePct: round((failedRequests / totalRequests) * 100),
    totals: {
      requests: totalRequests,
      errors: autocannonResult.errors ?? 0,
      timeouts: autocannonResult.timeouts ?? 0,
      non2xx: autocannonResult.non2xx ?? 0
    },
    statusCodes: autocannonResult.statusCodeStats || {},
    auth: endpoint.auth === true
  };
}

async function assertTargetReachable(target) {
  try {
    const response = await fetch(new URL("/health", `${target}/`), { method: "GET" });
    if (!response.ok) {
      throw new Error(`health check returned ${response.status}`);
    }
  } catch (error) {
    throw new Error(
      `Benchmark target is not reachable at ${target}. Start the API first or set BENCHMARK_TARGET. (${error.message})`
    );
  }
}

function buildRequest(endpoint, config) {
  const headers = { ...(endpoint.headers ?? {}) };
  let body = endpoint.body;

  if (endpoint.json) {
    headers["content-type"] = "application/json";
    body = JSON.stringify(endpoint.json);
  }

  if (endpoint.auth) {
    headers.authorization = `Bearer ${config.authToken}`;
  }

  return {
    method: endpoint.method,
    url: new URL(endpoint.path, `${config.target}/`).toString(),
    headers,
    body
  };
}

async function measureTtfb(request, expectedStatuses) {
  const start = performance.now();
  const response = await fetch(request.url, {
    method: request.method,
    headers: request.headers,
    body: request.body
  });
  const ms = performance.now() - start;
  await response.arrayBuffer();

  return {
    ms,
    status: response.status,
    expected: expectedStatuses.includes(response.status)
  };
}

function applyThresholds(result, thresholds) {
  const endpointThresholds = {
    ...thresholds.defaults,
    ...(thresholds.endpoints?.[result.id] ?? {})
  };
  const failures = [];

  if (result.latencyMs.p99 > endpointThresholds.p99LatencyMs) {
    failures.push(`p99 ${result.latencyMs.p99}ms > ${endpointThresholds.p99LatencyMs}ms`);
  }
  if (result.ttfbMs > endpointThresholds.ttfbMs) {
    failures.push(`TTFB ${result.ttfbMs}ms > ${endpointThresholds.ttfbMs}ms`);
  }
  if (result.errorRatePct > endpointThresholds.errorRatePct) {
    failures.push(`error rate ${result.errorRatePct}% > ${endpointThresholds.errorRatePct}%`);
  }
  if (!result.expectedStatuses.includes(result.statusCode)) {
    failures.push(`probe status ${result.statusCode} not in ${result.expectedStatuses.join(", ")}`);
  }

  return {
    ...result,
    thresholds: {
      ...endpointThresholds,
      passed: failures.length === 0,
      failures
    }
  };
}

function renderMarkdown(report) {
  const lines = [
    "# API Benchmark Report",
    "",
    `Generated: ${report.generatedAt}`,
    `Mode: ${report.mode}`,
    `Target: ${report.target}`,
    "",
    "## Environment",
    "",
    `- CPU model & cores: ${report.environment.cpuModel} (${report.environment.cpuCores})`,
    `- RAM total / free: ${report.environment.totalMemoryGb} GB / ${report.environment.freeMemoryGb} GB`,
    `- OS: ${report.environment.platform} ${report.environment.release}`,
    `- Node.js: ${report.environment.nodeVersion}`,
    `- Network: loopback/local or configured target host`,
    "",
    "## Results",
    "",
    "| Endpoint | p50 ms | p95 ms | p99 ms | TTFB ms | Sustained RPS | Peak RPS | Error % | Status | Gate |",
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |"
  ];

  for (const endpoint of report.endpoints) {
    lines.push(
      `| \`${endpoint.id}\` | ${endpoint.latencyMs.p50} | ${endpoint.latencyMs.p95} | ${endpoint.latencyMs.p99} | ${endpoint.ttfbMs} | ${endpoint.requestsPerSecond.sustained} | ${endpoint.requestsPerSecond.peak} | ${endpoint.errorRatePct} | ${endpoint.statusCode} | ${endpoint.thresholds.passed ? "PASS" : `FAIL: ${endpoint.thresholds.failures.join("; ")}`} |`
    );
  }

  lines.push(
    "",
    "## Thresholds",
    "",
    "Thresholds are loaded from `benchmarks/thresholds.json`. The CI smoke run fails on threshold regressions so reviewers can tune the values in code review."
  );

  return `${lines.join("\n")}\n`;
}

function formatConsoleLine(result) {
  return `  ${result.id}: p99=${round(result.latencyMs.p99)}ms, ttfb=${round(result.ttfbMs)}ms, rps=${round(result.requestsPerSecond.sustained)}, errors=${result.errorRatePct}%`;
}

function getEnvironmentSummary() {
  const firstCpu = os.cpus()[0];
  return {
    cpuModel: firstCpu?.model ?? "unknown",
    cpuCores: os.cpus().length,
    totalMemoryGb: round(os.totalmem() / 1024 ** 3),
    freeMemoryGb: round(os.freemem() / 1024 ** 3),
    platform: os.platform(),
    release: os.release(),
    nodeVersion: process.version
  };
}

function parseArgs(args) {
  return args.reduce((parsed, arg) => {
    if (arg === "--smoke") {
      parsed.smoke = true;
      return parsed;
    }

    const [key, value] = arg.replace(/^--/, "").split("=");
    if (key === "target") parsed.target = value;
    if (key === "output-dir") parsed.outputDir = value;
    return parsed;
  }, {});
}

function loadDotEnv(filePath) {
  try {
    const content = readFileSync(filePath, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
      const [key, ...valueParts] = trimmed.split("=");
      if (process.env[key] === undefined) {
        process.env[key] = valueParts.join("=").replace(/^['"]|['"]$/g, "");
      }
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

function toPositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function trimTrailingSlash(value) {
  return value.replace(/\/+$/, "");
}

function metric(source, keys) {
  for (const key of keys) {
    const value = Number(source?.[key]);
    if (Number.isFinite(value)) return round(value);
  }
  return 0;
}

function round(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.round((numeric + Number.EPSILON) * 100) / 100;
}
