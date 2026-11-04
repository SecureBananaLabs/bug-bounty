import { createHmac, randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createEndpoints, endpointName } from "./endpoints.js";

const root = resolve(import.meta.dirname, "..");

export async function loadBenchmarkEnv(file = resolve(root, ".env.benchmark")) {
  let contents;
  try {
    contents = await readFile(file, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return;
    throw error;
  }

  for (const line of contents.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!match || match[1] in process.env) continue;
    process.env[match[1]] = match[2].replace(/^(?:"(.*)"|'(.*)')$/, (_, double, single) => double ?? single);
  }
}

export function percentile(values, percentileValue) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((percentileValue / 100) * sorted.length) - 1;
  return Number(sorted[Math.max(0, index)].toFixed(2));
}

export function summarize(samples, durationSeconds) {
  const latencies = samples.map((sample) => sample.latencyMs);
  const ttfts = samples.map((sample) => sample.ttfbMs);
  const errors = samples.filter((sample) => sample.error);
  const intervals = new Map();

  for (const sample of samples) {
    intervals.set(sample.second, (intervals.get(sample.second) ?? 0) + 1);
  }

  return {
    requests: samples.length,
    errors: errors.length,
    errorRatePercent: samples.length ? Number(((errors.length / samples.length) * 100).toFixed(2)) : 0,
    latencyMs: {
      p50: percentile(latencies, 50),
      p95: percentile(latencies, 95),
      p99: percentile(latencies, 99)
    },
    ttfbMs: {
      p50: percentile(ttfts, 50),
      p95: percentile(ttfts, 95),
      p99: percentile(ttfts, 99)
    },
    requestsPerSecond: {
      average: Number((samples.length / durationSeconds).toFixed(2)),
      peak: intervals.size ? Math.max(...intervals.values()) : 0
    }
  };
}

export function createBenchmarkToken(secret, subject = "benchmark-admin") {
  const now = Math.floor(Date.now() / 1000);
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
  const unsigned = `${encode({ alg: "HS256", typ: "JWT" })}.${encode({ sub: subject, role: "admin", iat: now, exp: now + 3600 })}`;
  const signature = createHmac("sha256", secret).update(unsigned).digest("base64url");
  return `${unsigned}.${signature}`;
}

function createMultipartBody(definition) {
  const boundary = `benchmark-${randomBytes(12).toString("hex")}`;
  const parts = [];
  for (const [name, value] of Object.entries(definition.fields)) {
    parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`);
  }
  const file = definition.file;
  parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="${file.field}"; filename="${file.filename}"\r\nContent-Type: ${file.contentType}\r\n\r\n${file.content}\r\n--${boundary}--\r\n`);
  return { body: parts.join(""), contentType: `multipart/form-data; boundary=${boundary}` };
}

function buildRequest(endpoint, token) {
  let path = endpoint.path;
  if (endpoint.query) path += `?${new URLSearchParams(endpoint.query)}`;
  const headers = {};
  let body;

  if (endpoint.auth) headers.authorization = `Bearer ${token}`;
  if (endpoint.body) {
    const payload = endpoint.body();
    if (payload.type === "multipart") {
      const multipart = createMultipartBody(payload);
      body = multipart.body;
      headers["content-type"] = multipart.contentType;
    } else {
      body = JSON.stringify(payload);
      headers["content-type"] = "application/json";
    }
  }

  return { method: endpoint.method, path, headers, body };
}

async function requestOnce(target, request, timeoutMs, signal) {
  const started = performance.now();
  try {
    const response = await fetch(new URL(request.path, target), {
      method: request.method,
      headers: request.headers,
      body: request.body,
      signal: signal ?? AbortSignal.timeout(timeoutMs)
    });
    const ttfbMs = performance.now() - started;
    await response.arrayBuffer();
    return {
      latencyMs: performance.now() - started,
      ttfbMs,
      error: !response.ok,
      status: response.status
    };
  } catch (error) {
    return {
      latencyMs: performance.now() - started,
      ttfbMs: performance.now() - started,
      error: true,
      status: null,
      message: error.name === "AbortError" || error.name === "TimeoutError" ? "timeout" : error.message
    };
  }
}

async function benchmarkEndpoint({ endpoint, target, token, durationMs, concurrency, timeoutMs }) {
  const request = buildRequest(endpoint, token);
  const deadline = performance.now() + durationMs;
  const start = performance.now();
  const samples = [];
  let active = 0;
  let completed = 0;

  async function worker() {
    while (performance.now() < deadline) {
      active++;
      const sample = await requestOnce(target, request, timeoutMs);
      active--;
      sample.second = Math.floor((performance.now() - start) / 1000);
      samples.push(sample);
      completed++;
    }
  }

  await Promise.all(Array.from({ length: concurrency }, worker));
  return {
    endpoint: endpointName(endpoint),
    method: endpoint.method,
    path: endpoint.path,
    ...summarize(samples, (performance.now() - start) / 1000),
    statuses: Object.fromEntries([...new Set(samples.map((sample) => sample.status))].map((status) => [status ?? "network_error", samples.filter((sample) => sample.status === status).length])),
    failureSamples: samples.filter((sample) => sample.error).slice(0, 5).map(({ status, message }) => ({ status, message })),
    completed,
    settings: { durationSeconds: durationMs / 1000, concurrency }
  };
}

async function startLocalServer(secret) {
  process.env.BENCHMARK_MODE = "1";
  process.env.JWT_SECRET = secret;
  const [{ createApp }, { env }] = await Promise.all([
    import("../apps/api/src/app.js"),
    import("../apps/api/src/config/env.js")
  ]);
  const server = createApp().listen(0, "127.0.0.1");
  await new Promise((resolveReady, reject) => {
    server.once("listening", resolveReady);
    server.once("error", reject);
  });
  return { server, target: `http://127.0.0.1:${server.address().port}` };
}

