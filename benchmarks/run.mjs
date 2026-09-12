import autocannon from "autocannon";
import fs from "node:fs/promises";
import http from "node:http";
import https from "node:https";
import os from "node:os";
import path from "node:path";
import { performance } from "node:perf_hooks";
import process from "node:process";
import jwt from "jsonwebtoken";
import { createApp } from "../apps/api/src/app.js";
import { env } from "../apps/api/src/config/env.js";
import { benchmarkRoutes } from "./routes.mjs";

const args = new Set(process.argv.slice(2));
const smoke = args.has("--smoke");

const config = {
  duration: Number(process.env.BENCHMARK_DURATION_SECONDS ?? (smoke ? 2 : 10)),
  connections: Number(process.env.BENCHMARK_CONNECTIONS ?? (smoke ? 2 : 10)),
  pipelining: Number(process.env.BENCHMARK_PIPELINING ?? 1),
  resultsDir: process.env.BENCHMARK_RESULTS_DIR ?? "benchmarks/results",
  baseUrl: process.env.BENCHMARK_BASE_URL ?? ""
};

const token =
  process.env.BENCHMARK_AUTH_TOKEN ??
  jwt.sign({ sub: "usr_benchmark_admin", role: "admin", benchmark: true }, env.jwtSecret, {
    expiresIn: "30m"
  });

const thresholds = JSON.parse(await fs.readFile("benchmarks/thresholds.json", "utf8"));

let server;
let baseUrl = config.baseUrl.replace(/\/$/, "");

if (!baseUrl) {
  const app = createApp();
  server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
}

