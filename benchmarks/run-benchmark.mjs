import { mkdir, readFile, writeFile } from "node:fs/promises";
import http from "node:http";
import https from "node:https";
import os from "node:os";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const configPath = path.join(__dirname, "benchmark.config.json");
const thresholdsPath = path.join(__dirname, "thresholds.json");
const resultsDir = path.join(__dirname, "results");

function percentile(values, p) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
}

function round(value, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

async function loadJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

function buildRequestOptions(baseUrl, endpoint, timeoutMs) {
  const url = new URL(endpoint.path, baseUrl);
  const body = endpoint.body ? JSON.stringify(endpoint.body) : null;
  return {
    url,
    body,
    options: {
      method: endpoint.method ?? "GET",
      headers: {
        ...(endpoint.headers ?? {}),
        ...(body ? { "content-length": Buffer.byteLength(body) } : {})
      },
      timeout: timeoutMs
    }
  };
}

function requestOnce(baseUrl, endpoint, timeoutMs) {
  const { url, body, options } = buildRequestOptions(baseUrl, endpoint, timeoutMs);
  const client = url.protocol === "https:" ? https : http;
  const startedAt = performance.now();

  return new Promise((resolve) => {
    const req = client.request(url, options, (res) => {
      let firstByteAt = null;
      res.once("data", () => {
        firstByteAt = performance.now();
      });
      res.resume();
      res.on("end", () => {
        const endedAt = performance.now();
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 500,
          statusCode: res.statusCode,
          latencyMs: endedAt - startedAt,
          ttfbMs: (firstByteAt ?? endedAt) - startedAt
        });
      });
    });

    req.on("timeout", () => {
      req.destroy(new Error("request timeout"));
    });
    req.on("error", (error) => {
      const endedAt = performance.now();
      resolve({
        ok: false,
        statusCode: 0,
        error: error.message,
        latencyMs: endedAt - startedAt,
        ttfbMs: endedAt - startedAt
      });
    });

    if (body) req.write(body);
    req.end();
  });
}

async function benchmarkEndpoint(baseUrl, endpoint, settings) {
  const deadline = performance.now() + settings.durationSeconds * 1000;
  const samples = [];

  async function worker() {
    while (performance.now() < deadline) {
      samples.push(await requestOnce(baseUrl, endpoint, settings.timeoutMs));
    }
  }

  const startedAt = performance.now();
  await Promise.all(Array.from({ length: settings.concurrency }, worker));
  const elapsedSeconds = (performance.now() - startedAt) / 1000;
  const latencies = samples.map((sample) => sample.latencyMs);
  const ttfbs = samples.map((sample) => sample.ttfbMs);
  const errors = samples.filter((sample) => !sample.ok).length;

  return {
    name: endpoint.name,
    method: endpoint.method ?? "GET",
    path: endpoint.path,
    requests: samples.length,
    elapsedSeconds: round(elapsedSeconds),
    sustainedRps: round(samples.length / elapsedSeconds),
    peakRps: round(samples.length / Math.max(1, Math.floor(elapsedSeconds))),
    errorRatePercent: round((errors / Math.max(samples.length, 1)) * 100),
    latencyMs: {
      p50: round(percentile(latencies, 50)),
      p95: round(percentile(latencies, 95)),
      p99: round(percentile(latencies, 99))
    },
    ttfbMs: {
      p50: round(percentile(ttfbs, 50)),
      p95: round(percentile(ttfbs, 95)),
      p99: round(percentile(ttfbs, 99))
    },
    statusCodes: samples.reduce((counts, sample) => {
      counts[sample.statusCode] = (counts[sample.statusCode] ?? 0) + 1;
      return counts;
    }, {})
  };
}

function thresholdFor(result, thresholds) {
  return {
    ...(thresholds.default ?? {}),
    ...(thresholds.endpoints?.[result.name] ?? {})
  };
}

