import autocannon from "autocannon";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import http from "node:http";
import https from "node:https";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { performance } from "node:perf_hooks";
import { benchmarkRoutes } from "./routes.mjs";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = resolve(rootDir, "benchmarks/.env.benchmark");

await loadEnvFile(envPath);

const isSmoke = process.argv.includes("--smoke");
const resultsDir = resolve(rootDir, process.env.BENCHMARK_RESULTS_DIR ?? "benchmarks/results");
const benchmarkToken = process.env.BENCHMARK_BYPASS_TOKEN ?? randomUUID();
process.env.BENCHMARK_BYPASS_TOKEN = benchmarkToken;

const runConfig = {
  duration: isSmoke ? 1 : Number(process.env.BENCHMARK_DURATION_SECONDS ?? 5),
  connections: isSmoke ? 1 : Number(process.env.BENCHMARK_CONNECTIONS ?? 8),
  pipelining: Number(process.env.BENCHMARK_PIPELINING ?? 1)
};

const serverContext = await resolveTarget();
const thresholds = JSON.parse(
  await readFile(resolve(rootDir, "benchmarks/thresholds.json"), "utf8")
);

try {
  const startedAt = new Date();
  const results = [];

  for (const route of benchmarkRoutes) {
    results.push(await benchmarkRoute(serverContext.baseUrl, route, runConfig, benchmarkToken));
  }

  const report = {
    mode: isSmoke ? "smoke" : "full",
    startedAt: startedAt.toISOString(),
    finishedAt: new Date().toISOString(),
    target: serverContext.baseUrl,
    config: runConfig,
    routeCount: benchmarkRoutes.length,
    routes: results,
    thresholds: evaluateThresholds(results, thresholds)
  };

  await writeReports(report, resultsDir);

  if (report.thresholds.failures.length > 0) {
    for (const failure of report.thresholds.failures) {
      console.error(`Threshold failed: ${failure}`);
    }
    process.exitCode = 1;
  }
} finally {
  await serverContext.close();
}

async function resolveTarget() {
  if (process.env.BENCHMARK_BASE_URL) {
    return {
      baseUrl: process.env.BENCHMARK_BASE_URL.replace(/\/$/, ""),
      close: async () => {}
    };
  }

  const { createApp } = await import("../apps/api/src/app.js");
  const app = createApp();
  const server = await new Promise((resolveServer) => {
    const listeningServer = app.listen(0, "127.0.0.1", () => resolveServer(listeningServer));
  });
  const { port } = server.address();

  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolveClose, rejectClose) => {
      server.close((error) => (error ? rejectClose(error) : resolveClose()));
    })
  };
}

async function benchmarkRoute(baseUrl, route, config, benchmarkToken) {
  const headers = {
    ...route.headers,
    "x-benchmark-token": benchmarkToken
  };

  if (route.authRole) {
    headers.authorization = `Bearer ${await createToken(route.authRole)}`;
  }

  const body = typeof route.body === "string" ? route.body : JSON.stringify(route.body ?? {});
  const url = `${baseUrl}${route.path}`;
  const ttfbMs = await measureTtfb(url, route.method, headers, body);

  const result = await autocannon({
    url,
    method: route.method,
    headers,
    body: ["GET", "HEAD"].includes(route.method) ? undefined : body,
    duration: config.duration,
    connections: config.connections,
    pipelining: config.pipelining
  });

  const totalRequests = result.requests.total || 0;
  const failedRequests = (result.errors || 0) + (result.timeouts || 0) + (result.non2xx || 0);
  const errorRatePct = totalRequests === 0 ? 100 : Number(((failedRequests / totalRequests) * 100).toFixed(2));

  return {
    name: route.name,
    method: route.method,
    path: route.path,
    statusCode: result["2xx"] > 0 ? "2xx" : "non-2xx",
    requestsTotal: totalRequests,
    sustainedRps: round(result.requests.average),
    peakRps: round(result.requests.max),
    latencyMs: {
      p50: round(result.latency.p50),
      p95: round(result.latency.p95 ?? result.latency.p97_5 ?? result.latency.p99),
      p99: round(result.latency.p99)
    },
    ttfbMs,
    errorRatePct,
    errors: result.errors,
    timeouts: result.timeouts,
    non2xx: result.non2xx
  };
}

