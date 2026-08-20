#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";
import { endpoints } from "./endpoints.mjs";

const benchmarkDir = path.dirname(fileURLToPath(import.meta.url));
const resultsDir = path.join(benchmarkDir, "results");
const isSmoke = process.argv.includes("--smoke");
const startedAt = new Date();
const runId = startedAt.toISOString().replace(/[:.]/g, "-");

const config = {
  concurrency: readNumberEnv("BENCHMARK_CONCURRENCY", isSmoke ? 1 : 4),
  requestsPerEndpoint: readNumberEnv("BENCHMARK_REQUESTS_PER_ENDPOINT", isSmoke ? 2 : 8),
  timeoutMs: readNumberEnv("BENCHMARK_TIMEOUT_MS", 10_000)
};

const thresholds = JSON.parse(
  await readFile(path.join(benchmarkDir, "thresholds.json"), "utf8")
);

let localServer;
let targetUrl = process.env.BENCHMARK_TARGET_URL?.replace(/\/+$/, "");
let targetMode = "external";
let routeInventory = [];

try {
  process.env.NODE_ENV ??= "benchmark";
  process.env.JWT_SECRET ??= "benchmark-secret-for-local-benchmark";
  const { createApp } = await import("../apps/api/src/app.js");
  const app = createApp();
  routeInventory = inventoryRoutes(app);

  if (!targetUrl) {
    process.env.BENCHMARK_DISABLE_RATE_LIMIT ??= "true";
    localServer = await listen(app);
    targetUrl = `http://127.0.0.1:${localServer.address().port}`;
    targetMode = "local-app";
  }

  const authToken = await getBenchmarkToken();
  const endpointSummaries = [];

  for (const endpoint of endpoints) {
    endpointSummaries.push(await runEndpoint(endpoint, targetUrl, authToken));
  }

  const violations = collectViolations(endpointSummaries);
  const result = {
    runId,
    startedAt: startedAt.toISOString(),
    finishedAt: new Date().toISOString(),
    smoke: isSmoke,
    targetMode,
    targetUrl,
    config,
    environment: readEnvironment(),
    routeCoverage: calculateRouteCoverage(routeInventory, endpoints),
    thresholds,
    endpoints: endpointSummaries,
    passed: violations.length === 0,
    violations
  };

  await writeResults(result);

  if (violations.length > 0) {
    for (const violation of violations) {
      console.error(
        `[benchmark] ${violation.endpoint}: ${violation.metric} ${violation.actual} exceeded ${violation.limit}`
      );
    }
    process.exitCode = 1;
  }
} finally {
  if (localServer) {
    await new Promise((resolve, reject) => {
      localServer.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function listen(app) {
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  return server;
}

async function getBenchmarkToken() {
  if (process.env.BENCHMARK_AUTH_TOKEN) return process.env.BENCHMARK_AUTH_TOKEN;

  const { signAccessToken } = await import("../apps/api/src/utils/jwt.js");
  return signAccessToken({
    sub: "usr_benchmark_admin",
    role: "admin",
    purpose: "api-benchmark"
  });
}

async function runEndpoint(endpoint, baseUrl, authToken) {
  const requestCount = endpoint.requests ?? config.requestsPerEndpoint;
  const samples = [];
  let nextRequest = 0;
  const started = performance.now();
  const workers = Array.from(
    { length: Math.min(config.concurrency, requestCount) },
    async () => {
      while (nextRequest < requestCount) {
        const requestId = nextRequest;
        nextRequest += 1;
        samples.push(await executeRequest(endpoint, baseUrl, authToken, requestId, started));
      }
    }
  );

  await Promise.all(workers);
  const elapsedMs = performance.now() - started;
  return summarizeEndpoint(endpoint, samples, elapsedMs);
}

async function executeRequest(endpoint, baseUrl, authToken, requestId, endpointStartedAt) {
  const request = buildRequest(endpoint, baseUrl, authToken, requestId);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);
  const started = performance.now();

  try {
    const response = await fetch(request.url, {
      ...request.options,
      signal: controller.signal
    });
    const ttfbMs = performance.now() - started;
    await response.arrayBuffer();
    const latencyMs = performance.now() - started;
    const expectedStatuses = Array.isArray(endpoint.expectedStatus)
      ? endpoint.expectedStatus
      : [endpoint.expectedStatus ?? 200];

    return {
      requestId,
      status: response.status,
      latencyMs,
      ttfbMs,
      error: null,
      expected: expectedStatuses.includes(response.status),
      failed: response.status >= 500,
      completedAtMs: performance.now() - endpointStartedAt
    };
  } catch (error) {
    const latencyMs = performance.now() - started;
    return {
      requestId,
      status: "NETWORK_ERROR",
      latencyMs,
      ttfbMs: null,
      error: error.name === "AbortError" ? "Request timed out" : error.message,
      expected: false,
      failed: true,
      completedAtMs: performance.now() - endpointStartedAt
    };
  } finally {
    clearTimeout(timeout);
  }
}

function buildRequest(endpoint, baseUrl, authToken, requestId) {
  const url = new URL(endpoint.path, `${baseUrl}/`);
  for (const [key, value] of Object.entries(endpoint.query ?? {})) {
    url.searchParams.set(key, interpolate(value, requestId));
  }

  const headers = { ...(endpoint.headers ?? {}) };
  const options = {
    method: endpoint.method,
    headers
  };

  if (endpoint.auth === "benchmark-admin") {
    headers.authorization = `Bearer ${authToken}`;
  }

  if (endpoint.json) {
    headers["content-type"] = "application/json";
    options.body = JSON.stringify(interpolate(endpoint.json, requestId));
  }

  if (endpoint.form) {
    const form = new FormData();
    for (const [key, value] of Object.entries(endpoint.form)) {
      if (value?.content !== undefined) {
        form.append(
          key,
          new Blob([interpolate(value.content, requestId)], { type: value.type ?? "text/plain" }),
          value.name ?? key
        );
      } else {
        form.append(key, interpolate(value, requestId));
      }
    }
    options.body = form;
  }

  return { url, options };
}

function interpolate(value, requestId) {
  if (typeof value === "string") {
    return value
      .replaceAll("{{runId}}", runId)
      .replaceAll("{{requestId}}", String(requestId));
  }

  if (Array.isArray(value)) {
    return value.map((item) => interpolate(item, requestId));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [key, interpolate(child, requestId)])
    );
  }

  return value;
}

function summarizeEndpoint(endpoint, samples, elapsedMs) {
  const latency = samples.map((sample) => sample.latencyMs);
  const ttfb = samples
    .map((sample) => sample.ttfbMs)
    .filter((value) => Number.isFinite(value));
  const statusCounts = {};

  for (const sample of samples) {
    const key = String(sample.status);
    statusCounts[key] = (statusCounts[key] ?? 0) + 1;
  }

  const failedCount = samples.filter((sample) => sample.failed).length;
  const unexpectedCount = samples.filter((sample) => !sample.expected).length;

  return {
    id: endpoint.id,
    method: endpoint.method,
    path: endpoint.path,
    description: endpoint.description,
    requests: samples.length,
    elapsedMs: round(elapsedMs),
    latencyMs: {
      p50: round(percentile(latency, 50)),
      p95: round(percentile(latency, 95)),
      p99: round(percentile(latency, 99))
    },
    ttfbMs: {
      p95: round(percentile(ttfb, 95))
    },
    rps: {
      sustained: round(samples.length / (elapsedMs / 1000)),
      peak: round(calculatePeakRps(samples))
    },
    errorRatePercent: round((failedCount / samples.length) * 100),
    unexpectedStatusPercent: round((unexpectedCount / samples.length) * 100),
    statusCounts,
    sampleErrors: samples
      .filter((sample) => sample.error)
      .slice(0, 3)
      .map((sample) => sample.error)
  };
}

function calculatePeakRps(samples) {
  if (samples.length === 0) return 0;
  const buckets = new Map();
  for (const sample of samples) {
    const bucket = Math.floor(sample.completedAtMs / 1000);
    buckets.set(bucket, (buckets.get(bucket) ?? 0) + 1);
  }
  return Math.max(...buckets.values());
}

function inventoryRoutes(app) {
  const routes = [];
  for (const layer of app._router?.stack ?? []) {
    if (layer.route) {
      addRoute(routes, "", layer.route);
      continue;
    }

    if (layer.name === "router") {
      const prefix = routePrefixFromRegex(layer.regexp);
      for (const child of layer.handle?.stack ?? []) {
        if (child.route) addRoute(routes, prefix, child.route);
      }
    }
  }
  return routes.filter((route) => route.method && route.path);
}

function addRoute(routes, prefix, route) {
  for (const method of Object.keys(route.methods)) {
    routes.push({
      method: method.toUpperCase(),
      path: joinRoutePath(prefix, route.path)
    });
  }
}

function routePrefixFromRegex(regex) {
  return regex.source
    .replace(/^\^\\\//, "/")
    .replace(/\\\/\?\(\?=\\\/\|\$\)$/g, "")
    .replace(/\\\//g, "/");
}

function joinRoutePath(prefix, routePath) {
  if (!prefix) return routePath;
  if (!routePath || routePath === "/") return prefix;
  return `${prefix}${routePath}`;
}

function calculateRouteCoverage(inventory, configuredEndpoints) {
  const missing = inventory.filter(
    (route) =>
      !configuredEndpoints.some(
        (endpoint) => endpoint.method === route.method && pathMatchesPattern(endpoint.path, route.path)
      )
  );

  return {
    discoveredRoutes: inventory.length,
    configuredEndpoints: configuredEndpoints.length,
    coveredRoutes: inventory.length - missing.length,
    missing
  };
}

function pathMatchesPattern(actualPath, routePattern) {
  const expression = `^${routePattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/:[^/]+/g, "[^/]+")}$`;
  return new RegExp(expression).test(actualPath);
}

function percentile(values, percentileValue) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((percentileValue / 100) * sorted.length) - 1)
  );
  return sorted[index];
}

