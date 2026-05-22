import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { createApp } from "../apps/api/src/app.js";
import { signAccessToken } from "../apps/api/src/utils/jwt.js";

const root = process.cwd();
const smokeMode = process.argv.includes("--smoke");
const endpoints = readJson("benchmarks/endpoints.json");
const thresholds = readJson("benchmarks/thresholds.json");
const outputDir = process.env.BENCHMARK_OUTPUT_DIR ?? "benchmarks/results";
const iterations = smokeMode ? 3 : Number(process.env.BENCHMARK_ITERATIONS ?? 8);
const concurrency = smokeMode ? 1 : Number(process.env.BENCHMARK_CONCURRENCY ?? 2);
const configuredBaseUrl = process.env.BENCHMARK_BASE_URL;

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function percentile(values, percentileValue) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((percentileValue / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
}

function round(value, digits = 2) {
  return Number(value.toFixed(digits));
}

async function startLocalServer() {
  if (configuredBaseUrl) {
    return {
      baseUrl: configuredBaseUrl.replace(/\/$/, ""),
      close: async () => {}
    };
  }

  const app = createApp();
  const server = http.createServer(app);

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

function buildRequest(endpoint) {
  const headers = { ...(endpoint.headers ?? {}) };
  let body;

  if (endpoint.auth) {
    headers.authorization = `Bearer ${signAccessToken({ sub: "benchmark-admin", role: "admin" })}`;
  }

  if (endpoint.json) {
    headers["content-type"] = "application/json";
    body = JSON.stringify(endpoint.json);
  }

  if (endpoint.formData) {
    const form = new FormData();
    for (const [key, value] of Object.entries(endpoint.formData)) {
      if (value && typeof value === "object" && "content" in value) {
        form.append(key, new Blob([value.content]), value.filename ?? key);
      } else {
        form.append(key, String(value));
      }
    }
    body = form;
  }

  return {
    method: endpoint.method,
    headers,
    body
  };
}

async function runOneRequest(baseUrl, endpoint) {
  const url = `${baseUrl}${endpoint.path}`;
  const startedAt = performance.now();
  try {
    const response = await fetch(url, buildRequest(endpoint));
    const firstByteAt = performance.now();
    await response.arrayBuffer();
    const completedAt = performance.now();

    return {
      ok: response.ok,
      status: response.status,
      latencyMs: completedAt - startedAt,
      ttfbMs: firstByteAt - startedAt
    };
  } catch (error) {
    const completedAt = performance.now();
    return {
      ok: false,
      status: "ERR",
      error: error.message,
      latencyMs: completedAt - startedAt,
      ttfbMs: completedAt - startedAt
    };
  }
}

async function runEndpoint(baseUrl, endpoint) {
  const totalRequests = Math.max(iterations, concurrency);
  const requestsPerWorker = Math.ceil(totalRequests / concurrency);
  const startedAt = performance.now();
  const results = [];

  await Promise.all(Array.from({ length: concurrency }, async (_, workerIndex) => {
    for (let index = 0; index < requestsPerWorker; index += 1) {
      const requestIndex = workerIndex * requestsPerWorker + index;
      if (requestIndex >= totalRequests) break;
      results.push(await runOneRequest(baseUrl, endpoint));
    }
  }));

  const completedAt = performance.now();
  const latencies = results.map((result) => result.latencyMs);
  const ttfb = results.map((result) => result.ttfbMs);
  const errors = results.filter((result) => !result.ok);
  const statusCounts = results.reduce((accumulator, result) => {
    const key = String(result.status);
    accumulator[key] = (accumulator[key] ?? 0) + 1;
    return accumulator;
  }, {});

  return {
    name: endpoint.name,
    method: endpoint.method,
    path: endpoint.path,
    requests: results.length,
    p50LatencyMs: round(percentile(latencies, 50)),
    p95LatencyMs: round(percentile(latencies, 95)),
    p99LatencyMs: round(percentile(latencies, 99)),
    p50TtfbMs: round(percentile(ttfb, 50)),
    p95TtfbMs: round(percentile(ttfb, 95)),
    p99TtfbMs: round(percentile(ttfb, 99)),
    sustainedRps: round((results.length / (completedAt - startedAt)) * 1000),
    peakRps: round(1000 / Math.max(Math.min(...latencies), 0.01)),
    errorRatePercent: round((errors.length / results.length) * 100),
    statusCounts
  };
}

function assertThresholds(endpointResults) {
  const activeThreshold = smokeMode ? thresholds.smoke : thresholds.default;
  const failures = [];

  for (const result of endpointResults) {
    if (result.p99LatencyMs > activeThreshold.p99LatencyMs) {
      failures.push(`${result.name} p99 ${result.p99LatencyMs}ms > ${activeThreshold.p99LatencyMs}ms`);
    }
    if (result.errorRatePercent > activeThreshold.errorRatePercent) {
      failures.push(`${result.name} error rate ${result.errorRatePercent}% > ${activeThreshold.errorRatePercent}%`);
    }
  }

  return failures;
}

function markdownReport(report) {
  const lines = [
    "# API Benchmark Summary",
    "",
    `- Mode: ${report.mode}`,
    `- Target: ${report.target}`,
    `- Generated at: ${report.generatedAt}`,
    `- Iterations per endpoint: ${report.iterations}`,
    `- Concurrency: ${report.concurrency}`,
    `- Language: ${report.language}`,
    "",
    "| Endpoint | p50 ms | p95 ms | p99 ms | TTFB p99 ms | Sustained RPS | Peak RPS | Error % | Statuses |",
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |"
  ];

  for (const result of report.results) {
    lines.push([
      `| \`${result.method} ${result.path}\``,
      result.p50LatencyMs,
      result.p95LatencyMs,
      result.p99LatencyMs,
      result.p99TtfbMs,
      result.sustainedRps,
      result.peakRps,
      result.errorRatePercent,
      `\`${JSON.stringify(result.statusCounts)}\` |`
    ].join(" | "));
  }

  lines.push("");
  if (report.thresholdFailures.length === 0) {
    lines.push("Threshold gate: PASS");
  } else {
    lines.push("Threshold gate: FAIL");
    for (const failure of report.thresholdFailures) {
      lines.push(`- ${failure}`);
    }
  }

  return `${lines.join("\n")}\n`;
}

async function main() {
  const server = await startLocalServer();
  try {
    const results = [];
    for (const endpoint of endpoints) {
      results.push(await runEndpoint(server.baseUrl, endpoint));
    }

    const report = {
      mode: smokeMode ? "smoke" : "full",
      target: configuredBaseUrl ? "external" : "local",
      baseUrl: server.baseUrl,
      generatedAt: new Date().toISOString(),
      iterations,
      concurrency,
      language: process.env.BENCHMARK_LANGUAGE ?? "EN",
      results,
      thresholdFailures: assertThresholds(results)
    };

    fs.mkdirSync(path.join(root, outputDir), { recursive: true });
    fs.writeFileSync(
      path.join(root, outputDir, "api-benchmark-results.json"),
      `${JSON.stringify(report, null, 2)}\n`
    );
    fs.writeFileSync(
      path.join(root, outputDir, "api-benchmark-summary.md"),
      markdownReport(report)
    );

    console.log(`Benchmarked ${results.length} endpoints against ${server.baseUrl}`);
    console.log(`Wrote ${outputDir}/api-benchmark-results.json`);
    console.log(`Wrote ${outputDir}/api-benchmark-summary.md`);

    if (report.thresholdFailures.length > 0) {
      console.error("Benchmark threshold failures:");
      for (const failure of report.thresholdFailures) {
        console.error(`- ${failure}`);
      }
      process.exitCode = 1;
    }
  } finally {
    await server.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
