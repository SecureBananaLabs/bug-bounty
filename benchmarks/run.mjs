import { mkdir, readFile, writeFile } from "node:fs/promises";
import http from "node:http";
import https from "node:https";
import os from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createApp } from "../apps/api/src/app.js";
import { signAccessToken } from "../apps/api/src/utils/jwt.js";
import { routes } from "./routes.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");
const resultsDir = join(__dirname, "results");
const latestJson = join(resultsDir, "latest.json");
const latestMarkdown = join(resultsDir, "latest.md");

const smoke = process.env.BENCHMARK_SMOKE === "1";
const requestCount = Number(process.env.BENCHMARK_REQUESTS ?? (smoke ? 2 : 5));
const concurrency = Number(process.env.BENCHMARK_CONCURRENCY ?? (smoke ? 1 : 2));
const failOnThreshold = process.env.BENCHMARK_FAIL_ON_THRESHOLD === "1" || smoke;
const runId = new Date().toISOString().replace(/[:.]/g, "-");
const benchmarkToken = signAccessToken({
  sub: "usr_benchmark_admin",
  role: "admin",
  scope: "benchmark"
});

const thresholds = JSON.parse(
  await readFile(join(__dirname, "thresholds.json"), "utf8")
);

let localServer;
let baseUrl = process.env.BENCHMARK_BASE_URL;

if (!baseUrl) {
  const app = createApp();
  localServer = app.listen(0);
  await onceListening(localServer);
  const { port } = localServer.address();
  baseUrl = `http://127.0.0.1:${port}`;
}

