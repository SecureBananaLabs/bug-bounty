import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";

import { createApp } from "../apps/api/src/app.js";
import { buildRouteManifest, loadThresholds } from "./lib/manifest.mjs";
import { buildMarkdownReport, evaluateThresholds } from "./lib/report.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = __dirname;

function parseArgs(argv) {
  const mode = argv.includes("--smoke") ? "smoke" : "full";
  const iterationsFlag = argv.find((arg) => arg.startsWith("--iterations="));
  const envIterations = process.env.BENCHMARK_ITERATIONS ? Number(process.env.BENCHMARK_ITERATIONS) : null;
  return {
    mode,
    iterations: iterationsFlag ? Number(iterationsFlag.split("=")[1]) : envIterations ?? (mode === "smoke" ? 2 : 5),
  };
}

async function startLocalTarget() {
  if (process.env.BENCHMARK_TARGET_URL) {
    return {baseUrl: process.env.BENCHMARK_TARGET_URL, close: async () => {}};
  }

  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const {port} = server.address();

  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())),
  };
}

async function acquireBenchmarkToken(baseUrl) {
  if (process.env.BENCHMARK_AUTH_TOKEN) {
    return process.env.BENCHMARK_AUTH_TOKEN;
  }

  const response = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: {"content-type": "application/json"},
    body: JSON.stringify({email: `benchmark-admin-${Date.now()}@example.com`, password: "benchmark-pass", role: "admin"}),
  });
  const payload = await response.json();
  return payload.data?.token;
}

function requestOptions(endpoint, token) {
  const headers = {...(endpoint.headers ?? {})};
  let body;

  if (endpoint.requiresAuth && token) {
    headers.authorization = `Bearer ${token}`;
  }
  if (endpoint.upload) {
    const form = new FormData();
    form.append("file", new Blob(["benchmark fixture"], {type: "text/plain"}), "benchmark.txt");
    body = form;
  } else if (endpoint.body !== undefined) {
    body = JSON.stringify(endpoint.body);
  }

  return {method: endpoint.method, headers, body};
}

function percentile(values, rank) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((rank / 100) * sorted.length) - 1);
  return Math.round(sorted[index]);
}

async function runEndpoint(baseUrl, endpoint, token, iterations) {
  const latencies = [];
  const ttfbValues = [];
  let failures = 0;
  let lastStatus = 0;
  const started = performance.now();

  for (let index = 0; index < iterations; index += 1) {
    const requestStarted = performance.now();
    const response = await fetch(`${baseUrl}${endpoint.path}`, requestOptions(endpoint, token));
    const ttfb = performance.now() - requestStarted;
    lastStatus = response.status;
    if (!endpoint.expectedStatuses.includes(response.status)) {
      failures += 1;
    }
    await response.arrayBuffer();
    latencies.push(performance.now() - requestStarted);
    ttfbValues.push(ttfb);
  }

  const totalSeconds = Math.max((performance.now() - started) / 1000, 0.001);
  return {
    id: endpoint.id,
    method: endpoint.method,
    path: endpoint.path,
    status: lastStatus,
    p50Ms: percentile(latencies, 50),
    p95Ms: percentile(latencies, 95),
    p99Ms: percentile(latencies, 99),
    ttfbP95Ms: percentile(ttfbValues, 95),
    requestsPerSecond: Number((iterations / totalSeconds).toFixed(2)),
    errorRate: failures / iterations,
  };
}

function benchmarkEnv() {
  const cpus = os.cpus();
  return {
    node: process.version,
    platform: os.platform(),
    arch: os.arch(),
    cpu: cpus[0]?.model ?? "unknown",
    cores: cpus.length,
    totalMemoryMb: Math.round(os.totalmem() / 1024 / 1024),
  };
}

function writeOutputs(packet) {
  const resultsDir = path.join(root, "results");
  fs.mkdirSync(resultsDir, {recursive: true});
  fs.writeFileSync(path.join(resultsDir, `${packet.mode}.json`), `${JSON.stringify(packet, null, 2)}\n`);
  fs.writeFileSync(path.join(resultsDir, `${packet.mode}.md`), buildMarkdownReport(packet));
}

function publicManifest(manifest) {
  return {
    ...manifest,
    endpoints: manifest.endpoints.map(({body, headers, upload, ...endpoint}) => endpoint),
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const manifest = buildRouteManifest();
  const thresholds = loadThresholds();
  const target = await startLocalTarget();

  try {
    const token = await acquireBenchmarkToken(target.baseUrl);
    const rawResults = [];
    for (const endpoint of manifest.endpoints) {
      rawResults.push(await runEndpoint(target.baseUrl, endpoint, token, options.iterations));
    }
    const results = evaluateThresholds(rawResults, thresholds);
    const packet = {
      generatedAt: new Date().toISOString(),
      mode: options.mode,
      target: process.env.BENCHMARK_TARGET_URL ? "external target" : "local app",
      manifest: publicManifest(manifest),
      thresholds,
      benchmarkEnv: benchmarkEnv(),
      results,
    };

    writeOutputs(packet);

    const failures = results.filter((result) => !result.passed);
    console.log(`Benchmarked ${results.length} endpoints in ${options.mode} mode`);
    console.log(`Results written to ${path.join(root, "results")}`);
    if (failures.length > 0) {
      console.error(`${failures.length} endpoints exceeded thresholds`);
      process.exitCode = 1;
    }
  } finally {
    await target.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
