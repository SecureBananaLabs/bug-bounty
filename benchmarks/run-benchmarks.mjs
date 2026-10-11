import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { performance } from "node:perf_hooks";
import { cpus, freemem, platform, release, totalmem } from "node:os";
import jwt from "jsonwebtoken";
import { createApp } from "../apps/api/src/app.js";
import { scenarios } from "./scenarios.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..");
const thresholdsPath = resolve(here, "thresholds.json");
const args = new Set(process.argv.slice(2));
const smoke = args.has("--smoke");
const runId = new Date().toISOString().replace(/[:.]/g, "-");

const config = {
  concurrency: numberFromEnv("BENCHMARK_CONCURRENCY", smoke ? 1 : 2),
  samples: numberFromEnv("BENCHMARK_SAMPLES", smoke ? 2 : 8),
  resultsDir: resolve(repoRoot, process.env.BENCHMARK_RESULTS_DIR ?? "benchmarks/results"),
  targetUrl: process.env.BENCHMARK_TARGET_URL,
  jwtSecret: process.env.BENCHMARK_JWT_SECRET ?? process.env.JWT_SECRET ?? "development-secret",
  authToken: process.env.BENCHMARK_AUTH_TOKEN
};

const server = config.targetUrl ? null : await startLocalServer();
const baseUrl = config.targetUrl ?? server.baseUrl;
const authToken =
  config.authToken ||
  jwt.sign({ sub: "benchmark-admin", role: "admin" }, config.jwtSecret, { expiresIn: "15m" });

