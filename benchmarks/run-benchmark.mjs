import { mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";
import { createApp } from "../apps/api/src/app.js";
import { endpoints } from "./endpoints.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const resultsDir = path.join(rootDir, "benchmarks", "results");
const thresholdsPath = path.join(rootDir, "benchmarks", "thresholds.json");

const args = new Set(process.argv.slice(2));
const smoke = args.has("--smoke");
const failOnThreshold = args.has("--fail-on-threshold");

const config = {
  targetUrl: process.env.BENCHMARK_TARGET_URL || "",
  requestsPerEndpoint: Number(process.env.BENCHMARK_REQUESTS_PER_ENDPOINT || (smoke ? 2 : 8)),
  concurrency: Number(process.env.BENCHMARK_CONCURRENCY || (smoke ? 1 : 4)),
  cooldownMs: Number(process.env.BENCHMARK_COOLDOWN_MS || 30)
};

function percentile(values, rank) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((rank / 100) * sorted.length) - 1);
  return sorted[index];
}

function round(value, places = 2) {
  return Number(value.toFixed(places));
}

async function withServer(run) {
  if (config.targetUrl) {
    return run(config.targetUrl.replace(/\/$/, ""), null);
  }

  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    return await run(`http://127.0.0.1:${port}`, server);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function loadThresholds() {
  return JSON.parse(await readFile(thresholdsPath, "utf8"));
}

async function oneRequest(baseUrl, endpoint) {
  const request = endpoint.request();
  const start = performance.now();
  let status = 0;
  let ok = false;
  let ttfbMs = 0;
  let error = "";

  try {
    const response = await fetch(`${baseUrl}${endpoint.path}`, {
      method: endpoint.method,
      headers: request.headers,
      body: request.body
    });
    ttfbMs = performance.now() - start;
    status = response.status;
    await response.arrayBuffer();
    ok = response.status >= 200 && response.status < 400;
  } catch (requestError) {
    error = requestError instanceof Error ? requestError.message : String(requestError);
  }

  return {
    durationMs: performance.now() - start,
    completedAt: performance.now(),
    ttfbMs,
    status,
    ok,
    error
  };
}

async function runEndpoint(baseUrl, endpoint) {
  const samples = [];
  let nextRequest = 0;
  const workers = Array.from({ length: config.concurrency }, async () => {
    while (true) {
      const requestIndex = nextRequest;
      nextRequest += 1;
      if (requestIndex >= config.requestsPerEndpoint) {
        break;
      }
      samples.push(await oneRequest(baseUrl, endpoint));
    }
  });

  const startedAt = performance.now();
  await Promise.all(workers);
  const elapsedMs = performance.now() - startedAt;

  const latencies = samples.map((sample) => sample.durationMs);
  const ttfb = samples.map((sample) => sample.ttfbMs).filter((value) => value > 0);
  const failures = samples.filter((sample) => !sample.ok);
  const peakBucketCounts = samples.reduce((acc, sample) => {
    const bucket = Math.floor((sample.completedAt - startedAt) / 1000);
    acc[bucket] = (acc[bucket] || 0) + 1;
    return acc;
  }, {});
  const peakRps = Math.max(...Object.values(peakBucketCounts), 0);
  const statuses = samples.reduce((acc, sample) => {
    const key = String(sample.status || "network_error");
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  await new Promise((resolve) => setTimeout(resolve, config.cooldownMs));

  return {
    name: endpoint.name,
    method: endpoint.method,
    path: endpoint.path,
    requests: samples.length,
    durationMs: round(elapsedMs),
    rps: round(samples.length / (elapsedMs / 1000)),
    peakRps,
    sustainedRps: round(samples.length / (elapsedMs / 1000)),
    errorRate: round((failures.length / Math.max(samples.length, 1)) * 100),
    statusCounts: statuses,
    latencyMs: {
      p50: round(percentile(latencies, 50)),
      p95: round(percentile(latencies, 95)),
      p99: round(percentile(latencies, 99))
    },
    ttfbMs: {
      p50: round(percentile(ttfb, 50)),
      p95: round(percentile(ttfb, 95)),
      p99: round(percentile(ttfb, 99))
    },
    errors: [...new Set(failures.map((sample) => sample.error).filter(Boolean))].slice(0, 5)
  };
}

function environment() {
  return {
    node: process.version,
    platform: `${os.type()} ${os.release()} ${os.arch()}`,
    cpuModel: os.cpus()[0]?.model || "unknown",
    cpuCount: os.cpus().length,
    totalMemoryBytes: os.totalmem(),
    freeMemoryBytes: os.freemem(),
    machine: os.hostname(),
    network: config.targetUrl ? "configured target" : "loopback"
  };
}

function thresholdFailures(results, thresholds) {
  return results.flatMap((result) => {
    const failures = [];
    if (result.latencyMs.p99 > thresholds.default.p99LatencyMs) {
      failures.push(`${result.name} p99 ${result.latencyMs.p99}ms > ${thresholds.default.p99LatencyMs}ms`);
    }
    if (result.errorRate > thresholds.default.errorRatePercent) {
      failures.push(`${result.name} error rate ${result.errorRate}% > ${thresholds.default.errorRatePercent}%`);
    }
    return failures;
  });
}

function markdownReport(report, failures) {
  const rows = report.results.map((result) => (
    `| ${result.name} | ${result.method} ${result.path} | ${result.requests} | ${result.rps} | ${result.latencyMs.p50} | ${result.latencyMs.p95} | ${result.latencyMs.p99} | ${result.ttfbMs.p95} | ${result.errorRate}% | ${Object.entries(result.statusCounts).map(([status, count]) => `${status}:${count}`).join(", ")} |`
  ));

  return [
    "# API Benchmark Report",
    "",
    `Generated: ${report.generatedAt}`,
    `Mode: ${report.mode}`,
    `Target: ${report.targetUrl}`,
    "",
    "## Environment",
    "",
    `- Node.js: ${report.environment.node}`,
    `- Platform: ${report.environment.platform}`,
    `- CPU: ${report.environment.cpuModel} (${report.environment.cpuCount} logical cores)`,
    `- Memory: ${Math.round(report.environment.freeMemoryBytes / 1024 / 1024)} MiB free / ${Math.round(report.environment.totalMemoryBytes / 1024 / 1024)} MiB total`,
    `- Network: ${report.environment.network}`,
    "",
    "## Results",
    "",
    "| Endpoint | Route | Requests | RPS | p50 ms | p95 ms | p99 ms | TTFB p95 ms | Error rate | Statuses |",
    "| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |",
    ...rows,
    "",
    "## Thresholds",
    "",
    `- p99 latency threshold: ${report.thresholds.default.p99LatencyMs} ms`,
    `- error-rate threshold: ${report.thresholds.default.errorRatePercent}%`,
    failures.length ? `- Failures: ${failures.join("; ")}` : "- Failures: none",
    ""
  ].join("\n");
}

await mkdir(resultsDir, { recursive: true });
const thresholds = await loadThresholds();

const report = await withServer(async (baseUrl) => {
  const results = [];
  for (const endpoint of endpoints) {
    results.push(await runEndpoint(baseUrl, endpoint));
  }

  return {
    generatedAt: new Date().toISOString(),
    mode: smoke ? "smoke" : "full",
    targetUrl: baseUrl,
    config,
    thresholds,
    environment: environment(),
    results
  };
});

const failures = thresholdFailures(report.results, thresholds);
const timestamp = report.generatedAt.replace(/[:.]/g, "-");
const json = JSON.stringify(report, null, 2);
const markdown = markdownReport(report, failures);

await writeFile(path.join(resultsDir, `benchmark-${timestamp}.json`), `${json}\n`);
await writeFile(path.join(resultsDir, `benchmark-${timestamp}.md`), markdown);
await writeFile(path.join(resultsDir, "latest.json"), `${json}\n`);
await writeFile(path.join(resultsDir, "latest.md"), markdown);

console.log(markdown);

if (failOnThreshold && failures.length > 0) {
  console.error(`Benchmark threshold failures:\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
