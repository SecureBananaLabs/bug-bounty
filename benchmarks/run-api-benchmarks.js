import autocannon from "autocannon";
import fs from "node:fs/promises";
import { performance } from "node:perf_hooks";
import { createApp } from "../apps/api/src/app.js";
import { apiEndpoints } from "./api-endpoints.js";

process.env.BENCHMARK_MODE ??= "true";

const resultDir = new URL("./results/", import.meta.url);
const duration = Number(process.env.BENCHMARK_DURATION_SECONDS ?? 5);
const connections = Number(process.env.BENCHMARK_CONNECTIONS ?? 10);
const pipelining = Number(process.env.BENCHMARK_PIPELINING ?? 1);

async function startLocalServer() {
  if (process.env.BENCHMARK_BASE_URL) {
    return {
      baseUrl: process.env.BENCHMARK_BASE_URL.replace(/\/$/, ""),
      close: async () => {}
    };
  }

  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () =>
      new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      })
  };
}

async function getBenchmarkToken(baseUrl) {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      email: "benchmark.admin@example.com",
      password: "BenchmarkPass123!"
    })
  });
  const payload = await response.json();
  return payload.data.token;
}

async function measureTtfb(url, request) {
  const startedAt = performance.now();
  const response = await fetch(url, {
    method: request.method,
    headers: request.headers,
    body: request.body
  });
  const ttfbMs = performance.now() - startedAt;
  await response.arrayBuffer();
  return {
    statusCode: response.status,
    ttfbMs: Number(ttfbMs.toFixed(2))
  };
}

function countNonSuccessResponses(statusCodeStats) {
  return Object.entries(statusCodeStats ?? {}).reduce((total, [status, count]) => {
    const statusCode = Number(status);
    const responseCount = typeof count === "object" ? count.count : count;
    return statusCode >= 400 ? total + responseCount : total;
  }, 0);
}

function summarize(endpoint, benchmark, ttfb) {
  const totalRequests = benchmark.requests.total;
  const failedRequests =
    benchmark.errors + benchmark.timeouts + countNonSuccessResponses(benchmark.statusCodeStats);
  const errorRate = totalRequests > 0 ? (failedRequests / totalRequests) * 100 : 0;

  return {
    name: endpoint.name,
    method: endpoint.method,
    path: endpoint.path,
    requests: totalRequests,
    statusCodes: benchmark.statusCodeStats,
    latencyMs: {
      p50: benchmark.latency.p50,
      p95: benchmark.latency.p95 ?? benchmark.latency.p97_5,
      p99: benchmark.latency.p99,
      average: benchmark.latency.average
    },
    requestsPerSecond: {
      average: benchmark.requests.average,
      peak: benchmark.requests.max
    },
    throughputBytesPerSecond: {
      average: benchmark.throughput.average,
      peak: benchmark.throughput.max
    },
    timeToFirstByteMs: ttfb.ttfbMs,
    errorRatePercent: Number(errorRate.toFixed(2))
  };
}

function toMarkdown(metadata, results) {
  const rows = results
    .map((result) =>
      [
        `${result.method} ${result.path}`,
        result.requests,
        result.latencyMs.p50,
        result.latencyMs.p95,
        result.latencyMs.p99,
        result.requestsPerSecond.average,
        result.requestsPerSecond.peak,
        result.errorRatePercent,
        result.timeToFirstByteMs
      ].join(" | ")
    )
    .join("\n");

  return `# API Benchmark Results

- Base URL: ${metadata.baseUrl}
- Duration per endpoint: ${metadata.durationSeconds}s
- Connections: ${metadata.connections}
- Pipelining: ${metadata.pipelining}
- Generated at: ${metadata.generatedAt}

| Endpoint | Requests | p50 ms | p95 ms | p99 ms | Avg RPS | Peak RPS | Error % | TTFB ms |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
${rows}
`;
}

async function run() {
  await fs.mkdir(resultDir, { recursive: true });
  const server = await startLocalServer();

  try {
    const token = await getBenchmarkToken(server.baseUrl);
    const results = [];

    for (const endpoint of apiEndpoints) {
      const payload = endpoint.payload?.() ?? {};
      const request = {
        method: endpoint.method,
        headers: {
          ...(payload.headers ?? {}),
          ...(endpoint.requiresAuth ? { authorization: `Bearer ${token}` } : {})
        },
        body: payload.body
      };

      const url = `${server.baseUrl}${endpoint.path}`;
      const ttfb = await measureTtfb(url, request);
      const benchmark = await autocannon({
        url,
        method: request.method,
        headers: request.headers,
        body: request.body,
        duration,
        connections,
        pipelining
      });

      const summary = summarize(endpoint, benchmark, ttfb);
      results.push(summary);
      console.log(
        `${summary.method} ${summary.path}: p95=${summary.latencyMs.p95}ms avgRps=${summary.requestsPerSecond.average} errors=${summary.errorRatePercent}%`
      );
    }

    const metadata = {
      baseUrl: server.baseUrl,
      durationSeconds: duration,
      connections,
      pipelining,
      generatedAt: new Date().toISOString(),
      endpointCount: apiEndpoints.length
    };
    const report = { metadata, results };

    await fs.writeFile(new URL("api-benchmark-results.json", resultDir), JSON.stringify(report, null, 2));
    await fs.writeFile(new URL("api-benchmark-summary.md", resultDir), toMarkdown(metadata, results));
  } finally {
    await server.close();
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