try {
  const startedAt = new Date();
  const results = [];
  for (const route of routes) {
    results.push(await runRoute(route));
  }

  const report = {
    runId,
    mode: smoke ? "smoke" : "full",
    baseUrl,
    startedAt: startedAt.toISOString(),
    finishedAt: new Date().toISOString(),
    requestsPerEndpoint: requestCount,
    concurrency,
    environment: environment(),
    thresholds: smoke ? thresholds.smoke : thresholds.defaults,
    results
  };

  report.thresholdFailures = thresholdFailures(report);

  await mkdir(resultsDir, { recursive: true });
  await writeFile(latestJson, `${JSON.stringify(report, null, 2)}\n`);
  await writeFile(latestMarkdown, markdown(report));

  console.log(markdown(report));

  if (failOnThreshold && report.thresholdFailures.length > 0) {
    process.exitCode = 1;
  }
} finally {
  if (localServer) {
    await new Promise((resolve, reject) => {
      localServer.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function runRoute(route) {
  const samples = [];
  const queue = Array.from({ length: requestCount }, (_, index) => index);
  const started = performance.now();
  const workers = Array.from(
    { length: Math.max(1, Math.min(concurrency, requestCount)) },
    async () => {
      while (queue.length > 0) {
        const index = queue.shift();
        samples.push(await request(route, index));
      }
    }
  );

  await Promise.all(workers);
  const elapsedMs = performance.now() - started;
  const successful = samples.filter((sample) => sample.status >= 200 && sample.status < 500);
  const durations = successful.map((sample) => sample.durationMs).sort((a, b) => a - b);
  const ttfbs = successful.map((sample) => sample.ttfbMs).sort((a, b) => a - b);
  const errors = samples.filter((sample) => sample.error || sample.status >= 500);
  const statusCounts = {};
  for (const sample of samples) {
    const key = sample.error ? "error" : String(sample.status);
    statusCounts[key] = (statusCounts[key] ?? 0) + 1;
  }

  return {
    id: route.id,
    method: route.method,
    path: route.path,
    requests: samples.length,
    p50Ms: percentile(durations, 50),
    p95Ms: percentile(durations, 95),
    p99Ms: percentile(durations, 99),
    ttfbP95Ms: percentile(ttfbs, 95),
    sustainedRps: round((samples.length / elapsedMs) * 1000),
    peakRps: peakRps(samples),
    errorRatePercent: round((errors.length / samples.length) * 100),
    statusCounts
  };
}

async function request(route, index) {
  const url = new URL(route.path, baseUrl);
  const headers = {};
  let body;

  if (route.auth) {
    headers.authorization = `Bearer ${benchmarkToken}`;
  }

  if (route.json) {
    body = JSON.stringify(route.json({ runId, index }));
    headers["content-type"] = "application/json";
    headers["content-length"] = Buffer.byteLength(body);
  }

  if (route.multipart) {
    const boundary = `----freelanceflow-benchmark-${runId}-${index}`;
    body = multipartBody(boundary, route.multipart);
    headers["content-type"] = `multipart/form-data; boundary=${boundary}`;
    headers["content-length"] = Buffer.byteLength(body);
  }

  const started = performance.now();
  const sample = await rawRequest(url, {
    method: route.method,
    headers,
    body
  });
  sample.startedAtMs = started;
  return sample;
}

function rawRequest(url, options) {
  const transport = url.protocol === "https:" ? https : http;
  const started = performance.now();
  let firstByteAt;

  return new Promise((resolve) => {
    const req = transport.request(
      url,
      {
        method: options.method,
        headers: options.headers
      },
      (res) => {
        let bytes = 0;
        res.on("data", (chunk) => {
          firstByteAt ??= performance.now();
          bytes += chunk.length;
        });
        res.on("end", () => {
          const ended = performance.now();
          resolve({
            status: res.statusCode ?? 0,
            durationMs: round(ended - started),
            ttfbMs: round((firstByteAt ?? ended) - started),
            bytes
          });
        });
      }
    );

    req.on("error", (error) => {
      const ended = performance.now();
      resolve({
        status: 0,
        durationMs: round(ended - started),
        ttfbMs: round(ended - started),
        bytes: 0,
        error: error.message
      });
    });

    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

function multipartBody(boundary, part) {
  return [
    `--${boundary}`,
    `Content-Disposition: form-data; name="${part.field}"; filename="${part.filename}"`,
    `Content-Type: ${part.contentType}`,
    "",
    part.body,
    `--${boundary}--`,
    ""
  ].join("\r\n");
}

function percentile(values, percentileValue) {
  if (values.length === 0) return 0;
  const index = Math.ceil((percentileValue / 100) * values.length) - 1;
  return round(values[Math.max(0, Math.min(index, values.length - 1))]);
}

function peakRps(samples) {
  const buckets = new Map();
  for (const sample of samples) {
    const second = Math.floor(sample.startedAtMs / 1000);
    buckets.set(second, (buckets.get(second) ?? 0) + 1);
  }
  return Math.max(...buckets.values(), 0);
}

function thresholdFailures(report) {
  const activeThresholds = report.thresholds;
  return report.results.flatMap((result) => {
    const failures = [];
    if (result.p99Ms > activeThresholds.p99Ms) {
      failures.push(`${result.id}: p99 ${result.p99Ms}ms > ${activeThresholds.p99Ms}ms`);
    }
    if (result.errorRatePercent > activeThresholds.errorRatePercent) {
      failures.push(
        `${result.id}: error rate ${result.errorRatePercent}% > ${activeThresholds.errorRatePercent}%`
      );
    }
    return failures;
  });
}

function markdown(report) {
  const lines = [
    "# API Benchmark Report",
    "",
    `- Run ID: ${report.runId}`,
    `- Mode: ${report.mode}`,
    `- Target: ${report.baseUrl}`,
    `- Requests per endpoint: ${report.requestsPerEndpoint}`,
    `- Concurrency: ${report.concurrency}`,
    `- Runtime: ${report.environment.node}`,
    `- OS: ${report.environment.os}`,
    `- CPU: ${report.environment.cpu}`,
    `- Memory: ${report.environment.memory}`,
    "",
    "| Endpoint | Method | Path | Requests | p50 ms | p95 ms | p99 ms | TTFB p95 ms | Sustained RPS | Peak RPS | Error % | Statuses |",
    "| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |"
  ];

  for (const result of report.results) {
    lines.push(
      `| ${result.id} | ${result.method} | \`${result.path}\` | ${result.requests} | ${result.p50Ms} | ${result.p95Ms} | ${result.p99Ms} | ${result.ttfbP95Ms} | ${result.sustainedRps} | ${result.peakRps} | ${result.errorRatePercent} | ${statuses(result.statusCounts)} |`
    );
  }

  lines.push("", "## Threshold Gate", "");
  if (report.thresholdFailures.length === 0) {
    lines.push("No threshold failures.");
  } else {
    for (const failure of report.thresholdFailures) {
      lines.push(`- ${failure}`);
    }
  }
  lines.push("");
  return `${lines.join("\n")}\n`;
}

function statuses(statusCounts) {
  return Object.entries(statusCounts)
    .map(([status, count]) => `${status}: ${count}`)
    .join(", ");
}

function environment() {
  const cpus = os.cpus();
  return {
    node: process.version,
    os: `${os.type()} ${os.release()} ${os.arch()}`,
    cpu: cpus[0] ? `${cpus[0].model} (${cpus.length} logical cores)` : "unknown",
    memory: `${Math.round(os.totalmem() / 1024 / 1024)}MB total, ${Math.round(os.freemem() / 1024 / 1024)}MB free at start`
  };
}

function onceListening(server) {
  return new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
}

function round(value) {
  return Number(value.toFixed(2));
}
