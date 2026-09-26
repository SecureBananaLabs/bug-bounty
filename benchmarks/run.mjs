import autocannon from "autocannon";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createApp } from "../apps/api/src/app.js";
import { signAccessToken } from "../apps/api/src/utils/jwt.js";
import { endpoints } from "./endpoints.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const resultsDir = path.join(__dirname, "results");
const thresholdsPath = path.join(__dirname, "thresholds.json");
const isSmoke = process.argv.includes("--smoke");

const config = {
  baseUrl: process.env.BENCHMARK_BASE_URL,
  connections: Number(process.env.BENCHMARK_CONNECTIONS ?? (isSmoke ? 1 : 10)),
  duration: Number(process.env.BENCHMARK_DURATION_SECONDS ?? (isSmoke ? 2 : 10)),
  requestsPerEndpoint: Number(process.env.BENCHMARK_REQUESTS_PER_ENDPOINT ?? (isSmoke ? 20 : 150)),
  pipelining: Number(process.env.BENCHMARK_PIPELINING ?? 1),
  benchmarkToken: process.env.BENCHMARK_AUTH_TOKEN ?? signAccessToken({
    sub: "benchmark-user",
    role: "admin",
    purpose: "api-benchmark"
  })
};

let server;

async function main() {
  await fs.mkdir(resultsDir, { recursive: true });

  if (!config.baseUrl) {
    process.env.NODE_ENV = "benchmark";
    server = await startLocalApi();
    const { port } = server.address();
    config.baseUrl = `http://127.0.0.1:${port}`;
  }

  const thresholds = JSON.parse(await fs.readFile(thresholdsPath, "utf8"));
  const results = [];

  for (const endpoint of endpoints) {
    results.push(await runEndpoint(endpoint));
  }

  const summary = buildSummary(results, thresholds);
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const jsonPath = path.join(resultsDir, `${timestamp}${isSmoke ? "-smoke" : ""}.json`);
  const markdownPath = path.join(resultsDir, `${timestamp}${isSmoke ? "-smoke" : ""}.md`);

  await fs.writeFile(jsonPath, `${JSON.stringify({
    generatedAt: new Date().toISOString(),
    mode: isSmoke ? "smoke" : "full",
    target: config.baseUrl,
    config: {
      connections: config.connections,
      durationSeconds: config.duration,
      requestsPerEndpoint: config.requestsPerEndpoint,
      pipelining: config.pipelining
    },
    thresholds,
    results
  }, null, 2)}\n`);

  await fs.writeFile(markdownPath, summary.markdown);
  console.log(summary.markdown);

  if (summary.failures.length > 0) {
    process.exitCode = 1;
  }
}

async function startLocalApi() {
  const app = createApp();
  const localServer = app.listen(0);

  await new Promise((resolve, reject) => {
    localServer.once("listening", resolve);
    localServer.once("error", reject);
  });

  return localServer;
}

async function runEndpoint(endpoint) {
  const url = new URL(endpoint.path, config.baseUrl).toString();
  const headers = {
    "content-type": "application/json"
  };

  if (endpoint.auth) {
    headers.authorization = `Bearer ${config.benchmarkToken}`;
  }

  const options = {
    url,
    method: endpoint.method,
    connections: config.connections,
    duration: config.duration,
    amount: config.requestsPerEndpoint,
    pipelining: config.pipelining,
    headers,
    body: endpoint.body ? JSON.stringify(endpoint.body) : undefined
  };

  const result = await autocannon(options);
  const totalRequests = result.requests.total;
  const failedRequests = result.errors + result.timeouts + result.non2xx;
  const errorRate = totalRequests === 0 ? 100 : (failedRequests / totalRequests) * 100;

  return {
    name: endpoint.name,
    method: endpoint.method,
    path: endpoint.path,
    requests: totalRequests,
    latency: {
      p50: percentile(result.latency, "p50"),
      p95: percentile(result.latency, "p95"),
      p99: percentile(result.latency, "p99")
    },
    requestsPerSecond: {
      sustained: result.requests.average,
      peak: result.requests.max
    },
    throughputBytesPerSecond: {
      average: result.throughput.average,
      peak: result.throughput.max
    },
    ttfbMs: {
      p50: percentile(result.latency, "p50"),
      p95: percentile(result.latency, "p95"),
      p99: percentile(result.latency, "p99")
    },
    errorRate,
    failures: {
      errors: result.errors,
      timeouts: result.timeouts,
      non2xx: result.non2xx
    }
  };
}

function percentile(stats, key) {
  if (Number.isFinite(stats[key])) {
    return stats[key];
  }

  if (key === "p95" && Number.isFinite(stats.p97_5)) {
    return stats.p97_5;
  }

  if (key === "p95" && Number.isFinite(stats.p90)) {
    return stats.p90;
  }

  return 0;
}

function buildSummary(results, thresholds) {
  const failures = results.filter((result) => {
    const endpointThreshold = thresholds.endpoints[result.name] ?? {};
    const p99Limit = endpointThreshold.p99LatencyMs ?? thresholds.default.p99LatencyMs;
    const errorLimit = endpointThreshold.errorRatePercent ?? thresholds.default.errorRatePercent;
    return result.latency.p99 > p99Limit || result.errorRate > errorLimit;
  });

  const rows = results.map((result) => {
    const endpointThreshold = thresholds.endpoints[result.name] ?? {};
    const p99Limit = endpointThreshold.p99LatencyMs ?? thresholds.default.p99LatencyMs;
    const errorLimit = endpointThreshold.errorRatePercent ?? thresholds.default.errorRatePercent;
    const status = result.latency.p99 <= p99Limit && result.errorRate <= errorLimit ? "PASS" : "FAIL";

    return [
      result.name,
      `${result.method} ${result.path}`,
      result.latency.p50.toFixed(2),
      result.latency.p95.toFixed(2),
      result.latency.p99.toFixed(2),
      result.requestsPerSecond.sustained.toFixed(2),
      result.requestsPerSecond.peak.toFixed(2),
      result.errorRate.toFixed(2),
      result.ttfbMs.p95.toFixed(2),
      status
    ];
  });

  const markdown = [
    `# API Benchmark Summary (${isSmoke ? "Smoke" : "Full"})`,
    "",
    `Generated: ${new Date().toISOString()}`,
    `Target: ${config.baseUrl}`,
    `Connections: ${config.connections}`,
    `Duration cap per endpoint: ${config.duration}s`,
    `Request cap per endpoint: ${config.requestsPerEndpoint}`,
    "",
    "| Endpoint | Route | p50 ms | p95 ms | p99 ms | Sustained RPS | Peak RPS | Error % | TTFB p95 ms | Gate |",
    "| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |",
    ...rows.map((row) => `| ${row.join(" | ")} |`),
    "",
    failures.length === 0
      ? "Regression gate: PASS"
      : `Regression gate: FAIL (${failures.map((failure) => failure.name).join(", ")})`,
    "",
    "TTFB is reported from the first-response latency distribution provided by autocannon."
  ].join("\n");

  return { failures, markdown: `${markdown}\n` };
}

try {
  await main();
} finally {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}
