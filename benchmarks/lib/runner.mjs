import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { cpus, freemem, platform, release, totalmem } from "node:os";
import { join } from "node:path";
import { performance } from "node:perf_hooks";
import { buildBenchmarkEndpoints } from "../config/endpoints.mjs";
import { renderMarkdownReport, summarizeSamples } from "./metrics.mjs";

export async function runBenchmark(options) {
  const localServer = await maybeStartLocalServer(options.targetUrl);
  const baseUrl = options.targetUrl || localServer.baseUrl;
  const authToken = options.authToken || localServer.authToken;
  const endpoints = buildBenchmarkEndpoints({ authToken });
  const results = [];

  for (const endpoint of endpoints) {
    const result = await runEndpoint({
      endpoint,
      baseUrl,
      concurrency: options.concurrency,
      requests: options.requestsPerEndpoint,
      timeoutMs: options.timeoutMs
    });
    results.push(result);
  }

  await localServer.close?.();

  const report = {
    generatedAt: new Date().toISOString(),
    mode: options.mode,
    target: options.targetUrl || "local-auto-start",
    concurrency: options.concurrency,
    requestsPerEndpoint: options.requestsPerEndpoint,
    runtime: {
      node: process.version,
      platform: `${platform()} ${release()}`,
      cpu: cpus()[0]?.model ?? "unknown",
      cores: cpus().length,
      totalMemoryMb: Math.round(totalmem() / 1024 / 1024),
      freeMemoryMb: Math.round(freemem() / 1024 / 1024)
    },
    endpoints: results
  };

  writeReports(report);
  enforceThresholds(report, options.thresholds);

  return report;
}

async function maybeStartLocalServer(targetUrl) {
  if (targetUrl) return {};

  const [{ createApp }, { signAccessToken }] = await Promise.all([
    import("../../apps/api/src/app.js"),
    import("../../apps/api/src/utils/jwt.js")
  ]);

  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    authToken: signAccessToken({ sub: "usr_benchmark_admin", role: "admin" }),
    close: () =>
      new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      })
  };
}

async function runEndpoint({ endpoint, baseUrl, concurrency, requests, timeoutMs }) {
  const samples = [];
  let nextRequest = 0;
  const startedAt = performance.now();
  const workerCount = Math.min(concurrency, requests);

  async function worker() {
    while (nextRequest < requests) {
      const iteration = nextRequest++;
      samples.push(await runSingleRequest({ endpoint, baseUrl, iteration, timeoutMs }));
    }
  }

  await Promise.all(Array.from({ length: workerCount }, () => worker()));

  const durationMs = performance.now() - startedAt;
  return {
    name: endpoint.name,
    method: endpoint.method,
    path: endpoint.path,
    durationMs: Math.round(durationMs),
    ...summarizeSamples(samples, durationMs)
  };
}

async function runSingleRequest({ endpoint, baseUrl, iteration, timeoutMs }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = performance.now();

  try {
    const request = endpoint.buildRequest?.({ iteration }) ?? {};
    const response = await fetch(`${baseUrl}${endpoint.path}`, {
      method: endpoint.method,
      signal: controller.signal,
      ...request
    });
    const firstByteAt = performance.now();
    await response.arrayBuffer();
    const completedAt = performance.now();

    return {
      status: response.status,
      latencyMs: completedAt - startedAt,
      ttfbMs: firstByteAt - startedAt,
      completedAtMs: completedAt
    };
  } catch (error) {
    const completedAt = performance.now();
    return {
      status: 0,
      error: error instanceof Error ? error.message : "unknown error",
      latencyMs: completedAt - startedAt,
      ttfbMs: completedAt - startedAt,
      completedAtMs: completedAt
    };
  } finally {
    clearTimeout(timeout);
  }
}

function writeReports(report) {
  const resultsDir = join(process.cwd(), "benchmarks", "results");
  mkdirSync(resultsDir, { recursive: true });

  const stamp = report.generatedAt.replace(/[:.]/g, "-");
  const jsonPath = join(resultsDir, `${stamp}-${report.mode}.json`);
  const markdownPath = join(resultsDir, `${stamp}-${report.mode}.md`);
  const latestJsonPath = join(resultsDir, `latest-${report.mode}.json`);
  const latestMarkdownPath = join(resultsDir, `latest-${report.mode}.md`);
  const markdown = renderMarkdownReport(report);

  writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
  writeFileSync(markdownPath, markdown);
  writeFileSync(latestJsonPath, `${JSON.stringify(report, null, 2)}\n`);
  writeFileSync(latestMarkdownPath, markdown);

  console.log(`Wrote ${jsonPath}`);
  console.log(`Wrote ${markdownPath}`);
}

function enforceThresholds(report, thresholds) {
  if (!thresholds) return;

  const failures = [];
  for (const endpoint of report.endpoints) {
    const threshold = {
      ...thresholds.default,
      ...(thresholds.endpoints?.[endpoint.name] ?? {})
    };

    if (endpoint.latencyMs.p99 > threshold.p99LatencyMs) {
      failures.push(
        `${endpoint.name} p99 ${endpoint.latencyMs.p99}ms exceeded ${threshold.p99LatencyMs}ms`
      );
    }

    if (endpoint.errorRatePercent > threshold.errorRatePercent) {
      failures.push(
        `${endpoint.name} error rate ${endpoint.errorRatePercent}% exceeded ${threshold.errorRatePercent}%`
      );
    }
  }

  if (failures.length > 0) {
    throw new Error(`Benchmark smoke gate failed:\n${failures.join("\n")}`);
  }
}

export function loadThresholds(path = "benchmarks/thresholds.json") {
  return JSON.parse(readFileSync(path, "utf8"));
}
