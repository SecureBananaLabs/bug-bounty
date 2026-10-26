import fs from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";

import { createApp } from "../apps/api/src/app.js";
import { signAccessToken } from "../apps/api/src/utils/jwt.js";
import { benchmarkRoutes } from "./routes.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const resultsDir = path.join(__dirname, "results");
const thresholdsPath = path.join(__dirname, "thresholds.json");

const isSmoke = process.argv.includes("--smoke");
const requestCount = Number(process.env.BENCHMARK_REQUESTS ?? (isSmoke ? 1 : 5));
const concurrency = Number(process.env.BENCHMARK_CONCURRENCY ?? (isSmoke ? 1 : 2));

function percentile(values, rank) {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((rank / 100) * sorted.length) - 1;
  return sorted[Math.min(Math.max(index, 0), sorted.length - 1)];
}

function round(value) {
  return Number(value.toFixed(2));
}

function buildHeaders(route, authToken) {
  const headers = {
    "user-agent": "freelance-platform-api-benchmark/1.0"
  };

  if (route.protected || authToken) {
    headers.authorization = `Bearer ${authToken}`;
  }

  if (!route.multipart && route.payload) {
    headers["content-type"] = "application/json";
  }

  return headers;
}

function buildRequest(route, authToken) {
  const request = {
    method: route.method,
    headers: buildHeaders(route, authToken)
  };

  if (route.multipart) {
    request.body = route.multipart();
    return request;
  }

  if (route.payload) {
    request.body = JSON.stringify(route.payload());
  }

  return request;
}

async function startLocalApp() {
  const server = http.createServer(createApp());
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
    server.listen(0, "127.0.0.1");
  });

  const { port } = server.address();
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    })
  };
}

async function timeRequest(baseUrl, route, authToken) {
  const startedAt = performance.now();
  let response;

  try {
    response = await fetch(new URL(route.path, baseUrl), buildRequest(route, authToken));
    const headersAt = performance.now();
    await response.arrayBuffer();
    const completedAt = performance.now();

    return {
      ok: response.ok,
      status: response.status,
      ttfbMs: headersAt - startedAt,
      totalMs: completedAt - startedAt
    };
  } catch (error) {
    const completedAt = performance.now();
    return {
      ok: false,
      status: 0,
      error: error instanceof Error ? error.message : String(error),
      ttfbMs: completedAt - startedAt,
      totalMs: completedAt - startedAt
    };
  }
}

