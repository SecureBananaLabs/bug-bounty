import { readFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";
import autocannon from "autocannon";

import { BENCHMARK_ENDPOINTS } from "./endpoints.mjs";
import { applyBenchmarkRuntimeEnv, loadBenchmarkConfig } from "./config.mjs";
import { createBenchmarkToken } from "./token.mjs";
import { buildMarkdownReport, evaluateThresholds, writeReports } from "./reporting.mjs";

function percentile(values, percentileRank) {
  if (!values.length) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((percentileRank / 100) * sorted.length) - 1);
  return sorted[index];
}

function runAutocannon(options) {
  return new Promise((resolve, reject) => {
    autocannon(options, (error, result) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(result);
    });
  });
}

async function measureTtfb(targetUrl, endpoint, headers, samples) {
  const timings = [];

  for (let index = 0; index < samples; index += 1) {
    const startedAt = performance.now();
    const response = await fetch(`${targetUrl}${endpoint.path}`, {
      method: endpoint.method,
      headers,
      body: endpoint.body
    });
    const headerAt = performance.now();
    await response.arrayBuffer();
    timings.push(headerAt - startedAt);
  }

  return {
    p50: percentile(timings, 50),
    p95: percentile(timings, 95),
    p99: percentile(timings, 99)
  };
}

async function startLocalTarget() {
  const { createApp } = await import("../apps/api/src/app.js");
  const app = createApp();

  return new Promise((resolve) => {
    const server = app.listen(0, () => {
      const { port } = server.address();
      resolve({
        targetUrl: `http://127.0.0.1:${port}`,
        close: () => new Promise((serverResolve) => server.close(serverResolve))
      });
    });
  });
}

function statusCodeStats(stats) {
  if (!stats) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(stats).map(([code, value]) => [code, value.count ?? value])
  );
}

async function runEndpoint(targetUrl, endpoint, config, token) {
  const headers = {
    Accept: "application/json",
    ...endpoint.headers
  };

  if (endpoint.auth === "admin") {
    headers.Authorization = `Bearer ${token}`;
  }

  const result = await runAutocannon({
    url: `${targetUrl}${endpoint.path}`,
    method: endpoint.method,
    headers,
    body: endpoint.body,
    connections: config.connections,
    duration: config.durationSeconds,
    title: endpoint.id
  });
  const ttfb = await measureTtfb(targetUrl, endpoint, headers, config.ttfbSamples);
  const totalRequests = result.requests?.total ?? 0;
  const failedRequests = (result.errors ?? 0) + (result.timeouts ?? 0) + (result.non2xx ?? 0);

  return {
    id: endpoint.id,
    method: endpoint.method,
    path: endpoint.path,
    status: failedRequests === 0 ? "passed" : "failed",
    metrics: {
      latency: {
        p50: result.latency?.p50 ?? 0,
        p95: result.latency?.p95 ?? 0,
        p99: result.latency?.p99 ?? 0
      },
      ttfb,
      requests: {
        sustainedRps: result.requests?.average ?? 0,
        peakRps: result.requests?.max ?? 0,
        total: totalRequests
      },
      errors: {
        total: failedRequests,
        rate: totalRequests ? failedRequests / totalRequests : 0
      },
      statusCodes: statusCodeStats(result.statusCodeStats)
    }
  };
}

async function main() {
  const config = loadBenchmarkConfig();
  applyBenchmarkRuntimeEnv(config);
  const localTarget = config.targetUrl ? null : await startLocalTarget();
  const targetUrl = config.targetUrl || localTarget.targetUrl;
  const token = createBenchmarkToken(config.jwtSecret);

  try {
    const results = [];
    for (const endpoint of BENCHMARK_ENDPOINTS) {
      console.log(`Benchmarking ${endpoint.method} ${endpoint.path}`);
      results.push(await runEndpoint(targetUrl, endpoint, config, token));
    }

    const thresholds = JSON.parse(await readFile("benchmarks/thresholds.json", "utf8"));
    const thresholdSummary = evaluateThresholds(results, thresholds);
    const report = {
      generatedAt: new Date().toISOString(),
      mode: config.mode,
      targetUrl,
      durationSeconds: config.durationSeconds,
      connections: config.connections,
      endpoints: BENCHMARK_ENDPOINTS.length,
      results,
      thresholdSummary
    };
    const markdown = buildMarkdownReport(report);
    const paths = await writeReports(report, markdown, config.outputDir);

    console.log(markdown);
    console.log(`JSON report: ${paths.jsonPath}`);
    console.log(`Markdown report: ${paths.markdownPath}`);

    if (!thresholdSummary.passed) {
      process.exitCode = 1;
    }
  } finally {
    await localTarget?.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