async function createToken(role) {
  const { signAccessToken } = await import("../apps/api/src/utils/jwt.js");
  return signAccessToken({
    sub: process.env.BENCHMARK_ADMIN_SUB ?? "bench_admin",
    role
  });
}

async function measureTtfb(url, method, headers, body) {
  const target = new URL(url);
  const client = target.protocol === "https:" ? https : http;
  const startedAt = performance.now();

  return new Promise((resolveTtfb) => {
    const request = client.request(
      target,
      {
        method,
        headers
      },
      (response) => {
        response.resume();
        resolveTtfb(round(performance.now() - startedAt));
      }
    );

    request.on("error", () => resolveTtfb(null));
    if (!["GET", "HEAD"].includes(method) && body) {
      request.write(body);
    }
    request.end();
  });
}

function evaluateThresholds(results, thresholds) {
  const failures = [];

  for (const result of results) {
    const routeThreshold = thresholds.routes?.[result.name] ?? thresholds.default;
    if (!routeThreshold) {
      continue;
    }

    if (result.latencyMs.p99 > routeThreshold.p99Ms) {
      failures.push(`${result.name} p99 ${result.latencyMs.p99}ms > ${routeThreshold.p99Ms}ms`);
    }

    if (result.errorRatePct > routeThreshold.errorRatePct) {
      failures.push(`${result.name} error rate ${result.errorRatePct}% > ${routeThreshold.errorRatePct}%`);
    }
  }

  return { failures };
}

async function writeReports(report, resultsDir) {
  await mkdir(resultsDir, { recursive: true });

  const safeTimestamp = report.startedAt.replace(/[:.]/g, "-");
  const jsonPath = resolve(resultsDir, `${safeTimestamp}.json`);
  const markdownPath = resolve(resultsDir, `${safeTimestamp}.md`);
  const markdown = renderMarkdown(report);

  await writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
  await writeFile(markdownPath, markdown);
  await writeFile(resolve(resultsDir, "latest.json"), `${JSON.stringify(report, null, 2)}\n`);
  await writeFile(resolve(resultsDir, "latest.md"), markdown);

  console.log(`Wrote ${jsonPath}`);
  console.log(`Wrote ${markdownPath}`);
  console.log(renderConsoleSummary(report.routes));
}

function renderMarkdown(report) {
  const rows = report.routes.map((route) => [
    route.name,
    route.latencyMs.p50,
    route.latencyMs.p95,
    route.latencyMs.p99,
    route.sustainedRps,
    route.peakRps,
    route.errorRatePct,
    route.ttfbMs ?? "n/a"
  ].join(" | "));

  const thresholdStatus = report.thresholds.failures.length === 0
    ? "PASS"
    : `FAIL\n\n${report.thresholds.failures.map((failure) => `- ${failure}`).join("\n")}`;

  return [
    "# API Benchmark Report",
    "",
    `- Mode: ${report.mode}`,
    `- Target: ${report.target}`,
    `- Started: ${report.startedAt}`,
    `- Finished: ${report.finishedAt}`,
    `- Duration per route: ${report.config.duration}s`,
    `- Connections: ${report.config.connections}`,
    `- Pipelining: ${report.config.pipelining}`,
    `- Routes covered: ${report.routeCount}`,
    `- Threshold status: ${thresholdStatus}`,
    "",
    "Endpoint | p50 ms | p95 ms | p99 ms | sustained req/s | peak req/s | error % | TTFB ms",
    "--- | ---: | ---: | ---: | ---: | ---: | ---: | ---:",
    ...rows,
    ""
  ].join("\n");
}

function renderConsoleSummary(routes) {
  return routes
    .map((route) => `${route.name}: p99=${route.latencyMs.p99}ms rps=${route.sustainedRps} error=${route.errorRatePct}%`)
    .join("\n");
}

async function loadEnvFile(path) {
  try {
    const contents = await readFile(path, "utf8");
    for (const line of contents.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }

      const separatorIndex = trimmed.indexOf("=");
      if (separatorIndex === -1) {
        continue;
      }

      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1).trim();
      process.env[key] ??= value;
    }
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }
}

function round(value) {
  return value == null ? null : Number(value.toFixed(2));
}
