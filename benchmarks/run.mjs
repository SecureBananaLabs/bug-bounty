import autocannon from "autocannon";
import { readFileSync } from "node:fs";
import fs from "node:fs/promises";
import http from "node:http";
import https from "node:https";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";
import { createApp } from "../apps/api/src/app.js";
import { signAccessToken } from "../apps/api/src/utils/jwt.js";
import { benchmarkRoutes } from "./routes.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const thresholdsPath = path.join(__dirname, "thresholds.json");

loadEnvFile(path.join(rootDir, ".env.benchmark"));

const isSmoke = process.argv.includes("--smoke");
const resultsDir = process.env.BENCHMARK_RESULTS_DIR ?? "benchmarks/results";
const absoluteResultsDir = path.resolve(rootDir, resultsDir);

function loadEnvFile(filePath) {
  try {
    const contents = readFileSync(filePath, "utf8");
    for (const line of contents.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
        continue;
      }
      const [key, ...valueParts] = trimmed.split("=");
      if (!process.env[key]) {
        process.env[key] = valueParts.join("=").trim();
      }
    }
  } catch {
    // .env.benchmark is optional; .env.benchmark.example documents the keys.
  }
}

function integerEnv(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

function durationEnv(name) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : undefined;
}

function serializeBody(route) {
  if (route.body == null) {
    return undefined;
  }
  return typeof route.body === "string" || Buffer.isBuffer(route.body)
    ? route.body
    : JSON.stringify(route.body);
}

function headersFor(route, token) {
  const headers = {
    ...(route.body != null ? { "content-type": "application/json" } : {}),
    ...(route.headers ?? {})
  };

  if (route.auth) {
    headers.authorization = `Bearer ${token}`;
  }

  return headers;
}

function runAutocannon(options) {
  return new Promise((resolve, reject) => {
    autocannon(options, (error, result) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(result);
    });
  });
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
    close: () =>
      new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      })
  };
}

async function measureTtfb(url, route, headers, body) {
  const client = url.startsWith("https:") ? https : http;
  const started = performance.now();

  return new Promise((resolve, reject) => {
    const request = client.request(
      url,
      {
        method: route.method,
        headers
      },
      (response) => {
        let resolved = false;
        response.once("data", () => {
          resolved = true;
          response.resume();
          resolve(performance.now() - started);
        });
        response.once("end", () => {
          if (!resolved) {
            resolve(performance.now() - started);
          }
        });
      }
    );

    request.once("error", reject);
    if (body != null) {
      request.write(body);
    }
    request.end();
  });
}

function summarizeResult(route, result, ttfbMs) {
  const totalRequests = result.requests.total || 0;
  const failedRequests = (result.errors || 0) + (result.timeouts || 0) + (result.non2xx || 0);
  const errorRatePct = totalRequests === 0 ? 100 : (failedRequests / totalRequests) * 100;

  return {
    name: route.name,
    method: route.method,
    path: route.path,
    requests: totalRequests,
    sustainedRps: round(result.requests.average ?? 0),
    peakRps: round(result.requests.max ?? 0),
    latencyMs: {
      p50: round(result.latency.p50 ?? 0),
      p95: round(result.latency.p95 ?? 0),
      p99: round(result.latency.p99 ?? 0)
    },
    ttfbMs: round(ttfbMs),
    errorRatePct: round(errorRatePct),
    non2xx: result.non2xx || 0,
    errors: result.errors || 0,
    timeouts: result.timeouts || 0
  };
}

function round(value) {
  return Math.round(value * 100) / 100;
}

function thresholdFor(thresholds, endpoint) {
  return {
    ...(thresholds[isSmoke ? "smoke" : "default"] ?? thresholds.default),
    ...(thresholds.endpoints?.[endpoint.name] ?? {})
  };
}

function evaluateThresholds(thresholds, results) {
  const failures = [];
  for (const result of results) {
    const threshold = thresholdFor(thresholds, result);
    if (result.latencyMs.p99 > threshold.p99Ms) {
      failures.push(`${result.name} p99 ${result.latencyMs.p99}ms > ${threshold.p99Ms}ms`);
    }
    if (result.errorRatePct > threshold.errorRatePct) {
      failures.push(
        `${result.name} error rate ${result.errorRatePct}% > ${threshold.errorRatePct}%`
      );
    }
  }
  return failures;
}

