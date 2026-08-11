import http from "node:http";
import https from "node:https";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";
import { createApp } from "../apps/api/src/app.js";
import { signAccessToken } from "../apps/api/src/utils/jwt.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const isSmoke = process.argv.includes("--smoke");

const settings = {
  iterations: numberFromEnv("BENCHMARK_ITERATIONS", isSmoke ? 2 : 8),
  concurrency: numberFromEnv("BENCHMARK_CONCURRENCY", isSmoke ? 1 : 4),
  warmup: numberFromEnv("BENCHMARK_WARMUP", 1),
  resultsDir: process.env.BENCHMARK_RESULTS_DIR ?? "benchmarks/results"
};

const endpoints = JSON.parse(await readFile(path.join(__dirname, "endpoints.json"), "utf8"));
const thresholds = JSON.parse(await readFile(path.join(__dirname, "thresholds.json"), "utf8"));

let localServer;
let baseUrl = process.env.BENCHMARK_TARGET_URL;

if (!baseUrl) {
  localServer = await startLocalServer();
  const { port } = localServer.address();
  baseUrl = `http://127.0.0.1:${port}`;
}

try {
  const startedAt = new Date();
  const endpointResults = [];

  for (const endpoint of endpoints) {
    await runWarmup(endpoint);
    endpointResults.push(await benchmarkEndpoint(endpoint));
  }

  const summary = buildSummary({
    startedAt,
    finishedAt: new Date(),
    baseUrl,
    settings,
    endpoints: endpointResults,
    localServer: Boolean(localServer)
  });

  await writeReports(summary);
  enforceThresholds(summary);

  console.log(`Benchmark completed: ${summary.output.markdown}`);
} finally {
  if (localServer) {
    await new Promise((resolve, reject) => {
      localServer.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

function numberFromEnv(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function startLocalServer() {
  const app = createApp();

  return new Promise((resolve, reject) => {
    const server = app.listen(0, "127.0.0.1", () => resolve(server));
    server.once("error", reject);
  });
}

async function runWarmup(endpoint) {
  for (let i = 0; i < settings.warmup; i += 1) {
    await sendRequest(endpoint).catch(() => undefined);
  }
}

async function benchmarkEndpoint(endpoint) {
  const samples = [];
  let nextRequestIndex = 0;

  const started = performance.now();
  const workers = Array.from({ length: settings.concurrency }, async () => {
    while (nextRequestIndex < settings.iterations) {
      nextRequestIndex += 1;
      samples.push(await sendRequest(endpoint));
    }
  });

  await Promise.all(workers);
  const elapsedMs = performance.now() - started;

  return summarizeEndpoint(endpoint, samples, elapsedMs);
}

async function sendRequest(endpoint) {
  const url = new URL(endpoint.path, baseUrl);
  const body = buildRequestBody(endpoint);
  const headers = buildHeaders(endpoint, body);
  const transport = url.protocol === "https:" ? https : http;

  return new Promise((resolve) => {
    const started = performance.now();
    let ttfbMs;
    let responseBytes = 0;
    let errorMessage;

    const request = transport.request(
      url,
      {
        method: endpoint.method,
        headers
      },
      (response) => {
        ttfbMs = performance.now() - started;
        response.on("data", (chunk) => {
          responseBytes += chunk.length;
        });
        response.on("end", () => {
          const latencyMs = performance.now() - started;
          resolve({
            statusCode: response.statusCode,
            latencyMs,
            ttfbMs,
            responseBytes,
            ok: response.statusCode >= 200 && response.statusCode < 500
          });
        });
      }
    );

    request.on("error", (error) => {
      errorMessage = error.message;
      resolve({
        statusCode: 0,
        latencyMs: performance.now() - started,
        ttfbMs: null,
        responseBytes,
        ok: false,
        error: errorMessage
      });
    });

    if (body) {
      request.write(body.payload);
    }

    request.end();
  });
}

function buildRequestBody(endpoint) {
  if (endpoint.multipart) {
    const boundary = `bench-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const parts = [
      `--${boundary}`,
      `Content-Disposition: form-data; name="${endpoint.multipart.field}"; filename="${endpoint.multipart.filename}"`,
      `Content-Type: ${endpoint.multipart.contentType}`,
      "",
      endpoint.multipart.content,
      `--${boundary}--`,
      ""
    ];

    return {
      contentType: `multipart/form-data; boundary=${boundary}`,
      payload: Buffer.from(parts.join("\r\n"))
    };
  }

  if (endpoint.body) {
    return {
      contentType: "application/json",
      payload: Buffer.from(JSON.stringify(endpoint.body))
    };
  }

  return null;
}

function buildHeaders(endpoint, body) {
  const headers = {
    Accept: "application/json",
    "User-Agent": "freelance-platform-api-benchmark/1.0"
  };

  if (body) {
    headers["Content-Type"] = body.contentType;
    headers["Content-Length"] = String(body.payload.length);
  }

  if (endpoint.auth === "admin") {
    headers.Authorization = `Bearer ${signAccessToken({ sub: "benchmark-admin", role: "admin" })}`;
  }

  return headers;
}

function summarizeEndpoint(endpoint, samples, elapsedMs) {
  const latencies = samples.map((sample) => sample.latencyMs);
  const ttfbValues = samples.map((sample) => sample.ttfbMs).filter((value) => value !== null);
  const failures = samples.filter((sample) => !sample.ok);
  const statusCodes = samples.reduce((acc, sample) => {
    const key = String(sample.statusCode);
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const sustainedRps = samples.length / (elapsedMs / 1000);
  const peakRps = settings.concurrency / (Math.max(percentile(latencies, 50), 1) / 1000);

  return {
    name: endpoint.name,
    method: endpoint.method,
    path: endpoint.path,
    description: endpoint.description,
    requests: samples.length,
    latencyMs: {
      p50: round(percentile(latencies, 50)),
      p95: round(percentile(latencies, 95)),
      p99: round(percentile(latencies, 99))
    },
    ttfbMs: {
      p50: round(percentile(ttfbValues, 50)),
      p95: round(percentile(ttfbValues, 95)),
      p99: round(percentile(ttfbValues, 99))
    },
    rps: {
      sustained: round(sustainedRps),
      peak: round(peakRps)
    },
    errorRatePercent: round((failures.length / samples.length) * 100),
    statusCodes,
    errors: failures.map((sample) => sample.error).filter(Boolean)
  };
}

function percentile(values, percentileValue) {
  if (!values.length) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((percentileValue / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
}

function round(value) {
  return Math.round(value * 100) / 100;
}

function buildSummary({ startedAt, finishedAt, baseUrl, settings, endpoints, localServer }) {
  const durationMs = finishedAt.getTime() - startedAt.getTime();
  const totals = endpoints.reduce(
    (acc, endpoint) => {
      acc.requests += endpoint.requests;
      acc.errors += Math.round((endpoint.errorRatePercent / 100) * endpoint.requests);
      return acc;
    },
    { requests: 0, errors: 0 }
  );

  return {
    generatedAt: finishedAt.toISOString(),
    target: {
      baseUrl,
      localServer
    },
    settings,
    environment: {
      node: process.version,
      platform: process.platform,
      arch: process.arch,
      cpus: os.cpus().map((cpu) => cpu.model),
      cpuCount: os.cpus().length,
      totalMemoryBytes: os.totalmem(),
      freeMemoryBytes: os.freemem()
    },
    totals: {
      ...totals,
      durationMs,
      errorRatePercent: round((totals.errors / totals.requests) * 100)
    },
    endpoints,
    output: {}
  };
}

async function writeReports(summary) {
  const resultsDir = path.resolve(repoRoot, settings.resultsDir);
  await mkdir(resultsDir, { recursive: true });

  const stamp = summary.generatedAt.replaceAll(":", "-").replaceAll(".", "-");
  const jsonPath = path.join(resultsDir, `api-benchmark-${stamp}.json`);
  const markdownPath = path.join(resultsDir, `api-benchmark-${stamp}.md`);

  summary.output = {
    json: path.relative(repoRoot, jsonPath),
    markdown: path.relative(repoRoot, markdownPath)
  };

  await writeFile(jsonPath, `${JSON.stringify(summary, null, 2)}\n`);
  await writeFile(markdownPath, renderMarkdown(summary));
  await writeFile(path.join(resultsDir, "latest.json"), `${JSON.stringify(summary, null, 2)}\n`);
  await writeFile(path.join(resultsDir, "latest.md"), renderMarkdown(summary));
}

function renderMarkdown(summary) {
  const rows = summary.endpoints
    .map((endpoint) =>
      [
        endpoint.name,
        `\`${endpoint.method} ${endpoint.path}\``,
        endpoint.requests,
        endpoint.latencyMs.p50,
        endpoint.latencyMs.p95,
        endpoint.latencyMs.p99,
        endpoint.ttfbMs.p95,
        endpoint.rps.sustained,
        endpoint.errorRatePercent,
        Object.entries(endpoint.statusCodes)
          .map(([code, count]) => `${code}: ${count}`)
          .join(", ")
      ].join(" | ")
    )
    .join("\n");

  return `# API Benchmark Summary

- Generated: ${summary.generatedAt}
- Target: \`${summary.target.baseUrl}\`
- Local server: ${summary.target.localServer ? "yes" : "no"}
- Iterations per endpoint: ${summary.settings.iterations}
- Concurrency: ${summary.settings.concurrency}
- Warmup requests per endpoint: ${summary.settings.warmup}
- Total measured requests: ${summary.totals.requests}
- Total error rate: ${summary.totals.errorRatePercent}%
- Node: ${summary.environment.node}
- Platform: ${summary.environment.platform} ${summary.environment.arch}
- CPU count: ${summary.environment.cpuCount}

| Endpoint | Route | Requests | p50 ms | p95 ms | p99 ms | p95 TTFB ms | Sustained RPS | Error % | Status codes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
${rows}
`;
}

function enforceThresholds(summary) {
  const failures = summary.endpoints.flatMap((endpoint) => {
    const threshold = thresholds.endpoints[endpoint.name] ?? thresholds.default;
    const endpointFailures = [];

    if (endpoint.latencyMs.p99 > threshold.p99LatencyMs) {
      endpointFailures.push(
        `${endpoint.name} p99 ${endpoint.latencyMs.p99}ms exceeded ${threshold.p99LatencyMs}ms`
      );
    }

    if (endpoint.errorRatePercent > threshold.errorRatePercent) {
      endpointFailures.push(
        `${endpoint.name} error rate ${endpoint.errorRatePercent}% exceeded ${threshold.errorRatePercent}%`
      );
    }

    return endpointFailures;
  });

  if (failures.length) {
    throw new Error(`Benchmark thresholds failed:\n${failures.join("\n")}`);
  }
}