try {
  const startedAt = new Date().toISOString();
  const routeResults = [];

  for (const route of benchmarkRoutes) {
    const result = await runRoute(baseUrl, route);
    routeResults.push(result);
    process.stdout.write(
      `${route.name} p99=${result.metrics.p99Ms}ms rps=${result.metrics.requestsPerSecond} errors=${result.metrics.errorRate}\n`
    );
  }

  const report = {
    startedAt,
    finishedAt: new Date().toISOString(),
    mode: smoke ? "smoke" : "full",
    target: baseUrl,
    config,
    environment: environmentSummary(),
    routes: routeResults,
    thresholdFailures: evaluateThresholds(routeResults)
  };

  await fs.mkdir(config.resultsDir, { recursive: true });
  await fs.writeFile(
    path.join(config.resultsDir, "latest.json"),
    `${JSON.stringify(report, null, 2)}\n`
  );
  await fs.writeFile(path.join(config.resultsDir, "latest.md"), renderMarkdown(report));

  if (report.thresholdFailures.length > 0) {
    for (const failure of report.thresholdFailures) {
      process.stderr.write(`${failure.route}: ${failure.reason}\n`);
    }
    process.exitCode = 1;
  }
} finally {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function runRoute(base, route) {
  const headers = {
    "content-type": "application/json",
    "x-benchmark-run": "true"
  };

  if (route.auth) {
    headers.authorization = `Bearer ${token}`;
  }

  const body = route.body === undefined ? undefined : JSON.stringify(route.body);
  const [result, ttfbMs] = await Promise.all([
    autocannon({
      url: `${base}${route.path}`,
      method: route.method,
      headers,
      body,
      duration: config.duration,
      connections: config.connections,
      pipelining: config.pipelining
    }),
    measureTtfb(`${base}${route.path}`, route, headers, body)
  ]);

  const totalRequests = result.requests.total || 0;
  const totalErrors = (result.errors || 0) + (result.timeouts || 0);
  const non2xx = result.non2xx || 0;

  return {
    name: route.name,
    method: route.method,
    path: route.path,
    auth: Boolean(route.auth),
    metrics: {
      p50Ms: latencyPercentile(result.latency, "p50"),
      p95Ms: latencyPercentile(result.latency, "p95"),
      p99Ms: latencyPercentile(result.latency, "p99"),
      requestsPerSecond: roundMetric(result.requests.average),
      peakRequestsPerSecond: roundMetric(result.requests.max),
      errorRate: rate(totalErrors, totalRequests),
      non2xxRate: rate(non2xx, totalRequests),
      ttfbMs: roundMetric(ttfbMs),
      totalRequests
    }
  };
}

function measureTtfb(url, route, headers, body) {
  const client = url.startsWith("https:") ? https : http;
  const target = new URL(url);

  return new Promise((resolve, reject) => {
    const started = performance.now();
    const request = client.request(
      target,
      {
        method: route.method,
        headers: {
          ...headers,
          "content-length": body ? Buffer.byteLength(body) : 0
        }
      },
      (response) => {
        const ttfb = performance.now() - started;
        response.resume();
        response.on("end", () => resolve(ttfb));
      }
    );

    request.on("error", reject);
    if (body) request.write(body);
    request.end();
  });
}

function evaluateThresholds(routes) {
  const failures = [];

  for (const route of routes) {
    const routeThresholds = {
      ...thresholds.defaults,
      ...(thresholds.routes?.[route.name] ?? {})
    };

    if (route.metrics.p99Ms > routeThresholds.maxP99Ms) {
      failures.push({
        route: route.name,
        reason: `p99 ${route.metrics.p99Ms}ms exceeds ${routeThresholds.maxP99Ms}ms`
      });
    }

    if (route.metrics.errorRate > routeThresholds.maxErrorRate) {
      failures.push({
        route: route.name,
        reason: `error rate ${route.metrics.errorRate} exceeds ${routeThresholds.maxErrorRate}`
      });
    }

    if (route.metrics.non2xxRate > routeThresholds.maxNon2xxRate) {
      failures.push({
        route: route.name,
        reason: `non-2xx rate ${route.metrics.non2xxRate} exceeds ${routeThresholds.maxNon2xxRate}`
      });
    }
  }

  return failures;
}

function renderMarkdown(report) {
  const rows = report.routes
    .map(
      (route) =>
        `| ${route.name} | ${route.metrics.p50Ms} | ${route.metrics.p95Ms} | ${route.metrics.p99Ms} | ${route.metrics.requestsPerSecond} | ${route.metrics.peakRequestsPerSecond} | ${route.metrics.errorRate} | ${route.metrics.non2xxRate} | ${route.metrics.ttfbMs} |`
    )
    .join("\n");

  const failures =
    report.thresholdFailures.length === 0
      ? "No threshold failures."
      : report.thresholdFailures.map((failure) => `- ${failure.route}: ${failure.reason}`).join("\n");

  return `# API benchmark report

- Mode: ${report.mode}
- Target: ${report.target}
- Started: ${report.startedAt}
- Finished: ${report.finishedAt}
- Connections: ${report.config.connections}
- Duration per endpoint: ${report.config.duration}s

| Route | p50 ms | p95 ms | p99 ms | Avg RPS | Peak RPS | Error rate | Non-2xx rate | TTFB ms |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
${rows}

## Thresholds

${failures}

## Environment

- OS: ${report.environment.os}
- CPU: ${report.environment.cpu}
- Logical cores: ${report.environment.logicalCores}
- Total memory MB: ${report.environment.totalMemoryMb}
- Free memory MB: ${report.environment.freeMemoryMb}
- Node.js: ${report.environment.node}
`;
}

function environmentSummary() {
  const cpus = os.cpus();
  return {
    os: `${os.type()} ${os.release()} ${os.arch()}`,
    cpu: cpus[0]?.model ?? "unknown",
    logicalCores: cpus.length,
    totalMemoryMb: Math.round(os.totalmem() / 1024 / 1024),
    freeMemoryMb: Math.round(os.freemem() / 1024 / 1024),
    node: process.version
  };
}

function rate(count, total) {
  return total === 0 ? 0 : roundMetric(count / total);
}

function roundMetric(value) {
  return Number((value ?? 0).toFixed(4));
}

function latencyPercentile(latency, percentile) {
  if (percentile === "p95") {
    return roundMetric(latency.p95 ?? latency.p97_5 ?? latency.p99);
  }

  return roundMetric(latency[percentile]);
}
