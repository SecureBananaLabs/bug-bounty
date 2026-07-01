#!/usr/bin/env node
import fs from "node:fs/promises";
import http from "node:http";
import https from "node:https";
import os from "node:os";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = new Set(process.argv.slice(2));
const smoke = args.has("--smoke");
const targetUrl = process.env.BENCHMARK_TARGET_URL ?? "http://127.0.0.1:4000";
const requestsPerEndpoint = Number(process.env.BENCHMARK_REQUESTS ?? (smoke ? 3 : 8));
const concurrency = Number(process.env.BENCHMARK_CONCURRENCY ?? (smoke ? 1 : 2));
const warmupRequests = Number(process.env.BENCHMARK_WARMUP_REQUESTS ?? 1);
const resultsDir = resolve(rootDir, process.env.BENCHMARK_RESULTS_DIR ?? "benchmarks/results");
const shouldStartServer = process.env.BENCHMARK_START_SERVER !== "0";

async function readJson(path) {
  return JSON.parse(await fs.readFile(resolve(rootDir, path), "utf8"));
}

function percentile(sorted, percentileValue) {
  if (sorted.length === 0) return 0;
  const index = Math.min(sorted.length - 1, Math.ceil((percentileValue / 100) * sorted.length) - 1);
  return Number(sorted[index].toFixed(2));
}

