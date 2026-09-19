import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { benchmarkEndpoints } from "./endpoints.mjs";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = new Set(process.argv.slice(2));
const isSmoke = args.has("--smoke");
const outputDir = resolve(rootDir, process.env.BENCHMARK_OUTPUT_DIR ?? "benchmarks/results");
const concurrency = Number(process.env.BENCHMARK_CONCURRENCY ?? (isSmoke ? 1 : 2));
const requestsPerEndpoint = Number(process.env.BENCHMARK_REQUESTS_PER_ENDPOINT ?? (isSmoke ? 1 : 8));

const thresholds = JSON.parse(
  await readFile(resolve(rootDir, "benchmarks/thresholds.json"), "utf8")
);

function percentile(values, rank) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((rank / 100) * sorted.length) - 1;
  return Number(sorted[Math.max(0, Math.min(index, sorted.length - 1))].toFixed(2));
}

function mean(values) {
  if (values.length === 0) return 0;
  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2));
}

function routeKey(endpoint) {
  return `${endpoint.method} ${endpoint.path.split("?")[0]}`;
}

function resolveThreshold(endpoint) {
  return {
    ...thresholds.defaults,
    ...(thresholds.routes?.[routeKey(endpoint)] ?? {})
  };
}

async function createLocalTarget() {
  if (process.env.BENCHMARK_TARGET_URL) {
    return {
      baseUrl: process.env.BENCHMARK_TARGET_URL.replace(/\/$/, ""),
      close: async () => {}
    };
  }

  process.env.NODE_ENV ??= "benchmark";
  const [{ createApp }, { signAccessToken }] = await Promise.all([
    import("../apps/api/src/app.js"),
    import("../apps/api/src/utils/jwt.js")
  ]);

  if (!process.env.BENCHMARK_ADMIN_TOKEN) {
    process.env.BENCHMARK_ADMIN_TOKEN = signAccessToken({
      sub: "benchmark-admin",
      role: "admin"
    });
  }

  const server = createServer(createApp());
  await new Promise((resolveListen) => server.listen(0, "127.0.0.1", resolveListen));
  const { port } = server.address();

  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolveClose, rejectClose) => {
      server.close((error) => error ? rejectClose(error) : resolveClose());
    })
  };
}

function buildRequest(endpoint, iteration) {
  const headers = {};
  const request = {
    method: endpoint.method,
    headers
  };

  if (endpoint.auth) {
    headers.authorization = `Bearer ${process.env.BENCHMARK_ADMIN_TOKEN ?? ""}`;
  }

  if (endpoint.json) {
    headers["content-type"] = "application/json";
    const payload = typeof endpoint.json === "function"
      ? endpoint.json({ iteration })
      : endpoint.json;
    request.body = JSON.stringify(payload);
  }

  if (endpoint.multipart) {
    const form = new FormData();
    form.append(
      endpoint.multipart.fieldName,
      new Blob([endpoint.multipart.body], { type: endpoint.multipart.type }),
      endpoint.multipart.filename
    );
    request.body = form;
  }

  return request;
}

async function runOne(baseUrl, endpoint, iteration) {
  const startedAt = performance.now();
  let headersAt = startedAt;
  let status = 0;
  let ok = false;
  let error = null;

  try {
    const response = await fetch(`${baseUrl}${endpoint.path}`, buildRequest(endpoint, iteration));
    headersAt = performance.now();
    status = response.status;
    await response.arrayBuffer();
    ok = status === endpoint.expectedStatus;
  } catch (requestError) {
    error = requestError instanceof Error ? requestError.message : String(requestError);
  }

  const endedAt = performance.now();
  return {
    ok,
    status,
    error,
    latencyMs: Number((endedAt - startedAt).toFixed(2)),
    ttfbMs: Number((headersAt - startedAt).toFixed(2))
  };
}