function evaluateThresholds(results, thresholds) {
  return results.map((result) => {
    const threshold = thresholdFor(result, thresholds);
    const failures = [];
    if (threshold.p99LatencyMs && result.latencyMs.p99 > threshold.p99LatencyMs) {
      failures.push(`p99 ${result.latencyMs.p99}ms > ${threshold.p99LatencyMs}ms`);
    }
    if (
      threshold.errorRatePercent !== undefined &&
      result.errorRatePercent > threshold.errorRatePercent
    ) {
      failures.push(`error rate ${result.errorRatePercent}% > ${threshold.errorRatePercent}%`);
    }
    return {
      endpoint: result.name,
      passed: failures.length === 0,
      failures
    };
  });
}

function renderMarkdown(report) {
  const rows = report.results
    .map(
      (result) =>
        `| ${result.name} | ${result.method} ${result.path} | ${result.requests} | ${result.sustainedRps} | ${result.errorRatePercent}% | ${result.latencyMs.p50} | ${result.latencyMs.p95} | ${result.latencyMs.p99} | ${result.ttfbMs.p50} | ${result.ttfbMs.p95} | ${result.ttfbMs.p99} |`
    )
    .join("\n");

  const gateRows = report.gate
    .map((item) => `| ${item.endpoint} | ${item.passed ? "pass" : "fail"} | ${item.failures.join("; ")} |`)
    .join("\n");

  return `# API Benchmark Summary

Generated: ${report.generatedAt}

Target: \`${report.settings.baseUrl}\`

Duration: ${report.settings.durationSeconds}s per endpoint
Concurrency: ${report.settings.concurrency}

## Results

| Endpoint | Route | Requests | Sustained RPS | Error Rate | p50 ms | p95 ms | p99 ms | TTFB p50 ms | TTFB p95 ms | TTFB p99 ms |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
${rows}

## Regression Gate

| Endpoint | Status | Details |
| --- | --- | --- |
${gateRows}

## Benchmark Environment

- CPU model & core count: ${report.environment.cpu}
- RAM: ${report.environment.totalMemoryGb} GB
- Machine type: local workstation or CI runner
- OS: ${report.environment.platform} ${report.environment.release}
- Node.js: ${report.environment.node}

## AI Agent Disclosure

- Agent or tool name: Codex
- Execution mode: human-supervised
- Shell/tool access: yes
- Internet access: yes
- Benchmark commands run by agent directly: yes
`;
}

async function main() {
  const config = await loadJson(configPath);
  const thresholds = await loadJson(thresholdsPath);
  const settings = {
    baseUrl: process.env.BENCHMARK_BASE_URL ?? config.targetBaseUrl,
    durationSeconds: Number(process.env.BENCHMARK_DURATION_SECONDS ?? config.durationSeconds),
    concurrency: Number(process.env.BENCHMARK_CONCURRENCY ?? config.concurrency),
    timeoutMs: Number(process.env.BENCHMARK_TIMEOUT_MS ?? config.timeoutMs)
  };

  const results = [];
  for (const endpoint of config.endpoints) {
    console.log(`Benchmarking ${endpoint.method ?? "GET"} ${endpoint.path}`);
    results.push(await benchmarkEndpoint(settings.baseUrl, endpoint, settings));
  }

  const report = {
    generatedAt: new Date().toISOString(),
    settings,
    environment: {
      cpu: `${os.cpus()[0]?.model ?? "unknown"} (${os.cpus().length} cores)`,
      totalMemoryGb: round(os.totalmem() / 1024 / 1024 / 1024),
      platform: os.platform(),
      release: os.release(),
      node: process.version
    },
    results,
    gate: evaluateThresholds(results, thresholds)
  };

  await mkdir(resultsDir, { recursive: true });
  await writeFile(path.join(resultsDir, "latest.json"), `${JSON.stringify(report, null, 2)}\n`);
  await writeFile(path.join(resultsDir, "latest.md"), renderMarkdown(report));

  const failed = report.gate.filter((item) => !item.passed);
  if (failed.length) {
    console.error("Benchmark threshold failures:");
    for (const item of failed) console.error(`- ${item.endpoint}: ${item.failures.join("; ")}`);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
