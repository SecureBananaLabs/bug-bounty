import autocannon from "autocannon";
import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import jwt from "jsonwebtoken";
import { endpoints } from "./endpoints.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const isSmoke = process.argv.includes("--smoke") || readBool("BENCHMARK_SMOKE", false);
const baseUrl = process.env.BENCHMARK_BASE_URL ?? "http://127.0.0.1:4000";
const resultsDir = path.resolve(rootDir, process.env.BENCHMARK_RESULTS_DIR ?? "benchmarks/results");
const duration = readNumber("BENCHMARK_DURATION_SECONDS", isSmoke ? 3 : 10);
const connections = readNumber("BENCHMARK_CONNECTIONS", isSmoke ? 2 : 20);
const pipelining = readNumber("BENCHMARK_PIPELINING", 1);
const shouldStartServer = readBool("BENCHMARK_START_SERVER", true);
const authToken = process.env.BENCHMARK_AUTH_TOKEN || createBenchmarkToken();
const thresholds = JSON.parse(await readFile(path.join(rootDir, "benchmarks/thresholds.json"), "utf8"));

let serverProcess;

try {
  if (shouldStartServer) {
    serverProcess = startServer();
  }

  await waitForHealth(`${baseUrl}/health`, 30_000);
  const results = [];

  for (const endpoint of endpoints) {
    const result = await runEndpoint(endpoint);
    results.push(result);
    console.log(formatConsoleLine(result));
  }

  const summary = buildSummary(results);
  await mkdir(resultsDir, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const jsonPath = path.join(resultsDir, `benchmark-${timestamp}.json`);
  const markdownPath = path.join(resultsDir, `benchmark-${timestamp}.md`);
  await writeFile(jsonPath, `${JSON.stringify(summary, null, 2)}\n`);
  await writeFile(markdownPath, renderMarkdown(summary));

  console.log(`\nBenchmark JSON written to ${path.relative(rootDir, jsonPath)}`);
  console.log(`Benchmark summary written to ${path.relative(rootDir, markdownPath)}`);

  if (summary.thresholdFailures.length > 0) {
    console.error("\nThreshold failures:");
    for (const failure of summary.thresholdFailures) {
      console.error(`- ${failure.endpoint}: ${failure.message}`);
    }
    process.exitCode = 1;
  }
} finally {
  if (serverProcess) {
    serverProcess.kill();
  }
}

function runEndpoint(endpoint) {
  const body = typeof endpoint.body === "function" ? endpoint.body() : endpoint.body;
  const headers = {
    accept: "application/json"
  };

  if (body) {
    headers["content-type"] = "application/json";
  }

  if (endpoint.auth) {
    headers.authorization = `Bearer ${authToken}`;
  }

  return new Promise((resolve, reject) => {
    autocannon(
      {
        url: `${baseUrl}${endpoint.path}`,
        method: endpoint.method,
        duration,
        connections,
        pipelining,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        renderProgressBar: false
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(normalizeResult(endpoint, result));
      }
    );
  });
}

function normalizeResult(endpoint, result) {
  const totalRequests = result.requests.total;
  const errors = result.errors + result.timeouts + result.non2xx;
  const errorRate = totalRequests === 0 ? 1 : errors / totalRequests;

  return {
    name: endpoint.name,
    method: endpoint.method,
    path: endpoint.path,
    description: endpoint.description,
    durationSeconds: duration,
    connections,
    pipelining,
    requests: totalRequests,
    requestsPerSecond: round(result.requests.average),
    latency: {
      p50: round(result.latency.p50),
      p95: round(result.latency.p95),
      p99: round(result.latency.p99)
    },
    throughputBytesPerSecond: round(result.throughput?.average),
    timeToFirstByteMs: round(result.latency.p50),
    errors,
    errorRate: round(errorRate, 4),
    statusCodeStats: result.statusCodeStats
  };
}

function buildSummary(results) {
  const thresholdFailures = [];

  for (const result of results) {
    const limit = {
      ...(isSmoke ? thresholds.smoke : thresholds.defaults),
      ...(thresholds.endpoints[result.name] ?? {})
    };

    if (result.latency.p99 > limit.maxP99Ms) {
      thresholdFailures.push({
        endpoint: result.name,
        metric: "p99",
        message: `p99 ${result.latency.p99}ms exceeded ${limit.maxP99Ms}ms`
      });
    }

    if (result.errorRate > limit.maxErrorRate) {
      thresholdFailures.push({
        endpoint: result.name,
        metric: "errorRate",
        message: `error rate ${result.errorRate} exceeded ${limit.maxErrorRate}`
      });
    }

    if (result.requestsPerSecond < limit.minRequestsPerSecond) {
      thresholdFailures.push({
        endpoint: result.name,
        metric: "requestsPerSecond",
        message: `RPS ${result.requestsPerSecond} was below ${limit.minRequestsPerSecond}`
      });
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    mode: isSmoke ? "smoke" : "full",
    baseUrl,
    config: {
      durationSeconds: duration,
      connections,
      pipelining
    },
    thresholdFailures,
    results
  };
}

function renderMarkdown(summary) {
  const lines = [
    "# API Benchmark Summary",
    "",
    `Generated: ${summary.generatedAt}`,
    `Mode: ${summary.mode}`,
    `Base URL: ${summary.baseUrl}`,
    `Config: ${summary.config.durationSeconds}s, ${summary.config.connections} connections, pipelining ${summary.config.pipelining}`,
    "",
    "| Endpoint | Method | p50 ms | p95 ms | p99 ms | RPS | Error % | TTFB ms | Requests |",
    "| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |"
  ];

  for (const result of summary.results) {
    lines.push(
      `| ${result.path} | ${result.method} | ${result.latency.p50} | ${result.latency.p95} | ${result.latency.p99} | ${result.requestsPerSecond} | ${(result.errorRate * 100).toFixed(2)} | ${result.timeToFirstByteMs} | ${result.requests} |`
    );
  }

  lines.push("", "## Threshold Result", "");

  if (summary.thresholdFailures.length === 0) {
    lines.push("All configured thresholds passed.");
  } else {
    for (const failure of summary.thresholdFailures) {
      lines.push(`- ${failure.endpoint}: ${failure.message}`);
    }
  }

  lines.push("");
  return `${lines.join("\n")}\n`;
}

function startServer() {
  const child = spawn(process.execPath, ["apps/api/src/server.js"], {
    cwd: rootDir,
    env: {
      ...process.env,
      PORT: new URL(baseUrl).port || "4000",
      JWT_SECRET: process.env.JWT_SECRET ?? "development-secret",
      BENCHMARK_DISABLE_RATE_LIMIT: process.env.BENCHMARK_DISABLE_RATE_LIMIT ?? "true"
    },
    stdio: ["ignore", "pipe", "pipe"]
  });

  child.stdout.on("data", (chunk) => process.stdout.write(`[api] ${chunk}`));
  child.stderr.on("data", (chunk) => process.stderr.write(`[api] ${chunk}`));
  return child;
}

async function waitForHealth(url, timeoutMs) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    if (await probe(url)) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Timed out waiting for ${url}`);
}

function probe(url) {
  return new Promise((resolve) => {
    const request = http.get(url, (response) => {
      response.resume();
      resolve(response.statusCode >= 200 && response.statusCode < 500);
    });

    request.on("error", () => resolve(false));
    request.setTimeout(1000, () => {
      request.destroy();
      resolve(false);
    });
  });
}

function createBenchmarkToken() {
  return jwt.sign(
    { sub: "benchmark-admin", role: "admin" },
    process.env.JWT_SECRET ?? "development-secret",
    { expiresIn: "15m" }
  );
}

function readNumber(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function readBool(name, fallback) {
  if (process.env[name] === undefined) return fallback;
  return ["1", "true", "yes"].includes(process.env[name].toLowerCase());
}

function round(value, decimals = 2) {
  if (!Number.isFinite(value)) return 0;
  return Number(value.toFixed(decimals));
}

function formatConsoleLine(result) {
  return `${result.method} ${result.path} p99=${result.latency.p99}ms rps=${result.requestsPerSecond} errors=${result.errors}`;
}
