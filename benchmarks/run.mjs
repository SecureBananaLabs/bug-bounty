import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";
import { createApp } from "../apps/api/src/app.js";
import { signAccessToken } from "../apps/api/src/utils/jwt.js";
import { benchmarkRoutes } from "./routes.mjs";
import thresholds from "./thresholds.json" with { type: "json" };

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const smokeMode = process.argv.includes("--smoke");

function envNumber(name, fallback) {
  const parsed = Number(process.env[name]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function percentile(values, rank) {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(
    sorted.length - 1,
    Math.ceil((rank / 100) * sorted.length) - 1
  );
  return sorted[Math.max(0, index)];
}

function round(value, decimals = 2) {
  return Number(value.toFixed(decimals));
}

async function startLocalServer() {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    async close() {
      await new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  };
}

function buildRequest(route, baseUrl, authToken) {
  const headers = {};
  const options = { method: route.method, headers };

  if (route.auth) {
    headers.authorization = `Bearer ${authToken}`;
  }

  if (route.formData) {
    options.body = route.formData();
  } else if (route.json !== undefined) {
    headers["content-type"] = "application/json";
    const payload = typeof route.json === "function" ? route.json() : route.json;
    options.body = JSON.stringify(payload);
  }

  return {
    url: new URL(route.path, baseUrl).toString(),
    options
  };
}

async function runSingleRequest(route, baseUrl, authToken) {
  const { url, options } = buildRequest(route, baseUrl, authToken);
  const startedAt = performance.now();

  try {
    const response = await fetch(url, options);
    const firstByteAt = performance.now();
    await response.arrayBuffer();
    const completedAt = performance.now();

    return {
      ok: response.ok,
      status: response.status,
      ttfbMs: firstByteAt - startedAt,
      latencyMs: completedAt - startedAt
    };
  } catch (error) {
    const completedAt = performance.now();
    return {
      ok: false,
      status: "FETCH_ERROR",
      error: error instanceof Error ? error.message : String(error),
      ttfbMs: completedAt - startedAt,
      latencyMs: completedAt - startedAt
    };
  }
}

async function runEndpoint(route, config) {
  for (let index = 0; index < config.warmupRequests; index += 1) {
    await runSingleRequest(route, config.baseUrl, config.authToken);
  }

  const deadline = performance.now() + config.durationMs;
  const samples = [];
  let startedRequests = 0;

  async function worker() {
    while (performance.now() < deadline) {
      if (
        Number.isFinite(config.maxRequestsPerEndpoint) &&
        startedRequests >= config.maxRequestsPerEndpoint
      ) {
        break;
      }

      startedRequests += 1;
      samples.push(await runSingleRequest(route, config.baseUrl, config.authToken));
    }
  }

  await Promise.all(
    Array.from({ length: config.concurrency }, () => worker())
  );

  const elapsedSeconds = config.durationMs / 1000;
  const latencies = samples.map((sample) => sample.latencyMs);
  const ttfbValues = samples.map((sample) => sample.ttfbMs);
  const failures = samples.filter((sample) => !sample.ok);
  const perSecondBuckets = new Map();

  samples.forEach((sample, index) => {
    const bucket = Math.floor(
      (index / Math.max(samples.length, 1)) * elapsedSeconds
    );
    perSecondBuckets.set(bucket, (perSecondBuckets.get(bucket) ?? 0) + 1);
  });

  return {
    name: route.name,
    method: route.method,
    path: route.path,
    requests: samples.length,
    success: samples.length - failures.length,
    failures: failures.length,
    errorRatePercent: round((failures.length / Math.max(samples.length, 1)) * 100),
    rpsSustained: round(samples.length / elapsedSeconds),
    rpsPeak: Math.max(0, ...perSecondBuckets.values()),
    latencyMs: {
      p50: round(percentile(latencies, 50)),
      p95: round(percentile(latencies, 95)),
      p99: round(percentile(latencies, 99))
    },
    ttfbMs: {
      p50: round(percentile(ttfbValues, 50)),
      p95: round(percentile(ttfbValues, 95)),
      p99: round(percentile(ttfbValues, 99))
    },
    statusCounts: samples.reduce((counts, sample) => {
      counts[sample.status] = (counts[sample.status] ?? 0) + 1;
      return counts;
    }, {})
  };
}

function evaluateThresholds(results, thresholdSet) {
  const failures = [];

  for (const result of results) {
    const endpointThreshold = {
      ...thresholdSet,
      ...(thresholds.endpoints[result.name] ?? {})
    };

    if (result.latencyMs.p99 > endpointThreshold.p99Ms) {
      failures.push(
        `${result.name} p99 ${result.latencyMs.p99}ms > ${endpointThreshold.p99Ms}ms`
      );
    }

    if (result.errorRatePercent > endpointThreshold.errorRatePercent) {
      failures.push(
        `${result.name} error rate ${result.errorRatePercent}% > ${endpointThreshold.errorRatePercent}%`
      );
    }
  }

  return failures;
}

function renderMarkdown(report) {
  const rows = report.results
    .map(
      (result) =>
        `| ${result.method} | \`${result.path}\` | ${result.requests} | ${result.latencyMs.p50} | ${result.latencyMs.p95} | ${result.latencyMs.p99} | ${result.ttfbMs.p95} | ${result.rpsSustained} | ${result.rpsPeak} | ${result.errorRatePercent}% |`
    )
    .join("\n");

  const thresholdLines =
    report.thresholdFailures.length === 0
      ? "No threshold failures."
      : report.thresholdFailures.map((failure) => `- ${failure}`).join("\n");

  return `# API Benchmark Summary

- Mode: ${report.mode}
- Target: ${report.target}
- Generated: ${report.generatedAt}
- Duration per endpoint: ${report.config.durationMs}ms
- Concurrency: ${report.config.concurrency}
- Warmup requests per endpoint: ${report.config.warmupRequests}
- Routes covered: ${report.results.length}

| Method | Path | Requests | p50 ms | p95 ms | p99 ms | p95 TTFB ms | Sustained RPS | Peak RPS | Error Rate |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
${rows}

## Thresholds

${thresholdLines}
`;
}

async function writeReports(report, resultsDir) {
  await fs.mkdir(resultsDir, { recursive: true });
  const jsonPath = path.join(resultsDir, "latest.json");
  const markdownPath = path.join(resultsDir, "latest.md");

  await fs.writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
  await fs.writeFile(markdownPath, renderMarkdown(report));

  return { jsonPath, markdownPath };
}

async function main() {
  const localServerRequested =
    process.env.BENCHMARK_START_LOCAL !== "false" &&
    !process.env.BENCHMARK_TARGET_URL;
  if (localServerRequested) {
    process.env.NODE_ENV = "benchmark";
  }
  const localServer = localServerRequested ? await startLocalServer() : null;
  const baseUrl =
    process.env.BENCHMARK_TARGET_URL ?? localServer?.baseUrl ?? "http://127.0.0.1:4000";

  const config = {
    baseUrl,
    durationMs: smokeMode ? 250 : envNumber("BENCHMARK_DURATION_MS", 5000),
    concurrency: smokeMode ? 1 : envNumber("BENCHMARK_CONCURRENCY", 8),
    warmupRequests: smokeMode ? 1 : envNumber("BENCHMARK_WARMUP_REQUESTS", 2),
    maxRequestsPerEndpoint: smokeMode
      ? 3
      : envNumber("BENCHMARK_MAX_REQUESTS_PER_ENDPOINT", Number.POSITIVE_INFINITY),
    authToken:
      process.env.BENCHMARK_AUTH_TOKEN ??
      signAccessToken({ sub: "usr_benchmark", role: "admin" })
  };

  const results = [];

  try {
    for (const route of benchmarkRoutes) {
      results.push(await runEndpoint(route, config));
    }
  } finally {
    if (localServer) {
      await localServer.close();
    }
  }

  const thresholdSet = smokeMode ? thresholds.smoke : thresholds.default;
  const thresholdFailures = evaluateThresholds(results, thresholdSet);
  const report = {
    mode: smokeMode ? "smoke" : "full",
    target: baseUrl,
    generatedAt: new Date().toISOString(),
    environment: {
      platform: os.platform(),
      release: os.release(),
      arch: os.arch(),
      cpus: os.cpus().map((cpu) => cpu.model),
      totalMemoryBytes: os.totalmem(),
      freeMemoryBytes: os.freemem(),
      node: process.version
    },
    config: {
      durationMs: config.durationMs,
      concurrency: config.concurrency,
      warmupRequests: config.warmupRequests,
      maxRequestsPerEndpoint: Number.isFinite(config.maxRequestsPerEndpoint)
        ? config.maxRequestsPerEndpoint
        : null
    },
    thresholdFailures,
    results
  };

  const resultsDir = path.resolve(
    rootDir,
    process.env.BENCHMARK_RESULTS_DIR ?? "benchmarks/results"
  );
  const written = await writeReports(report, resultsDir);

  console.log(`Benchmark JSON written to ${path.relative(rootDir, written.jsonPath)}`);
  console.log(
    `Benchmark summary written to ${path.relative(rootDir, written.markdownPath)}`
  );

  if (
    thresholdFailures.length > 0 &&
    process.env.BENCHMARK_FAIL_ON_THRESHOLD !== "false"
  ) {
    console.error("Benchmark threshold failures:");
    thresholdFailures.forEach((failure) => console.error(`- ${failure}`));
    process.exitCode = 1;
  }
}

await main();