try {
  const thresholds = JSON.parse(await readFile(thresholdsPath, "utf8"));
  const results = [];

  for (const scenario of scenarios) {
    results.push(await runScenario(scenario, baseUrl, authToken));
  }

  const report = buildReport(results, thresholds, {
    runId,
    smoke,
    baseUrl,
    samples: config.samples,
    concurrency: config.concurrency
  });

  await mkdir(config.resultsDir, { recursive: true });
  const jsonPath = resolve(config.resultsDir, `${runId}${smoke ? "-smoke" : ""}.json`);
  const mdPath = resolve(config.resultsDir, `${runId}${smoke ? "-smoke" : ""}.md`);
  await writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
  await writeFile(mdPath, renderMarkdown(report));

  console.log(`Benchmark complete: ${report.summary.totalEndpoints} endpoints`);
  console.log(`JSON: ${jsonPath}`);
  console.log(`Markdown: ${mdPath}`);

  if (report.summary.failedThresholds.length > 0) {
    console.error("Benchmark threshold failures:");
    for (const failure of report.summary.failedThresholds) {
      console.error(`- ${failure.endpoint}: ${failure.reason}`);
    }
    process.exitCode = 1;
  }
} finally {
  if (server) {
    await new Promise((resolve, reject) => {
      server.instance.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

function numberFromEnv(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

async function startLocalServer() {
  const app = createApp();
  const instance = app.listen(0);
  await new Promise((resolveWait, rejectWait) => {
    instance.once("listening", resolveWait);
    instance.once("error", rejectWait);
  });
  const { port } = instance.address();
  return {
    instance,
    baseUrl: `http://127.0.0.1:${port}`
  };
}

async function runScenario(scenario, baseUrl, token) {
  const samples = [];
  const started = performance.now();
  let nextIteration = 0;

  async function worker() {
    while (nextIteration < config.samples) {
      const iteration = nextIteration++;
      samples.push(await executeRequest(scenario, baseUrl, token, iteration));
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(config.concurrency, config.samples) }, () => worker())
  );

  const elapsedMs = performance.now() - started;
  const latencies = samples.map((sample) => sample.latencyMs).sort((a, b) => a - b);
  const ttfb = samples.map((sample) => sample.ttfbMs).sort((a, b) => a - b);
  const successCount = samples.filter((sample) => sample.ok).length;
  const errorCount = samples.length - successCount;
  const peakRps = highestBucketRps(samples);

  return {
    name: scenario.name,
    method: scenario.method,
    path: scenario.path,
    samples: samples.length,
    successCount,
    errorCount,
    errorRatePercent: percentage(errorCount, samples.length),
    sustainedRps: round(samples.length / (elapsedMs / 1000)),
    peakRps,
    latencyMs: {
      p50: percentile(latencies, 50),
      p95: percentile(latencies, 95),
      p99: percentile(latencies, 99),
      min: round(latencies[0] ?? 0),
      max: round(latencies.at(-1) ?? 0)
    },
    ttfbMs: {
      p50: percentile(ttfb, 50),
      p95: percentile(ttfb, 95),
      p99: percentile(ttfb, 99)
    },
    statuses: countBy(samples.map((sample) => sample.status)),
    failures: samples
      .filter((sample) => !sample.ok)
      .slice(0, 5)
      .map(({ status, error }) => ({ status, error }))
  };
}

async function executeRequest(scenario, baseUrl, token, iteration) {
  const requestStarted = performance.now();
  const headers = {};
  const expectedStatuses = scenario.expectedStatuses ?? [200];
  let body;

  if (scenario.auth) {
    headers.authorization = `Bearer ${token}`;
  }

  if (scenario.json) {
    headers["content-type"] = "application/json";
    body = JSON.stringify(scenario.json({ runId, iteration }));
  } else if (scenario.formData) {
    body = scenario.formData({ runId, iteration });
  }

  try {
    const response = await fetch(new URL(scenario.path, baseUrl), {
      method: scenario.method,
      headers,
      body
    });
    const firstByteMs = performance.now();
    await response.arrayBuffer();
    const finishedMs = performance.now();

    return {
      status: response.status,
      ok: expectedStatuses.includes(response.status),
      ttfbMs: round(firstByteMs - requestStarted),
      latencyMs: round(finishedMs - requestStarted),
      bucket: Math.floor(requestStarted / 1000)
    };
  } catch (error) {
    const finishedMs = performance.now();
    return {
      status: "network-error",
      ok: false,
      error: error.message,
      ttfbMs: round(finishedMs - requestStarted),
      latencyMs: round(finishedMs - requestStarted),
      bucket: Math.floor(requestStarted / 1000)
    };
  }
}

function buildReport(results, thresholds, metadata) {
  const failedThresholds = [];

  for (const result of results) {
    const threshold = {
      ...thresholds.default,
      ...(thresholds.endpoints?.[result.name] ?? {})
    };

    if (result.latencyMs.p99 > threshold.p99LatencyMs) {
      failedThresholds.push({
        endpoint: result.name,
        reason: `p99 latency ${result.latencyMs.p99}ms > ${threshold.p99LatencyMs}ms`
      });
    }

    if (result.errorRatePercent > threshold.errorRatePercent) {
      failedThresholds.push({
        endpoint: result.name,
        reason: `error rate ${result.errorRatePercent}% > ${threshold.errorRatePercent}%`
      });
    }
  }

  return {
    metadata: {
      ...metadata,
      generatedAt: new Date().toISOString(),
      node: process.version,
      os: `${platform()} ${release()}`,
      cpu: cpus()[0]?.model ?? "unknown",
      cpuCount: cpus().length,
      totalMemoryBytes: totalmem(),
      freeMemoryBytes: freemem()
    },
    summary: {
      totalEndpoints: results.length,
      totalRequests: results.reduce((sum, result) => sum + result.samples, 0),
      failedThresholds
    },
    results
  };
}

function renderMarkdown(report) {
  const rows = report.results
    .map(
      (result) =>
        `| ${result.name} | ${result.method} ${result.path} | ${result.samples} | ${result.latencyMs.p50} | ${result.latencyMs.p95} | ${result.latencyMs.p99} | ${result.ttfbMs.p95} | ${result.sustainedRps} | ${result.peakRps} | ${result.errorRatePercent}% |`
    )
    .join("\n");
  const thresholdText =
    report.summary.failedThresholds.length === 0
      ? "All benchmark thresholds passed."
      : report.summary.failedThresholds
          .map((failure) => `- ${failure.endpoint}: ${failure.reason}`)
          .join("\n");

  return `# API Benchmark Summary

- Run ID: ${report.metadata.runId}
- Mode: ${report.metadata.smoke ? "smoke" : "full"}
- Target: ${report.metadata.baseUrl}
- Samples per endpoint: ${report.metadata.samples}
- Concurrency: ${report.metadata.concurrency}
- Node.js: ${report.metadata.node}
- OS: ${report.metadata.os}
- CPU: ${report.metadata.cpu} (${report.metadata.cpuCount} logical cores)
- Memory: ${formatBytes(report.metadata.freeMemoryBytes)} free / ${formatBytes(report.metadata.totalMemoryBytes)} total

## Threshold Result

${thresholdText}

## Endpoint Metrics

| Endpoint | Route | Samples | p50 ms | p95 ms | p99 ms | p95 TTFB ms | Sustained RPS | Peak RPS | Error Rate |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
${rows}
`;
}

function percentile(sorted, percent) {
  if (sorted.length === 0) return 0;
  const index = Math.ceil((percent / 100) * sorted.length) - 1;
  return round(sorted[Math.min(Math.max(index, 0), sorted.length - 1)]);
}

function percentage(value, total) {
  if (total === 0) return 0;
  return round((value / total) * 100);
}

function round(value) {
  return Math.round(value * 100) / 100;
}

function countBy(values) {
  return values.reduce((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

function highestBucketRps(samples) {
  const counts = Object.values(countBy(samples.map((sample) => sample.bucket)));
  return counts.length === 0 ? 0 : Math.max(...counts);
}

function formatBytes(bytes) {
  return `${Math.round(bytes / 1024 / 1024)} MiB`;
}