function payloadFor(endpoint) {
  if (endpoint.multipart) {
    const boundary = `benchmark-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const { field, filename, contentType, body } = endpoint.multipart;
    const payload = Buffer.from(
      [
        `--${boundary}`,
        `Content-Disposition: form-data; name="${field}"; filename="${filename}"`,
        `Content-Type: ${contentType}`,
        "",
        body,
        `--${boundary}--`,
        ""
      ].join("\r\n")
    );
    return {
      body: payload,
      headers: {
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
        "Content-Length": String(payload.length)
      }
    };
  }

  if (endpoint.payload === undefined) {
    return { body: undefined, headers: {} };
  }

  const body = Buffer.from(JSON.stringify(endpoint.payload));
  return {
    body,
    headers: {
      "Content-Type": "application/json",
      "Content-Length": String(body.length)
    }
  };
}

function requestOnce(endpoint, authToken) {
  const url = new URL(endpoint.path, targetUrl);
  const transport = url.protocol === "https:" ? https : http;
  const { body, headers } = payloadFor(endpoint);
  const startedAt = performance.now();
  let firstByteAt;

  return new Promise((resolveRequest) => {
    const request = transport.request(
      url,
      {
        method: endpoint.method,
        headers: {
          ...headers,
          ...(endpoint.auth && authToken ? { Authorization: `Bearer ${authToken}` } : {})
        }
      },
      (response) => {
        response.once("data", () => {
          firstByteAt ??= performance.now();
        });
        response.resume();
        response.on("end", () => {
          const endedAt = performance.now();
          resolveRequest({
            statusCode: response.statusCode ?? 0,
            latencyMs: endedAt - startedAt,
            ttfbMs: (firstByteAt ?? endedAt) - startedAt,
            ok: (response.statusCode ?? 0) >= 200 && (response.statusCode ?? 0) < 400,
            finishedAt: endedAt
          });
        });
      }
    );

    request.setTimeout(10_000, () => request.destroy(new Error("request timeout")));
    request.on("error", (error) => {
      const endedAt = performance.now();
      resolveRequest({
        statusCode: 0,
        latencyMs: endedAt - startedAt,
        ttfbMs: 0,
        ok: false,
        error: error.message,
        finishedAt: endedAt
      });
    });
    if (body) request.write(body);
    request.end();
  });
}

async function setupAuthToken(authEndpoint) {
  if (process.env.BENCHMARK_AUTH_TOKEN) {
    return process.env.BENCHMARK_AUTH_TOKEN;
  }

  const unique = Date.now();
  const registerEndpoint = {
    ...authEndpoint,
    payload: {
      email: process.env.BENCHMARK_AUTH_EMAIL ?? `benchmark-admin-${unique}@example.com`,
      password: process.env.BENCHMARK_AUTH_PASSWORD ?? "benchmark-password",
      role: "admin"
    }
  };

  const response = await fetch(new URL(registerEndpoint.path, targetUrl), {
    method: registerEndpoint.method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(registerEndpoint.payload)
  });
  const json = await response.json();
  return json?.data?.token ?? "";
}

async function runEndpoint(endpoint, authToken) {
  for (let i = 0; i < warmupRequests; i += 1) {
    await requestOnce(endpoint, authToken);
  }

  const startedAt = performance.now();
  const results = [];
  let next = 0;

  async function worker() {
    while (next < requestsPerEndpoint) {
      next += 1;
      results.push(await requestOnce(endpoint, authToken));
    }
  }

  await Promise.all(Array.from({ length: concurrency }, worker));
  const endedAt = performance.now();
  const latencies = results.map((result) => result.latencyMs).sort((a, b) => a - b);
  const ttfb = results.map((result) => result.ttfbMs).sort((a, b) => a - b);
  const failures = results.filter((result) => !result.ok);
  const durationSeconds = Math.max(0.001, (endedAt - startedAt) / 1000);

  return {
    name: endpoint.name,
    method: endpoint.method,
    path: endpoint.path,
    requests: results.length,
    concurrency,
    statusCodes: results.reduce((acc, result) => {
      acc[result.statusCode] = (acc[result.statusCode] ?? 0) + 1;
      return acc;
    }, {}),
    p50Ms: percentile(latencies, 50),
    p95Ms: percentile(latencies, 95),
    p99Ms: percentile(latencies, 99),
    ttfbP50Ms: percentile(ttfb, 50),
    sustainedRps: Number((results.length / durationSeconds).toFixed(2)),
    peakRps: Number((results.length / durationSeconds).toFixed(2)),
    errorRatePercent: Number(((failures.length / Math.max(1, results.length)) * 100).toFixed(2)),
    errors: [...new Set(failures.map((result) => result.error).filter(Boolean))]
  };
}

function thresholdFor(thresholds, result) {
  return {
    ...thresholds.defaults,
    ...(smoke ? thresholds.smoke : {}),
    ...(thresholds.routes?.[result.name] ?? {})
  };
}

function evaluateThresholds(thresholds, results) {
  return results.map((result) => {
    const threshold = thresholdFor(thresholds, result);
    return {
      name: result.name,
      passed: result.p99Ms <= threshold.p99Ms && result.errorRatePercent <= threshold.errorRatePercent,
      p99Ms: result.p99Ms,
      maxP99Ms: threshold.p99Ms,
      errorRatePercent: result.errorRatePercent,
      maxErrorRatePercent: threshold.errorRatePercent
    };
  });
}

function markdownReport(summary, gates) {
  const rows = summary.results
    .map((result) => {
      const gate = gates.find((item) => item.name === result.name);
      return [
        result.name,
        `${result.method} ${result.path}`,
        result.requests,
        result.p50Ms,
        result.p95Ms,
        result.p99Ms,
        result.ttfbP50Ms,
        result.sustainedRps,
        result.errorRatePercent,
        gate?.passed ? "pass" : "fail"
      ].join(" | ");
    })
    .join("\n");

  return [
    "# API Benchmark Summary",
    "",
    `Mode: ${summary.mode}`,
    `Target: ${summary.targetUrl}`,
    `Requests per endpoint: ${summary.requestsPerEndpoint}`,
    `Concurrency: ${summary.concurrency}`,
    `Warmup requests per endpoint: ${summary.warmupRequests}`,
    `Generated: ${summary.generatedAt}`,
    "",
    "Endpoint | Route | Requests | p50 ms | p95 ms | p99 ms | TTFB p50 ms | RPS | Error % | Gate",
    "--- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---",
    rows,
    "",
    "## Benchmark Environment",
    "",
    `- CPU: ${summary.environment.cpuModel}, ${summary.environment.cpuCount} cores`,
    `- RAM: ${summary.environment.totalMemoryGiB} GiB total`,
    `- Network: ${summary.environment.network}`,
    `- OS: ${summary.environment.os}`,
    `- Node.js: ${summary.environment.node}`,
    `- Agent: ${summary.environment.agent}`,
    "",
    "Thresholds are read from `benchmarks/thresholds.json`."
  ].join("\n");
}

function environmentSummary() {
  const cpus = os.cpus();
  return {
    cpuModel: cpus[0]?.model ?? "unknown",
    cpuCount: cpus.length,
    totalMemoryGiB: Number((os.totalmem() / 1024 ** 3).toFixed(1)),
    network: new URL(targetUrl).hostname === "127.0.0.1" ? "loopback" : "configured target host",
    os: `${os.type()} ${os.release()} ${os.arch()}`,
    node: process.version,
    agent: process.env.BENCHMARK_AGENT ?? "not specified"
  };
}

async function startLocalServer() {
  if (!shouldStartServer) return null;
  const { createApp } = await import("../apps/api/src/app.js");
  const app = createApp();
  const parsedTarget = new URL(targetUrl);
  const port = Number(parsedTarget.port || 4000);
  return new Promise((resolveServer) => {
    const server = app.listen(port, parsedTarget.hostname, () => resolveServer(server));
  });
}

async function main() {
  const endpoints = await readJson("benchmarks/endpoints.json");
  const thresholds = await readJson("benchmarks/thresholds.json");
  await fs.mkdir(resultsDir, { recursive: true });

  const server = await startLocalServer();
  try {
    const authEndpoint = endpoints.find((endpoint) => endpoint.name === "auth.register");
    const authToken = await setupAuthToken(authEndpoint);
    const results = [];
    for (const endpoint of endpoints) {
      results.push(await runEndpoint(endpoint, authToken));
    }

    const summary = {
      mode: smoke ? "smoke" : "full",
      targetUrl,
      requestsPerEndpoint,
      concurrency,
      warmupRequests,
      generatedAt: new Date().toISOString(),
      environment: environmentSummary(),
      results
    };
    const gates = evaluateThresholds(thresholds, results);
    const report = markdownReport(summary, gates);
    await fs.writeFile(join(resultsDir, "latest.json"), JSON.stringify({ ...summary, gates }, null, 2));
    await fs.writeFile(join(resultsDir, "latest.md"), report);

    console.log(report);
    const failed = gates.filter((gate) => !gate.passed);
    if (failed.length > 0) {
      console.error(`\nBenchmark threshold failures: ${failed.map((gate) => gate.name).join(", ")}`);
      process.exitCode = 1;
    }
  } finally {
    if (server) {
      await new Promise((resolveClose) => server.close(resolveClose));
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
