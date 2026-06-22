import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";
import jwt from "jsonwebtoken";
import { buildRequest, endpointRegistry } from "./api/endpoints.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const profileDefaults = {
  full: {
    durationSeconds: 5,
    connections: 10,
    pipelining: 1,
    ttfbSamples: 5
  },
  smoke: {
    durationSeconds: 1,
    connections: 2,
    pipelining: 1,
    ttfbSamples: 2
  }
};

function parseArgs(argv) {
  const args = {
    profile: "full",
    failOnThreshold: true
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--profile") {
      args.profile = argv[index + 1];
      index += 1;
    } else if (arg === "--target") {
      args.targetUrl = argv[index + 1];
      index += 1;
    } else if (arg === "--env") {
      args.envFile = argv[index + 1];
      index += 1;
    } else if (arg === "--no-fail-on-threshold") {
      args.failOnThreshold = false;
    }
  }

  if (!profileDefaults[args.profile]) {
    throw new Error(`Unknown benchmark profile: ${args.profile}`);
  }

  return args;
}

async function loadEnvFile(envFile) {
  const filePath = envFile ?? path.join(rootDir, "benchmarks", ".env.benchmark");
  try {
    const content = await fs.readFile(filePath, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const separatorIndex = trimmed.indexOf("=");
      if (separatorIndex === -1) continue;
      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1).trim();
      if (key && process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

function numberFromEnv(key, fallback) {
  const value = Number(process.env[key]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

async function startLocalApi() {
  process.env.BENCHMARK_MODE = "true";
  process.env.JWT_SECRET ??= process.env.BENCHMARK_JWT_SECRET ?? "development-secret";

  const { createApp } = await import("../apps/api/src/app.js");
  const app = createApp();
  const server = app.listen(0, "127.0.0.1");

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    })
  };
}

function percentile(values, percentileValue) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((percentileValue / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(sorted.length - 1, index))];
}

async function sampleTtfb(baseUrl, endpoint, createRequest, sampleCount) {
  const samples = [];
  const statuses = {};

  for (let index = 0; index < sampleCount; index += 1) {
    const request = createRequest();
    const start = performance.now();
    const response = await fetch(`${baseUrl}${endpoint.path}`, {
      method: endpoint.method,
      headers: request.headers,
      body: endpoint.method === "GET" ? undefined : request.body
    });
    const headerMs = performance.now() - start;
    await response.arrayBuffer();
    samples.push(headerMs);
    statuses[response.status] = (statuses[response.status] ?? 0) + 1;
  }

  return {
    samples: samples.map((value) => Number(value.toFixed(2))),
    p50: Number(percentile(samples, 50).toFixed(2)),
    p95: Number(percentile(samples, 95).toFixed(2)),
    p99: Number(percentile(samples, 99).toFixed(2)),
    statuses
  };
}

function round(value) {
  return Number(value.toFixed(2));
}

async function timedFetch(baseUrl, endpoint, createRequest) {
  const request = createRequest();
  const start = performance.now();
  const response = await fetch(`${baseUrl}${endpoint.path}`, {
    method: endpoint.method,
    headers: request.headers,
    body: endpoint.method === "GET" ? undefined : request.body,
    signal: AbortSignal.timeout(10_000)
  });
  await response.arrayBuffer();
  return {
    status: response.status,
    latencyMs: performance.now() - start
  };
}

async function runLoad(baseUrl, endpoint, createRequest, profileConfig) {
  const startedAt = performance.now();
  const durationMs = profileConfig.durationSeconds * 1000;
  const concurrency = profileConfig.connections * profileConfig.pipelining;
  const latencySamples = [];
  const statusDistribution = {};
  const requestsPerSecond = [];
  let errors = 0;
  let timeouts = 0;
  let non2xx = 0;
  let unexpectedStatus = 0;

  async function worker() {
    while (performance.now() - startedAt < durationMs) {
      const requestStartedAt = performance.now();
      try {
        const result = await timedFetch(baseUrl, endpoint, createRequest);
        const completedAt = performance.now();
        latencySamples.push(result.latencyMs);
        statusDistribution[result.status] = (statusDistribution[result.status] ?? 0) + 1;
        if (result.status < 200 || result.status >= 300) {
          non2xx += 1;
        } else if (result.status !== endpoint.expectedStatus) {
          unexpectedStatus += 1;
        }

        const second = Math.floor((completedAt - startedAt) / 1000);
        requestsPerSecond[second] = (requestsPerSecond[second] ?? 0) + 1;
      } catch (error) {
        const completedAt = performance.now();
        errors += 1;
        if (error.name === "TimeoutError" || error.name === "AbortError") {
          timeouts += 1;
        }
        latencySamples.push(completedAt - requestStartedAt);
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));

  const elapsedSeconds = Math.max((performance.now() - startedAt) / 1000, 0.001);
  const totalRequests = Object.values(statusDistribution).reduce((sum, count) => sum + count, 0) + errors;
  const failed = errors + non2xx + unexpectedStatus;
  const errorRate = totalRequests > 0 ? failed / totalRequests : 0;

  return {
    id: endpoint.id,
    method: endpoint.method,
    path: endpoint.path,
    routePattern: endpoint.routePattern,
    description: endpoint.description,
    expectedStatus: endpoint.expectedStatus,
    latencyMs: {
      p50: round(percentile(latencySamples, 50)),
      p95: round(percentile(latencySamples, 95)),
      p99: round(percentile(latencySamples, 99))
    },
    rps: {
      sustained: round(totalRequests / elapsedSeconds),
      peak: Math.max(0, ...requestsPerSecond)
    },
    requests: {
      total: totalRequests,
      sent: totalRequests
    },
    errors: {
      count: failed,
      errorRate,
      requestErrors: errors,
      timeouts,
      non2xx,
      unexpectedStatus
    },
    statusDistribution
  };
}

async function runEndpoint(baseUrl, endpoint, context, profileConfig) {
  let requestIndex = 0;
  const createRequest = () => {
    requestIndex += 1;
    return buildRequest(endpoint, {
      ...context,
      requestId: `${context.runId}-${endpoint.id}-${requestIndex}`
    });
  };

  const ttfb = await sampleTtfb(baseUrl, endpoint, createRequest, profileConfig.ttfbSamples);
  return {
    ...(await runLoad(baseUrl, endpoint, createRequest, profileConfig)),
    ttfbMs: ttfb
  };
}

async function readThresholds() {
  const thresholdsPath = path.join(rootDir, "benchmarks", "thresholds.json");
  const content = await fs.readFile(thresholdsPath, "utf8");
  return JSON.parse(content);
}

function thresholdFor(thresholds, endpointId) {
  return {
    ...(thresholds.defaults ?? {}),
    ...(thresholds.endpoints?.[endpointId] ?? {})
  };
}

function evaluateThresholds(results, thresholds) {
  const failures = [];

  for (const result of results) {
    const threshold = thresholdFor(thresholds, result.id);
    if (result.latencyMs.p99 > threshold.maxP99Ms) {
      failures.push(`${result.id} p99 ${result.latencyMs.p99}ms > ${threshold.maxP99Ms}ms`);
    }
    if (result.ttfbMs.p95 > threshold.maxTtfbP95Ms) {
      failures.push(`${result.id} TTFB p95 ${result.ttfbMs.p95}ms > ${threshold.maxTtfbP95Ms}ms`);
    }
    if (result.errors.errorRate > threshold.maxErrorRate) {
      failures.push(`${result.id} error rate ${formatPercent(result.errors.errorRate)} > ${formatPercent(threshold.maxErrorRate)}`);
    }
    if (result.rps.sustained < threshold.minSustainedRps) {
      failures.push(`${result.id} sustained RPS ${result.rps.sustained} < ${threshold.minSustainedRps}`);
    }
  }

  return failures;
}

function formatPercent(value) {
  return `${(value * 100).toFixed(2)}%`;
}

function markdownReport(report) {
  const lines = [];
  lines.push(`# API Benchmark Report (${report.profile})`);
  lines.push("");
  lines.push(`Generated: ${report.generatedAt}`);
  lines.push(`Target: ${report.target.baseUrl}`);
  lines.push(`Local server: ${report.target.localServer ? "yes" : "no"}`);
  lines.push("");
  lines.push("## Environment");
  lines.push("");
  lines.push(`- Platform: ${report.environment.platform} ${report.environment.release} (${report.environment.arch})`);
  lines.push(`- CPU: ${report.environment.cpu}`);
  lines.push(`- RAM: ${report.environment.totalMemoryGiB} GiB total`);
  lines.push(`- Node.js: ${report.environment.node}`);
  lines.push("");
  lines.push("## Profile");
  lines.push("");
  lines.push(`- Duration per endpoint: ${report.profileConfig.durationSeconds}s`);
  lines.push(`- Connections: ${report.profileConfig.connections}`);
  lines.push(`- Pipelining: ${report.profileConfig.pipelining}`);
  lines.push(`- TTFB samples per endpoint: ${report.profileConfig.ttfbSamples}`);
  lines.push("");
  lines.push("## Results");
  lines.push("");
  lines.push("| Endpoint | Method | Path | p50 ms | p95 ms | p99 ms | TTFB p95 ms | Sustained RPS | Peak RPS | Error rate | Statuses |");
  lines.push("| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |");

  for (const result of report.results) {
    lines.push(`| ${result.id} | ${result.method} | \`${result.path}\` | ${result.latencyMs.p50} | ${result.latencyMs.p95} | ${result.latencyMs.p99} | ${result.ttfbMs.p95} | ${result.rps.sustained} | ${result.rps.peak} | ${formatPercent(result.errors.errorRate)} | ${JSON.stringify(result.statusDistribution)} |`);
  }

  lines.push("");
  lines.push("## Threshold Gate");
  lines.push("");
  if (report.thresholdFailures.length === 0) {
    lines.push("All configured thresholds passed.");
  } else {
    for (const failure of report.thresholdFailures) {
      lines.push(`- ${failure}`);
    }
  }

  return `${lines.join("\n")}\n`;
}

async function writeReport(report) {
  const resultsDir = path.resolve(rootDir, process.env.BENCHMARK_RESULTS_DIR ?? "benchmarks/results");
  await fs.mkdir(resultsDir, { recursive: true });

  const stamp = report.generatedAt.replace(/[:.]/g, "-");
  const baseName = `api-benchmark-${report.profile}-${stamp}`;
  const jsonPath = path.join(resultsDir, `${baseName}.json`);
  const mdPath = path.join(resultsDir, `${baseName}.md`);
  const latestJsonPath = path.join(resultsDir, "latest.json");
  const latestMdPath = path.join(resultsDir, "latest.md");

  const json = `${JSON.stringify(report, null, 2)}\n`;
  const md = markdownReport(report);

  await fs.writeFile(jsonPath, json, "utf8");
  await fs.writeFile(mdPath, md, "utf8");
  await fs.writeFile(latestJsonPath, json, "utf8");
  await fs.writeFile(latestMdPath, md, "utf8");

  return { jsonPath, mdPath, latestJsonPath, latestMdPath };
}

function environmentSnapshot() {
  const cpus = os.cpus();
  return {
    platform: os.platform(),
    release: os.release(),
    arch: os.arch(),
    cpu: cpus.length > 0 ? `${cpus[0].model}, ${cpus.length} logical processors` : "unknown",
    totalMemoryGiB: Number((os.totalmem() / 1024 / 1024 / 1024).toFixed(1)),
    freeMemoryGiB: Number((os.freemem() / 1024 / 1024 / 1024).toFixed(1)),
    node: process.version
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  await loadEnvFile(args.envFile);

  const profileConfig = {
    ...profileDefaults[args.profile],
    durationSeconds: numberFromEnv("BENCHMARK_DURATION_SECONDS", profileDefaults[args.profile].durationSeconds),
    connections: numberFromEnv("BENCHMARK_CONNECTIONS", profileDefaults[args.profile].connections),
    pipelining: numberFromEnv("BENCHMARK_PIPELINING", profileDefaults[args.profile].pipelining),
    ttfbSamples: numberFromEnv("BENCHMARK_TTFB_SAMPLES", profileDefaults[args.profile].ttfbSamples)
  };

  const targetUrl = args.targetUrl ?? process.env.BENCHMARK_TARGET_URL;
  const localTarget = targetUrl ? null : await startLocalApi();
  const baseUrl = (targetUrl || localTarget.baseUrl).replace(/\/$/, "");
  const jwtSecret = process.env.BENCHMARK_JWT_SECRET ?? process.env.JWT_SECRET ?? "development-secret";
  const runId = new Date().toISOString().replace(/[^0-9]/g, "");

  const context = {
    runId,
    adminToken: jwt.sign({ sub: "usr_benchmark_admin", role: "admin", scope: ["benchmark"] }, jwtSecret, { expiresIn: "1h" })
  };

  const results = [];
  try {
    for (const endpoint of endpointRegistry) {
      process.stdout.write(`Benchmarking ${endpoint.method} ${endpoint.path} ... `);
      const result = await runEndpoint(baseUrl, endpoint, context, profileConfig);
      results.push(result);
      process.stdout.write(`p99=${result.latencyMs.p99}ms rps=${result.rps.sustained}\n`);
    }
  } finally {
    if (localTarget) await localTarget.close();
  }

  const thresholds = await readThresholds();
  const thresholdFailures = evaluateThresholds(results, thresholds);
  const report = {
    profile: args.profile,
    generatedAt: new Date().toISOString(),
    profileConfig,
    target: {
      baseUrl,
      localServer: Boolean(localTarget)
    },
    environment: environmentSnapshot(),
    thresholds,
    thresholdFailures,
    results
  };

  const written = await writeReport(report);
  console.log(`JSON report: ${written.jsonPath}`);
  console.log(`Markdown report: ${written.mdPath}`);

  if (thresholdFailures.length > 0) {
    console.error("Threshold failures:");
    for (const failure of thresholdFailures) {
      console.error(`- ${failure}`);
    }
    if (args.failOnThreshold) {
      process.exitCode = 1;
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