function markdownReport(report) {
  const rows = report.results
    .map((result) =>
      `| ${[
        result.name,
        `${result.method} ${result.path}`,
        result.requests,
        result.sustainedRps,
        result.peakRps,
        result.latencyMs.p50,
        result.latencyMs.p95,
        result.latencyMs.p99,
        result.ttfbMs,
        `${result.errorRatePct}%`
      ].join(" | ")} |`
    )
    .join("\n");

  return `# API Benchmark Summary

- Mode: ${report.mode}
- Target: ${report.target}
- Started: ${report.startedAt}
- Node: ${report.environment.node}
- Platform: ${report.environment.platform}
- Connections: ${report.options.connections}
- Requests per endpoint: ${report.options.amount ?? "duration-based"}
- Duration seconds: ${report.options.duration ?? "amount-based"}

| Endpoint | Route | Requests | Sustained RPS | Peak RPS | p50 ms | p95 ms | p99 ms | TTFB ms | Error rate |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
${rows}

${report.thresholdFailures.length === 0 ? "Threshold result: pass." : `Threshold failures:\n\n- ${report.thresholdFailures.join("\n- ")}`}
`;
}

async function writeReports(report) {
  await fs.mkdir(absoluteResultsDir, { recursive: true });

  const jsonPath = path.join(absoluteResultsDir, isSmoke ? "latest-smoke.json" : "latest.json");
  const markdownPath = path.join(
    absoluteResultsDir,
    isSmoke ? "latest-smoke.md" : "latest.md"
  );

  await fs.writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
  await fs.writeFile(markdownPath, markdownReport(report));

  return { jsonPath, markdownPath };
}

async function main() {
  let server;
  if (process.env.BENCHMARK_BASE_URL) {
    server = {
      baseUrl: process.env.BENCHMARK_BASE_URL.replace(/\/$/, ""),
      close: async () => {}
    };
  } else {
    server = await startLocalServer();
  }

  const thresholds = JSON.parse(await fs.readFile(thresholdsPath, "utf8"));
  const token =
    process.env.BENCHMARK_AUTH_TOKEN ??
    signAccessToken({ sub: "benchmark-admin", role: "admin" });
  const connections = integerEnv("BENCHMARK_CONNECTIONS", isSmoke ? 1 : 2);
  const duration = durationEnv("BENCHMARK_DURATION_SECONDS");
  const amount = duration
    ? undefined
    : integerEnv("BENCHMARK_REQUESTS_PER_ENDPOINT", isSmoke ? 3 : 8);
  const pipelining = integerEnv("BENCHMARK_PIPELINING", 1);
  const startedAt = new Date().toISOString();
  const results = [];

  try {
    for (const route of benchmarkRoutes) {
      const url = `${server.baseUrl}${route.path}`;
      const body = serializeBody(route);
      const headers = headersFor(route, token);
      const ttfbMs = await measureTtfb(url, route, headers, body);
      const result = await runAutocannon({
        url,
        method: route.method,
        headers,
        body,
        connections,
        pipelining,
        ...(duration ? { duration } : { amount })
      });

      results.push(summarizeResult(route, result, ttfbMs));
      const summary = results.at(-1);
      console.log(
        `${route.name}: p99=${summary.latencyMs.p99}ms rps=${summary.sustainedRps} errors=${summary.errorRatePct}%`
      );
    }
  } finally {
    await server.close();
  }

  const report = {
    mode: isSmoke ? "smoke" : "full",
    target: process.env.BENCHMARK_BASE_URL ? "external" : "local",
    baseUrl: server.baseUrl,
    startedAt,
    environment: {
      node: process.version,
      platform: `${process.platform} ${process.arch}`
    },
    options: {
      connections,
      amount,
      duration,
      pipelining
    },
    results,
    thresholdFailures: evaluateThresholds(thresholds, results)
  };

  const paths = await writeReports(report);
  console.log(`Wrote ${path.relative(rootDir, paths.jsonPath)}`);
  console.log(`Wrote ${path.relative(rootDir, paths.markdownPath)}`);

  if (report.thresholdFailures.length > 0) {
    console.error(report.thresholdFailures.join("\n"));
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