function collectViolations(endpointSummaries) {
  const violations = [];

  for (const endpoint of endpointSummaries) {
    const endpointThreshold = {
      ...thresholds.global,
      ...(thresholds.endpoints?.[endpoint.id] ?? {})
    };
    addViolationIfNeeded(
      violations,
      endpoint,
      "p99 latency ms",
      endpoint.latencyMs.p99,
      endpointThreshold.maxP99Ms
    );
    addViolationIfNeeded(
      violations,
      endpoint,
      "error rate percent",
      endpoint.errorRatePercent,
      endpointThreshold.maxErrorRatePercent
    );
    addViolationIfNeeded(
      violations,
      endpoint,
      "unexpected status percent",
      endpoint.unexpectedStatusPercent,
      endpointThreshold.maxUnexpectedStatusPercent
    );
  }

  return violations;
}

function addViolationIfNeeded(violations, endpoint, metric, actual, limit) {
  if (limit === undefined || actual <= limit) return;
  violations.push({
    endpoint: endpoint.id,
    metric,
    actual,
    limit
  });
}

async function writeResults(result) {
  await mkdir(resultsDir, { recursive: true });
  const json = `${JSON.stringify(result, null, 2)}\n`;
  const markdown = formatMarkdown(result);

  await Promise.all([
    writeFile(path.join(resultsDir, "latest.json"), json),
    writeFile(path.join(resultsDir, "latest.md"), markdown),
    writeFile(path.join(resultsDir, `api-benchmark-${runId}.json`), json),
    writeFile(path.join(resultsDir, `api-benchmark-${runId}.md`), markdown)
  ]);

  console.log(`Benchmark ${result.passed ? "passed" : "failed"}`);
  console.log(`JSON: ${path.relative(process.cwd(), path.join(resultsDir, "latest.json"))}`);
  console.log(`Markdown: ${path.relative(process.cwd(), path.join(resultsDir, "latest.md"))}`);
}