async function runRoute(baseUrl, route, authToken) {
  const samples = [];
  const routeStartedAt = performance.now();

  for (let completed = 0; completed < requestCount; completed += concurrency) {
    const batchSize = Math.min(concurrency, requestCount - completed);
    const batch = Array.from({ length: batchSize }, () => timeRequest(baseUrl, route, authToken));
    samples.push(...await Promise.all(batch));
  }

  const wallMs = performance.now() - routeStartedAt;
  const totalLatencies = samples.map((sample) => sample.totalMs);
  const ttfbLatencies = samples.map((sample) => sample.ttfbMs);
  const errors = samples.filter((sample) => !sample.ok).length;
  const successful = samples.length - errors;
  const fastestMs = Math.min(...totalLatencies);

  return {
    name: route.name,
    method: route.method,
    path: route.path,
    requests: samples.length,
    successful,
    errors,
    errorRatePercent: round((errors / samples.length) * 100),
    latencyMs: {
      p50: round(percentile(totalLatencies, 50)),
      p95: round(percentile(totalLatencies, 95)),
      p99: round(percentile(totalLatencies, 99))
    },
    ttfbMs: {
      p50: round(percentile(ttfbLatencies, 50)),
      p95: round(percentile(ttfbLatencies, 95)),
      p99: round(percentile(ttfbLatencies, 99))
    },
    rps: {
      sustained: round(samples.length / (wallMs / 1000)),
      peak: round(1000 / fastestMs)
    },
    statuses: samples.reduce((acc, sample) => {
      const key = String(sample.status);
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {})
  };
}

async function loadThresholds() {
  const raw = await fs.readFile(thresholdsPath, "utf8");
  return JSON.parse(raw);
}

function evaluateThresholds(results, thresholds) {
  const failures = [];

  for (const result of results) {
    const routeThreshold = thresholds.routes?.[result.name] ?? {};
    const p99Ms = routeThreshold.p99Ms ?? thresholds.defaults.p99Ms;
    const errorRatePercent = routeThreshold.errorRatePercent ?? thresholds.defaults.errorRatePercent;

    if (result.latencyMs.p99 > p99Ms) {
      failures.push(`${result.name} p99 ${result.latencyMs.p99}ms exceeded ${p99Ms}ms`);
    }

    if (result.errorRatePercent > errorRatePercent) {
      failures.push(`${result.name} error rate ${result.errorRatePercent}% exceeded ${errorRatePercent}%`);
    }
  }

  return failures;
}

function formatMarkdown(report) {
  const rows = report.results.map((result) => [
    result.name,
    `${result.method} ${result.path}`,
    result.requests,
    result.latencyMs.p50,
    result.latencyMs.p95,
    result.latencyMs.p99,
    result.ttfbMs.p95,
    result.rps.sustained,
    result.rps.peak,
    result.errorRatePercent
  ]);

  return `# API Benchmark Summary

- Mode: ${report.mode}
- Target: ${report.target}
- Routes covered: ${report.results.length}
- Requests per endpoint: ${report.config.requestCount}
- Concurrency per endpoint: ${report.config.concurrency}
- Runtime: ${report.environment.node}
- OS: ${report.environment.os}
- Threshold result: ${report.thresholdFailures.length === 0 ? "passed" : "failed"}

| Route | Endpoint | Requests | p50 ms | p95 ms | p99 ms | p95 TTFB ms | Sustained RPS | Peak RPS | Error % |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
${rows.map((row) => `| ${row.join(" | ")} |`).join("\n")}

${report.thresholdFailures.length === 0 ? "" : `## Threshold Failures\n\n${report.thresholdFailures.map((failure) => `- ${failure}`).join("\n")}\n`}
`;
}

async function writeReports(report) {
  await fs.mkdir(resultsDir, { recursive: true });
  const jsonPath = path.join(resultsDir, "api-benchmark-latest.json");
  const markdownPath = path.join(resultsDir, "api-benchmark-latest.md");

  await fs.writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
  await fs.writeFile(markdownPath, formatMarkdown(report));

  return { jsonPath, markdownPath };
}

async function main() {
  let localApp;
  const configuredBaseUrl = process.env.BENCHMARK_BASE_URL;
  const authToken = process.env.BENCHMARK_AUTH_TOKEN
    ?? signAccessToken({ sub: "usr_benchmark", role: "admin", scope: "benchmark" });

  if (!configuredBaseUrl) {
    localApp = await startLocalApp();
  }

  const baseUrl = configuredBaseUrl ?? localApp.baseUrl;
  const results = [];

  try {
    for (const route of benchmarkRoutes) {
      results.push(await runRoute(baseUrl, route, authToken));
    }
  } finally {
    if (localApp) {
      await localApp.close();
    }
  }

  const thresholds = await loadThresholds();
  const thresholdFailures = evaluateThresholds(results, thresholds);
  const report = {
    generatedAt: new Date().toISOString(),
    mode: isSmoke ? "smoke" : "full",
    target: configuredBaseUrl ? "configured" : "local",
    config: {
      requestCount,
      concurrency
    },
    environment: {
      node: process.version,
      os: `${os.type()} ${os.release()} ${os.arch()}`,
      cpu: os.cpus()[0]?.model ?? "unknown",
      cpuCount: os.cpus().length,
      totalMemoryMb: Math.round(os.totalmem() / 1024 / 1024),
      freeMemoryMb: Math.round(os.freemem() / 1024 / 1024)
    },
    thresholds,
    thresholdFailures,
    results
  };

  const { jsonPath, markdownPath } = await writeReports(report);
  console.log(`Wrote ${jsonPath}`);
  console.log(`Wrote ${markdownPath}`);

  if (thresholdFailures.length > 0) {
    console.error(thresholdFailures.join("\n"));
    process.exitCode = 1;
  }
}

await main();
