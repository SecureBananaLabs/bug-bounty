import fs from "node:fs/promises";
import http from "node:http";
import https from "node:https";
import os from "node:os";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";
import { createApp } from "../apps/api/src/app.js";
import { signAccessToken } from "../apps/api/src/utils/jwt.js";
import { API_ROUTES } from "./api-route-manifest.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const resultsDir = path.join(rootDir, "benchmarks", "results");
const thresholdsPath = path.join(rootDir, "benchmarks", "thresholds.json");

const args = new Set(process.argv.slice(2));
const smoke = args.has("--smoke");
const outPrefix = smoke ? "api-benchmark-smoke" : "api-benchmark";

function applyDotenv(text) {
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [key, ...valueParts] = trimmed.split("=");
    if (!process.env[key]) {
      process.env[key] = valueParts.join("=").replace(/^"|"$/g, "");
    }
  }
}

async function loadBenchmarkEnv() {
  for (const fileName of [".env.benchmark", ".env.benchmark.local"]) {
    const filePath = path.join(rootDir, "benchmarks", fileName);
    try {
      applyDotenv(await fs.readFile(filePath, "utf8"));
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
}

function percentile(values, p) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
}

function round(value, decimals = 2) {
  return Number(value.toFixed(decimals));
}

function multipartBody(route) {
  const boundary = `----freelanceflow-benchmark-${Math.random().toString(16).slice(2)}`;
  const part = route.multipart;
  const body = [
    `--${boundary}`,
    `Content-Disposition: form-data; name="${part.fieldName}"; filename="${part.filename}"`,
    `Content-Type: ${part.contentType}`,
    "",
    part.content,
    `--${boundary}--`,
    ""
  ].join("\r\n");

  return {
    body,
    headers: {
      "content-type": `multipart/form-data; boundary=${boundary}`,
      "content-length": Buffer.byteLength(body)
    }
  };
}

function requestPayload(route, index, adminToken) {
  const headers = {};
  let body;

  if (route.auth === "admin") {
    headers.authorization = `Bearer ${process.env.BENCHMARK_AUTH_TOKEN || adminToken}`;
  }

  if (route.multipart) {
    const multipart = multipartBody(route);
    Object.assign(headers, multipart.headers);
    body = multipart.body;
  } else if (route.json) {
    body = JSON.stringify(route.json(index));
    headers["content-type"] = "application/json";
    headers["content-length"] = Buffer.byteLength(body);
  }

  return { body, headers };
}

function requestOnce(baseUrl, route, index, adminToken) {
  const startedAt = performance.now();
  const url = new URL(route.path, baseUrl);
  const protocol = url.protocol === "https:" ? https : http;
  const payload = requestPayload(route, index, adminToken);

  return new Promise((resolve) => {
    const req = protocol.request(
      url,
      {
        method: route.method,
        headers: payload.headers,
        timeout: Number(process.env.BENCHMARK_REQUEST_TIMEOUT_MS || 5000)
      },
      (res) => {
        const firstByteAt = performance.now();
        let bytes = 0;

        res.on("data", (chunk) => {
          bytes += chunk.length;
        });
        res.on("end", () => {
          const endedAt = performance.now();
          resolve({
            status: res.statusCode,
            ok: res.statusCode === route.expectedStatus,
            latencyMs: endedAt - startedAt,
            ttfbMs: firstByteAt - startedAt,
            bytes,
            error: null
          });
        });
      }
    );

    req.on("timeout", () => {
      req.destroy(new Error("request timeout"));
    });
    req.on("error", (error) => {
      const endedAt = performance.now();
      resolve({
        status: 0,
        ok: false,
        latencyMs: endedAt - startedAt,
        ttfbMs: endedAt - startedAt,
        bytes: 0,
        error: error.message
      });
    });

    if (payload.body) req.write(payload.body);
    req.end();
  });
}

async function benchmarkRoute(baseUrl, route, adminToken, config) {
  const samples = [];
  const startedAt = performance.now();
  const requestTimeline = [];

  for (let i = 0; i < config.requestsPerRoute; i += config.concurrency) {
    const batchSize = Math.min(config.concurrency, config.requestsPerRoute - i);
    const batchStartedAt = performance.now();
    const batch = await Promise.all(
      Array.from({ length: batchSize }, (_, offset) =>
        requestOnce(baseUrl, route, i + offset, adminToken)
      )
    );
    for (const sample of batch) {
      samples.push(sample);
      requestTimeline.push(batchStartedAt);
    }
  }

  const endedAt = performance.now();
  const latencies = samples.map((sample) => sample.latencyMs);
  const ttfb = samples.map((sample) => sample.ttfbMs);
  const errors = samples.filter((sample) => !sample.ok);
  const durationSeconds = Math.max((endedAt - startedAt) / 1000, 0.001);
  const buckets = new Map();

  for (const timestamp of requestTimeline) {
    const second = Math.floor((timestamp - startedAt) / 1000);
    buckets.set(second, (buckets.get(second) || 0) + 1);
  }

  return {
    id: route.id,
    method: route.method,
    path: route.path,
    pathTemplate: route.pathTemplate,
    description: route.description,
    expectedStatus: route.expectedStatus,
    requestCount: samples.length,
    successCount: samples.length - errors.length,
    errorCount: errors.length,
    errorRate: round(errors.length / Math.max(samples.length, 1), 4),
    statuses: samples.reduce((acc, sample) => {
      acc[sample.status] = (acc[sample.status] || 0) + 1;
      return acc;
    }, {}),
    p50Ms: round(percentile(latencies, 50)),
    p95Ms: round(percentile(latencies, 95)),
    p99Ms: round(percentile(latencies, 99)),
    ttfbP50Ms: round(percentile(ttfb, 50)),
    ttfbP95Ms: round(percentile(ttfb, 95)),
    ttfbP99Ms: round(percentile(ttfb, 99)),
    sustainedRps: round(samples.length / durationSeconds),
    peakRps: Math.max(...buckets.values(), samples.length),
    bytesReceived: samples.reduce((sum, sample) => sum + sample.bytes, 0),
    firstError: errors[0]?.error ?? null
  };
}

function summaryMarkdown(result) {
  const rows = result.routes
    .map(
      (route) =>
        `| ${route.method} ${route.path} | ${route.requestCount} | ${route.errorRate} | ${route.p50Ms} | ${route.p95Ms} | ${route.p99Ms} | ${route.ttfbP99Ms} | ${route.sustainedRps} |`
    )
    .join("\n");

  return `# API Benchmark Summary

- Mode: ${result.mode}
- Target: ${result.target}
- Started: ${result.startedAt}
- Routes covered: ${result.routes.length}
- Total requests: ${result.totals.requestCount}
- Error rate: ${result.totals.errorRate}
- Max p99 latency: ${result.totals.maxP99Ms} ms
- Max p99 TTFB: ${result.totals.maxTtfbP99Ms} ms

| Endpoint | Requests | Error rate | p50 ms | p95 ms | p99 ms | p99 TTFB ms | Sustained RPS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
${rows}
`;
}

function enforceThresholds(result, thresholds) {
  const failures = [];
  for (const route of result.routes) {
    if (route.p99Ms > thresholds.p99MaxMs) {
      failures.push(`${route.method} ${route.path} p99 ${route.p99Ms}ms > ${thresholds.p99MaxMs}ms`);
    }
    if (route.ttfbP99Ms > thresholds.ttfbP99MaxMs) {
      failures.push(
        `${route.method} ${route.path} p99 TTFB ${route.ttfbP99Ms}ms > ${thresholds.ttfbP99MaxMs}ms`
      );
    }
    if (route.errorRate > thresholds.errorRateMax) {
      failures.push(
        `${route.method} ${route.path} error rate ${route.errorRate} > ${thresholds.errorRateMax}`
      );
    }
  }
  return failures;
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
    close: () => new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())))
  };
}

