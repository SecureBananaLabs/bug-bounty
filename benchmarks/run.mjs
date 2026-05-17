import autocannon from "autocannon";
import os from "node:os";
import { performance } from "node:perf_hooks";
import { pathToFileURL } from "node:url";
import { createApp } from "../apps/api/src/app.js";
import { signAccessToken } from "../apps/api/src/utils/jwt.js";
import { loadBenchmarkConfig } from "./config.mjs";
import { renderMarkdownReport, writeReports } from "./report.mjs";
import { API_ROUTE_MANIFEST, materializeRequest } from "./routes.mjs";
import { evaluateThresholds, loadThresholds } from "./thresholds.mjs";

function percentile(values, percentileRank) {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((percentileRank / 100) * sorted.length) - 1);
  return sorted[index];
}

function makeUrl(baseUrl, routePath) {
  return new URL(routePath, `${baseUrl}/`).toString();
}

function autocannonPercentile(latency, percentileName) {
  if (Number.isFinite(latency[percentileName])) {
    return latency[percentileName];
  }

  if (percentileName === "p95" && Number.isFinite(latency.p97_5)) {
    return latency.p97_5;
  }

  return 0;
}

function createBenchmarkToken(config) {
  if (config.authToken) {
    return config.authToken;
  }

  return signAccessToken({
    sub: "usr_benchmark_admin",
    role: "admin",
    scope: "benchmark"
  });
}

function startLocalServer() {
  const app = createApp();
  const server = app.listen(0);

  return new Promise((resolve, reject) => {
    server.once("listening", () => {
      const { port } = server.address();
      resolve({
        baseUrl: `http://127.0.0.1:${port}`,
        close: () =>
          new Promise((closeResolve, closeReject) => {
            server.close((error) => (error ? closeReject(error) : closeResolve()));
          })
      });
    });
    server.once("error", reject);
  });
}

function normalizeAutocannonResult(route, raw) {
  const totalRequests = raw.requests.total || 0;
  const failedRequests = (raw.errors || 0) + (raw.non2xx || 0);
  const errorRate = totalRequests > 0 ? (failedRequests / totalRequests) * 100 : 0;

  return {
    id: route.id,
    method: route.method,
    path: route.path,
    expectedStatus: route.expectedStatus,
    description: route.description,
    metrics: {
      latency: {
        p50: autocannonPercentile(raw.latency, "p50"),
        p95: autocannonPercentile(raw.latency, "p95"),
        p99: autocannonPercentile(raw.latency, "p99")
      },
      rps: {
        sustained: raw.requests.average,
        peak: raw.requests.max
      },
      errorRate,
      ttfb: {
        p50: 0,
        p95: 0,
        p99: 0
      }
    },
    raw: {
      requests: raw.requests.total,
      durationSeconds: raw.duration,
      errors: raw.errors,
      non2xx: raw.non2xx,
      timeouts: raw.timeouts
    }
  };
}

async function runAutocannon(baseUrl, route, config, authToken) {
  const request = materializeRequest(route, { sequence: 1, authToken });

  return new Promise((resolve, reject) => {
    autocannon(
      {
        url: makeUrl(baseUrl, request.path),
        method: request.method,
        headers: request.headers,
        body: request.body,
        connections: config.connections,
        amount: config.requests,
        timeout: config.timeoutSeconds,
        pipelining: 1
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(normalizeAutocannonResult(route, result));
        }
      }
    );
  });
}

async function measureTtfb(baseUrl, route, config, authToken) {
  const samples = [];

  for (let index = 0; index < config.ttfbSamples; index += 1) {
    const request = materializeRequest(route, { sequence: index + 1000, authToken });
    const started = performance.now();
    const response = await fetch(makeUrl(baseUrl, request.path), {
      method: request.method,
      headers: request.headers,
      body: request.body
    });
    const firstByteMs = performance.now() - started;
    await response.arrayBuffer();
    samples.push(firstByteMs);
  }

  return {
    p50: percentile(samples, 50),
    p95: percentile(samples, 95),
    p99: percentile(samples, 99)
  };
}

async function runExternalRoute(route, config, authToken) {
  const result = await runAutocannon(config.baseUrl, route, config, authToken);
  result.metrics.ttfb = await measureTtfb(config.baseUrl, route, config, authToken);
  return result;
}

async function runLocalRoute(route, config, authToken) {
  const previousRateLimitFlag = process.env.BENCHMARK_DISABLE_RATE_LIMIT;
  process.env.BENCHMARK_DISABLE_RATE_LIMIT = "true";
  const server = await startLocalServer();

  try {
    const result = await runAutocannon(server.baseUrl, route, config, authToken);
    result.metrics.ttfb = await measureTtfb(server.baseUrl, route, config, authToken);
    return result;
  } finally {
    await server.close();
    if (previousRateLimitFlag === undefined) {
      delete process.env.BENCHMARK_DISABLE_RATE_LIMIT;
    } else {
      process.env.BENCHMARK_DISABLE_RATE_LIMIT = previousRateLimitFlag;
    }
  }
}

function collectEnvironment() {
  const cpus = os.cpus();

  return {
    node: process.version,
    platform: os.platform(),
    release: os.release(),
    arch: os.arch(),
    cpu: cpus[0]?.model ?? "unknown",
    logicalCores: cpus.length,
    totalMemoryMb: Math.round(os.totalmem() / 1024 / 1024),
    freeMemoryMb: Math.round(os.freemem() / 1024 / 1024)
  };
}

export async function runBenchmarkSuite(argv = process.argv.slice(2), env = process.env) {
  const config = loadBenchmarkConfig(argv, env);
  const authToken = createBenchmarkToken(config);
  const thresholds = loadThresholds(config.thresholdsPath);
  const results = [];

  for (const route of API_ROUTE_MANIFEST) {
    const result = config.localMode
      ? await runLocalRoute(route, config, authToken)
      : await runExternalRoute(route, config, authToken);
    results.push(result);
  }

  const report = {
    mode: config.mode,
    target: config.localMode ? "local ephemeral Express server" : config.baseUrl,
    generatedAt: new Date().toISOString(),
    config: {
      connections: config.connections,
      requests: config.requests,
      timeoutSeconds: config.timeoutSeconds,
      ttfbSamples: config.ttfbSamples
    },
    environment: collectEnvironment(),
    results,
    thresholdFailures: evaluateThresholds(results, thresholds)
  };

  const paths = await writeReports(report, config.resultsDir);
  return { report, paths };
}

async function main() {
  const { report, paths } = await runBenchmarkSuite();
  process.stdout.write(renderMarkdownReport(report));
  process.stdout.write(`\nJSON report: ${paths.latestJsonPath}\nMarkdown report: ${paths.latestMarkdownPath}\n`);

  if (report.thresholdFailures.length > 0) {
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