function formatMarkdown(result) {
  const lines = [
    "# API Benchmark Summary",
    "",
    `- Run ID: \`${result.runId}\``,
    `- Started: ${result.startedAt}`,
    `- Finished: ${result.finishedAt}`,
    `- Mode: ${result.smoke ? "smoke" : "full"} (${result.targetMode})`,
    `- Target: \`${result.targetUrl}\``,
    `- Concurrency: ${result.config.concurrency}`,
    `- Requests per endpoint: ${result.config.requestsPerEndpoint}`,
    `- Result: ${result.passed ? "PASS" : "FAIL"}`,
    `- Route coverage: ${result.routeCoverage.coveredRoutes}/${result.routeCoverage.discoveredRoutes} discovered routes covered`,
    "",
    "## Environment",
    "",
    `- CPU: ${result.environment.cpuModel} (${result.environment.cpuCount} logical cores)`,
    `- RAM: ${result.environment.totalMemoryGiB} GiB total, ${result.environment.freeMemoryGiB} GiB free at start`,
    `- OS: ${result.environment.platform} ${result.environment.release} ${result.environment.arch}`,
    `- Node.js: ${result.environment.node}`,
    "",
    "## Endpoint Results",
    "",
    "| Endpoint | Method | Requests | p50 ms | p95 ms | p99 ms | p95 TTFB ms | Sustained RPS | Peak RPS | Error % | Unexpected % | Statuses |",
    "| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |"
  ];

  for (const endpoint of result.endpoints) {
    lines.push(
      [
        `\`${endpoint.path}\``,
        endpoint.method,
        endpoint.requests,
        endpoint.latencyMs.p50,
        endpoint.latencyMs.p95,
        endpoint.latencyMs.p99,
        endpoint.ttfbMs.p95,
        endpoint.rps.sustained,
        endpoint.rps.peak,
        endpoint.errorRatePercent,
        endpoint.unexpectedStatusPercent,
        Object.entries(endpoint.statusCounts)
          .map(([status, count]) => `${status}: ${count}`)
          .join(", ")
      ].join(" | ").replace(/^/, "| ").replace(/$/, " |")
    );
  }

  if (result.violations.length > 0) {
    lines.push("", "## Threshold Violations", "");
    for (const violation of result.violations) {
      lines.push(
        `- ${violation.endpoint}: ${violation.metric} ${violation.actual} exceeded ${violation.limit}`
      );
    }
  }

  lines.push("");
  return `${lines.join("\n")}\n`;
}

function readEnvironment() {
  const cpus = os.cpus();
  return {
    cpuModel: cpus[0]?.model ?? "unknown",
    cpuCount: cpus.length,
    totalMemoryGiB: round(os.totalmem() / 1024 ** 3),
    freeMemoryGiB: round(os.freemem() / 1024 ** 3),
    platform: os.platform(),
    release: os.release(),
    arch: os.arch(),
    node: process.version
  };
}

function readNumberEnv(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function round(value) {
  return Math.round(value * 100) / 100;
}