async function main() {
  await loadBenchmarkEnv();
  await fs.mkdir(resultsDir, { recursive: true });

  const config = {
    concurrency: Number(process.env.BENCHMARK_CONCURRENCY || (smoke ? 1 : 2)),
    requestsPerRoute: Number(process.env.BENCHMARK_REQUESTS_PER_ROUTE || (smoke ? 2 : 6))
  };

  const localServer = process.env.BENCHMARK_TARGET_URL
    ? null
    : await startLocalServer();
  const baseUrl = process.env.BENCHMARK_TARGET_URL || localServer.baseUrl;
  const adminToken = signAccessToken({ sub: "benchmark_admin", role: "admin" });
  const startedAt = new Date().toISOString();

  try {
    const routes = [];
    for (const route of API_ROUTES) {
      routes.push(await benchmarkRoute(baseUrl, route, adminToken, config));
    }

    const result = {
      mode: smoke ? "smoke" : "full",
      target: process.env.BENCHMARK_TARGET_URL ? "external" : "local-express",
      baseUrl,
      startedAt,
      finishedAt: new Date().toISOString(),
      config,
      environment: {
        platform: os.platform(),
        release: os.release(),
        arch: os.arch(),
        cpus: os.cpus().map((cpu) => cpu.model),
        cpuCount: os.cpus().length,
        totalMemoryMb: Math.round(os.totalmem() / 1024 / 1024),
        freeMemoryMb: Math.round(os.freemem() / 1024 / 1024),
        nodeVersion: process.version
      },
      routes,
      totals: {
        routeCount: routes.length,
        requestCount: routes.reduce((sum, route) => sum + route.requestCount, 0),
        errorCount: routes.reduce((sum, route) => sum + route.errorCount, 0),
        errorRate: round(
          routes.reduce((sum, route) => sum + route.errorCount, 0) /
            Math.max(routes.reduce((sum, route) => sum + route.requestCount, 0), 1),
          4
        ),
        maxP99Ms: Math.max(...routes.map((route) => route.p99Ms)),
        maxTtfbP99Ms: Math.max(...routes.map((route) => route.ttfbP99Ms))
      }
    };

    const thresholds = JSON.parse(await fs.readFile(thresholdsPath, "utf8"));
    const failures = enforceThresholds(result, thresholds);
    result.thresholds = thresholds;
    result.thresholdFailures = failures;

    const jsonPath = path.join(resultsDir, `${outPrefix}.json`);
    const markdownPath = path.join(resultsDir, `${outPrefix}.md`);
    await fs.writeFile(jsonPath, `${JSON.stringify(result, null, 2)}\n`);
    await fs.writeFile(markdownPath, summaryMarkdown(result));

    console.log(summaryMarkdown(result));
    if (failures.length) {
      console.error("\nBenchmark threshold failures:");
      for (const failure of failures) console.error(`- ${failure}`);
      process.exit(1);
    }
  } finally {
    if (localServer) await localServer.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