function markdownReport(report) {
  const rows = report.results.map((result) =>
    `| \`${result.endpoint}\` | ${result.latencyMs.p50 ?? "-"} | ${result.latencyMs.p95 ?? "-"} | ${result.latencyMs.p99 ?? "-"} | ${result.ttfbMs.p50 ?? "-"} | ${result.requestsPerSecond.average} | ${result.requestsPerSecond.peak} | ${result.errorRatePercent}% | ${result.requests} |`
  );
  return [
    "# API Benchmark Results",
    "",
    `- Target: \`${report.target}\` (credentials omitted)`,
    `- Started: ${report.startedAt}`,
    `- Runtime: ${report.runtime.node} on ${report.runtime.platform}/${report.runtime.arch}`,
    `- Concurrency per endpoint: ${report.settings.concurrency}`,
    `- Duration per endpoint: ${report.settings.durationSeconds}s`,
    "- Method: independent sequential endpoint runs; latency includes response body download; TTFB is measured to response headers.",
    "",
    "| Endpoint | p50 ms | p95 ms | p99 ms | TTFB p50 ms | Avg req/s | Peak req/s | Errors | Requests |",
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
    ...rows,
    "",
    report.thresholds ? `Regression gate: ${report.thresholds.p99Ms} ms p99 maximum; ${report.thresholdFailures.length ? `FAILED (${report.thresholdFailures.join(", ")})` : "passed"}.` : "Regression gate: not evaluated.",
    "",
    "Results are generated locally and are not committed by the benchmark command.",
    ""
  ].join("\n");
}

export async function runBenchmark(options = {}) {
  await loadBenchmarkEnv(options.envFile);
  const durationSeconds = Number(options.durationSeconds ?? process.env.BENCHMARK_DURATION_SECONDS ?? 5);
  const concurrency = Number(options.concurrency ?? process.env.BENCHMARK_CONCURRENCY ?? 4);
  const timeoutMs = Number(options.timeoutMs ?? process.env.BENCHMARK_TIMEOUT_MS ?? 5000);
  const thresholdFile = resolve(root, process.env.BENCHMARK_THRESHOLDS ?? "benchmarks/thresholds.json");
  const outputDir = resolve(root, process.env.BENCHMARK_RESULTS_DIR ?? "benchmarks/results");
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) throw new Error("BENCHMARK_DURATION_SECONDS must be positive");
  if (!Number.isInteger(concurrency) || concurrency < 1) throw new Error("BENCHMARK_CONCURRENCY must be a positive integer");
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1) throw new Error("BENCHMARK_TIMEOUT_MS must be a positive integer");

  const thresholds = JSON.parse(await readFile(thresholdFile, "utf8"));
  const secret = process.env.BENCHMARK_JWT_SECRET ?? process.env.JWT_SECRET ?? "local-benchmark-secret";
  const token = process.env.BENCHMARK_TOKEN ?? (process.env.BENCHMARK_JWT_SECRET || !process.env.BENCHMARK_TARGET_URL
    ? createBenchmarkToken(secret, process.env.BENCHMARK_USER_ID ?? "benchmark-admin")
    : null);
  if (createEndpoints().some((endpoint) => endpoint.auth) && !token) {
    throw new Error("Set BENCHMARK_TOKEN or BENCHMARK_JWT_SECRET to benchmark protected endpoints");
  }

  if (process.env.BENCHMARK_ALLOW_MUTATIONS !== "1") {
    throw new Error("Benchmarks issue POST requests and mutate data; set BENCHMARK_ALLOW_MUTATIONS=1 only for a disposable benchmark environment");
  }

  let target = process.env.BENCHMARK_TARGET_URL;
  if (target && !new Set(["http:", "https:"]).has(new URL(target).protocol)) {
    throw new Error("BENCHMARK_TARGET_URL must use http or https");
  }

  let localServer;
  if (!target) {
    localServer = await startLocalServer(secret);
    target = localServer.target;
  }
  const parsedTarget = new URL(target);

  const startedAt = new Date().toISOString();
  const results = [];
  try {
    for (const endpoint of createEndpoints()) {
      results.push(await benchmarkEndpoint({ endpoint, target, token, durationMs: durationSeconds * 1000, concurrency, timeoutMs }));
    }
  } finally {
    if (localServer) {
      await new Promise((resolveClose, reject) => localServer.server.close((error) => error ? reject(error) : resolveClose()));
    }
  }

  const thresholdFailures = results
    .filter((result) => result.latencyMs.p99 === null || result.latencyMs.p99 > thresholds.p99Ms)
    .map((result) => `${result.endpoint} p99=${result.latencyMs.p99 ?? "no samples"}ms`);
  const report = {
    startedAt,
    target: `${parsedTarget.origin}${parsedTarget.pathname === "/" ? "" : parsedTarget.pathname}`,
    runtime: { node: process.version, platform: process.platform, arch: process.arch },
    settings: { durationSeconds, concurrency, timeoutMs },
    thresholds,
    thresholdFailures,
    results
  };

  await mkdir(outputDir, { recursive: true });
  const timestamp = startedAt.replace(/[:.]/g, "-");
  const jsonPath = resolve(outputDir, `benchmark-${timestamp}.json`);
  const markdownPath = resolve(outputDir, `benchmark-${timestamp}.md`);
  await Promise.all([
    writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`),
    writeFile(markdownPath, markdownReport(report))
  ]);
  process.stdout.write(`Benchmark reports written:\n- ${jsonPath}\n- ${markdownPath}\n`);
  if (thresholdFailures.length) process.exitCode = 1;
  return report;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  try {
    await runBenchmark();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