async function runEndpoint(baseUrl, endpoint) {
  const measurements = [];
  let nextIteration = 0;
  const startedAt = performance.now();

  async function worker() {
    while (nextIteration < requestsPerEndpoint) {
      const iteration = nextIteration;
      nextIteration += 1;
      measurements.push(await runOne(baseUrl, endpoint, iteration));
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, requestsPerEndpoint) }, worker));

  const durationSeconds = Math.max((performance.now() - startedAt) / 1000, 0.001);
  const latencies = measurements.map((sample) => sample.latencyMs);
  const ttfbs = measurements.map((sample) => sample.ttfbMs);
  const errors = measurements.filter((sample) => !sample.ok);
  const threshold = resolveThreshold(endpoint);

  const result = {
    name: endpoint.name,
    method: endpoint.method,
    path: endpoint.path,
    expectedStatus: endpoint.expectedStatus,
    requests: measurements.length,
    errors: errors.length,
    errorRate: Number((errors.length / measurements.length).toFixed(4)),
    requestsPerSecond: Number((measurements.length / durationSeconds).toFixed(2)),
    peakRequestsPerSecond: Number((concurrency / Math.max(Math.min(...latencies) / 1000, 0.001)).toFixed(2)),
    latencyMs: {
      mean: mean(latencies),
      p50: percentile(latencies, 50),
      p95: percentile(latencies, 95),
      p99: percentile(latencies, 99)
    },
    ttfbMs: {
      mean: mean(ttfbs),
      p50: percentile(ttfbs, 50),
      p95: percentile(ttfbs, 95),
      p99: percentile(ttfbs, 99)
    },
    threshold,
    passedThresholds:
      errors.length / measurements.length <= threshold.errorRate &&
      percentile(latencies, 99) <= threshold.p99LatencyMs &&
      percentile(ttfbs, 99) <= threshold.p99TtfbMs,
    failures: errors.slice(0, 3)
  };

  return result;
}

function markdownReport(report) {
  const rows = report.results.map((result) => [
    result.passedThresholds ? "pass" : "fail",
    result.method,
    result.path,
    result.requests,
    `${(result.errorRate * 100).toFixed(2)}%`,
    result.latencyMs.p50,
    result.latencyMs.p95,
    result.latencyMs.p99,
    result.ttfbMs.p99,
    result.requestsPerSecond
  ]);

  return [
    "# API Benchmark Report",
    "",
    `- Mode: ${report.mode}`,
    `- Target: ${report.target}`,
    `- Generated: ${report.generatedAt}`,
    `- Endpoints: ${report.summary.endpointCount}`,
    `- Requests: ${report.summary.totalRequests}`,
    `- Error rate: ${(report.summary.errorRate * 100).toFixed(2)}%`,
    `- Max p99 latency: ${report.summary.maxP99LatencyMs} ms`,
    `- Max p99 TTFB: ${report.summary.maxP99TtfbMs} ms`,
    "",
    "| Gate | Method | Path | Requests | Error rate | p50 ms | p95 ms | p99 ms | p99 TTFB ms | RPS |",
    "| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
    ...rows.map((row) => `| ${row.join(" | ")} |`),
    ""
  ].join("\n");
}

const target = await createLocalTarget();

try {
  const results = [];
  for (const endpoint of benchmarkEndpoints) {
    results.push(await runEndpoint(target.baseUrl, endpoint));
  }

  const totalRequests = results.reduce((sum, result) => sum + result.requests, 0);
  const totalErrors = results.reduce((sum, result) => sum + result.errors, 0);
  const report = {
    mode: isSmoke ? "smoke" : "full",
    target: target.baseUrl,
    generatedAt: new Date().toISOString(),
    configuration: {
      concurrency,
      requestsPerEndpoint,
      thresholdsFile: "benchmarks/thresholds.json"
    },
    summary: {
      endpointCount: results.length,
      totalRequests,
      totalErrors,
      errorRate: Number((totalErrors / totalRequests).toFixed(4)),
      maxP99LatencyMs: Math.max(...results.map((result) => result.latencyMs.p99)),
      maxP99TtfbMs: Math.max(...results.map((result) => result.ttfbMs.p99)),
      passed: results.every((result) => result.passedThresholds)
    },
    results
  };

  await mkdir(outputDir, { recursive: true });
  const suffix = isSmoke ? "smoke" : "full";
  const jsonPath = resolve(outputDir, `${suffix}-latest.json`);
  const markdownPath = resolve(outputDir, `${suffix}-latest.md`);
  await writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
  await writeFile(markdownPath, markdownReport(report));

  console.log(markdownReport(report));
  if (!report.summary.passed) {
    process.exitCode = 1;
  }
} finally {
  await target.close();
}
