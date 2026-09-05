import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { createBenchmarkScenarios, discoverExpressRoutes } from "./routes.js";

const resultsDir = path.resolve("benchmarks/results");
const smoke = process.env.BENCHMARK_SMOKE === "true" || process.argv.includes("--smoke");
const config = {
  concurrency: Number(process.env.BENCHMARK_CONCURRENCY ?? (smoke ? 2 : 8)),
  durationMs: Number(process.env.BENCHMARK_DURATION_MS ?? (smoke ? 1200 : 8000)),
  warmupRequests: Number(process.env.BENCHMARK_WARMUP_REQUESTS ?? (smoke ? 1 : 3)),
  targetUrl: process.env.BENCHMARK_TARGET_URL ?? null
};

const thresholds = JSON.parse(await fs.readFile("benchmarks/thresholds.json", "utf8"));

async function main() {
  if (!config.targetUrl) {
    process.env.BENCHMARK_DISABLE_RATE_LIMIT ??= "true";
  }

  const { createApp } = await import("../apps/api/src/app.js");
  const app = createApp();
  const discoveredRoutes = discoverExpressRoutes(app);
  const scenarios = createBenchmarkScenarios(discoveredRoutes);
  const serverContext = await getServerContext(app);

  try {
    const startedAt = new Date().toISOString();
    const endpointResults = [];

    for (const scenario of scenarios) {
      await warmup(serverContext.baseUrl, scenario);
      endpointResults.push(await benchmarkScenario(serverContext.baseUrl, scenario));
    }

    const report = {
      startedAt,
      completedAt: new Date().toISOString(),
      environment: getEnvironment(),
      config,
      discoveredRoutes,
      results: endpointResults,
      thresholdSummary: summarizeThresholds(endpointResults)
    };

    await fs.mkdir(resultsDir, { recursive: true });
    await fs.writeFile(path.join(resultsDir, "latest.json"), `${JSON.stringify(report, null, 2)}\n`);
    await fs.writeFile(path.join(resultsDir, "latest.md"), renderMarkdown(report));

    const failures = report.thresholdSummary.filter((item) => !item.passed);
    if (failures.length > 0) {
      console.error(`Benchmark thresholds failed for ${failures.length} endpoint(s).`);
      process.exitCode = 1;
    }
  } finally {
    await serverContext.close();
  }
}

async function getServerContext(app) {
  if (config.targetUrl) {
    return {
      baseUrl: config.targetUrl.replace(/\/$/, ""),
      close: async () => {}
    };
  }

  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())))
  };
}

async function warmup(baseUrl, scenario) {
  for (let index = 0; index < config.warmupRequests; index += 1) {
    await runRequest(baseUrl, scenario);
  }
}

async function benchmarkScenario(baseUrl, scenario) {
  const deadline = performance.now() + config.durationMs;
  const workers = Array.from({ length: config.concurrency }, async () => {
    const samples = [];
    while (performance.now() < deadline) {
      samples.push(await runRequest(baseUrl, scenario));
    }
    return samples;
  });

  const samples = (await Promise.all(workers)).flat();
  const latencies = samples.map((sample) => sample.ms).sort((a, b) => a - b);
  const errors = samples.filter((sample) => sample.status >= 400 || sample.error).length;
  const durationSeconds = config.durationMs / 1000;

  return {
    name: `${scenario.method} ${scenario.path}`,
    description: scenario.description,
    method: scenario.method,
    path: scenario.path,
    requests: samples.length,
    requestsPerSecond: round(samples.length / durationSeconds),
    errorRate: round(errors / Math.max(samples.length, 1), 4),
    statusCodes: countBy(samples.map((sample) => sample.status ?? "error")),
    latencyMs: {
      p50: percentile(latencies, 50),
      p95: percentile(latencies, 95),
      p99: percentile(latencies, 99)
    },
    ttfbMs: {
      p50: percentile(latencies, 50),
      p95: percentile(latencies, 95),
      p99: percentile(latencies, 99)
    }
  };
}

async function runRequest(baseUrl, scenario) {
  const started = performance.now();
  try {
    const init = {
      method: scenario.method,
      headers: { ...scenario.headers }
    };

    if (scenario.json) {
      init.headers["content-type"] = "application/json";
      init.body = JSON.stringify(scenario.json);
    }

    if (scenario.formData) {
      init.body = scenario.formData();
    }

    const response = await fetch(`${baseUrl}${scenario.path}`, init);
    await response.arrayBuffer();
    return { ms: performance.now() - started, status: response.status };
  } catch (error) {
    return { ms: performance.now() - started, error: error.message };
  }
}

function summarizeThresholds(results) {
  return results.map((result) => {
    const threshold = thresholds[result.name] ?? thresholds.default;
    const failures = [];

    if (result.latencyMs.p99 > threshold.p99Ms) {
      failures.push(`p99 ${result.latencyMs.p99}ms > ${threshold.p99Ms}ms`);
    }
    if (result.errorRate > threshold.errorRate) {
      failures.push(`error rate ${result.errorRate} > ${threshold.errorRate}`);
    }
    if (result.requestsPerSecond < threshold.minRequestsPerSecond) {
      failures.push(`rps ${result.requestsPerSecond} < ${threshold.minRequestsPerSecond}`);
    }

    return { name: result.name, passed: failures.length === 0, failures };
  });
}

function renderMarkdown(report) {
  const rows = report.results
    .map((result) => {
      const threshold = report.thresholdSummary.find((item) => item.name === result.name);
      return `| ${result.name} | ${result.requests} | ${result.requestsPerSecond} | ${result.errorRate} | ${result.latencyMs.p50} | ${result.latencyMs.p95} | ${result.latencyMs.p99} | ${threshold?.passed ? "pass" : "fail"} |`;
    })
    .join("\n");

  return `# API benchmark report\n\n` +
    `Started: ${report.startedAt}\n\n` +
    `Environment: ${report.environment.node} on ${report.environment.platform} ${report.environment.arch}, ${report.environment.cpuCount} CPU(s), ${report.environment.totalMemoryGb} GB RAM\n\n` +
    `Config: concurrency ${report.config.concurrency}, duration ${report.config.durationMs}ms, warmup ${report.config.warmupRequests}\n\n` +
    `| Endpoint | Requests | RPS | Error rate | p50 ms | p95 ms | p99 ms | Threshold |\n` +
    `| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |\n` +
    `${rows}\n`;
}

function getEnvironment() {
  return {
    node: process.version,
    platform: process.platform,
    arch: process.arch,
    cpuCount: os.cpus().length,
    totalMemoryGb: round(os.totalmem() / 1024 / 1024 / 1024)
  };
}

function percentile(values, target) {
  if (values.length === 0) {
    return 0;
  }
  const index = Math.ceil((target / 100) * values.length) - 1;
  return round(values[Math.max(0, Math.min(index, values.length - 1))]);
}

function countBy(values) {
  return values.reduce((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

function round(value, decimals = 2) {
  return Number(value.toFixed(decimals));
}

await main();
