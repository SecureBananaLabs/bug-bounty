import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";
import { createApp } from "../apps/api/src/app.js";
import { benchmarkScenarios } from "./scenarios.mjs";
import thresholds from "./thresholds.json" with { type: "json" };

const args = new Set(process.argv.slice(2));
const isSmoke = args.has("--smoke");
const iterations = Number(process.env.BENCHMARK_ITERATIONS ?? (isSmoke ? 1 : 5));
const outDir = resolve(process.env.BENCHMARK_RESULTS_DIR ?? "benchmarks/results");
const targetFromEnv = process.env.BENCHMARK_TARGET_URL;

function percentile(values, percentileValue) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((percentileValue / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(sorted.length - 1, index))];
}

function formatMs(value) {
  return Number(value.toFixed(2));
}

async function startLocalServer() {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolveListener, reject) => {
    server.once("listening", resolveListener);
    server.once("error", reject);
  });

  const { port } = server.address();
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolveClose, reject) => {
      server.close((error) => (error ? reject(error) : resolveClose()));
    })
  };
}

async function fetchBenchmarkToken(baseUrl) {
  if (process.env.BENCHMARK_AUTH_TOKEN) {
    return process.env.BENCHMARK_AUTH_TOKEN;
  }

  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email: "benchmark-client@example.test",
      password: "benchmark-password"
    })
  });
  const payload = await response.json();
  return payload.data.token;
}

function requestInitForScenario(scenario, token) {
  const headers = {};
  let body;

  if (scenario.auth) {
    headers.authorization = `Bearer ${token}`;
  }

  if (scenario.multipart) {
    const formData = new FormData();
    formData.set("file", new Blob([scenario.fileContents], { type: "text/plain" }), scenario.fileName);
    body = formData;
  } else if (scenario.body) {
    headers["content-type"] = "application/json";
    body = JSON.stringify(scenario.body);
  }

  return {
    method: scenario.method,
    headers,
    body
  };
}

async function runScenario(baseUrl, scenario, token) {
  const latencies = [];
  const ttfbs = [];
  const statuses = {};
  let errors = 0;
  const startedAt = performance.now();

  for (let index = 0; index < iterations; index += 1) {
    const requestStart = performance.now();
    try {
      const response = await fetch(`${baseUrl}${scenario.path}`, requestInitForScenario(scenario, token));
      const firstByteAt = performance.now();
      await response.arrayBuffer();
      const finishedAt = performance.now();
      const expectedStatuses = scenario.expectedStatuses ?? [scenario.expectedStatus ?? 200];
      latencies.push(finishedAt - requestStart);
      ttfbs.push(firstByteAt - requestStart);
      statuses[response.status] = (statuses[response.status] ?? 0) + 1;
      if (!expectedStatuses.includes(response.status)) {
        errors += 1;
      }
    } catch (error) {
      errors += 1;
      latencies.push(performance.now() - requestStart);
      statuses.error = (statuses.error ?? 0) + 1;
    }
  }

  const elapsedSeconds = Math.max((performance.now() - startedAt) / 1000, 0.001);
  const sustainedRps = Number((iterations / elapsedSeconds).toFixed(2));
  const peakRps = Number(Math.max(...latencies.map((latency) => 1000 / Math.max(latency, 0.001))).toFixed(2));
  return {
    name: scenario.name,
    method: scenario.method,
    path: scenario.path,
    tags: scenario.tags,
    iterations,
    statuses,
    p50_ms: formatMs(percentile(latencies, 50)),
    p95_ms: formatMs(percentile(latencies, 95)),
    p99_ms: formatMs(percentile(latencies, 99)),
    ttfb_p95_ms: formatMs(percentile(ttfbs, 95)),
    requests_per_second: sustainedRps,
    sustained_requests_per_second: sustainedRps,
    peak_requests_per_second: peakRps,
    error_rate: Number((errors / iterations).toFixed(4))
  };
}

function evaluateThresholds(results) {
  const failures = [];
  for (const result of results) {
    const threshold = thresholds[result.method]?.[result.path] ?? thresholds.default;
    if (result.p99_ms > threshold.p99_ms) {
      failures.push(`${result.method} ${result.path} p99 ${result.p99_ms}ms > ${threshold.p99_ms}ms`);
    }
    if (result.error_rate > threshold.error_rate) {
      failures.push(`${result.method} ${result.path} error rate ${result.error_rate} > ${threshold.error_rate}`);
    }
  }
  return failures;
}

function renderMarkdown(report) {
  const rows = report.results
    .map((result) => `| ${result.method} ${result.path} | ${result.p50_ms} | ${result.p95_ms} | ${result.p99_ms} | ${result.ttfb_p95_ms} | ${result.sustained_requests_per_second} | ${result.peak_requests_per_second} | ${result.error_rate} |`)
    .join("\n");

  return `# API Benchmark Summary

- Mode: ${report.mode}
- Target: ${report.target}
- Iterations per endpoint: ${report.iterations}
- Endpoint scenarios: ${report.results.length}
- Overall max p99: ${report.summary.max_p99_ms} ms
- Overall max error rate: ${report.summary.max_error_rate}

| Endpoint | p50 ms | p95 ms | p99 ms | TTFB p95 ms | Sustained RPS | Peak RPS | Error rate |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
${rows}
`;
}

async function main() {
  let localServer;
  const baseUrl = targetFromEnv ?? (localServer = await startLocalServer()).baseUrl;

  try {
    const token = await fetchBenchmarkToken(baseUrl);
    const results = [];
    for (const scenario of benchmarkScenarios) {
      results.push(await runScenario(baseUrl, scenario, token));
    }

    const report = {
      mode: isSmoke ? "smoke" : "full",
      target: targetFromEnv ? "external" : "local",
      generated_at: new Date().toISOString(),
      iterations,
      results,
      summary: {
        max_p99_ms: Math.max(...results.map((result) => result.p99_ms)),
        max_error_rate: Math.max(...results.map((result) => result.error_rate)),
        endpoint_count: results.length
      }
    };

    await mkdir(outDir, { recursive: true });
    const name = isSmoke ? "latest-smoke" : "latest-full";
    const jsonPath = resolve(outDir, `${name}.json`);
    const markdownPath = resolve(outDir, `${name}.md`);
    await writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
    await writeFile(markdownPath, renderMarkdown(report));

    console.log(renderMarkdown(report));
    const failures = evaluateThresholds(results);
    if (failures.length > 0) {
      console.error("Benchmark threshold failures:");
      for (const failure of failures) console.error(`- ${failure}`);
      process.exitCode = 1;
    }
  } finally {
    await localServer?.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
