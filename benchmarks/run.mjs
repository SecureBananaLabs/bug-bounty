import fs from "node:fs/promises";
import http from "node:http";
import https from "node:https";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import autocannon from "autocannon";
import jwt from "jsonwebtoken";
import { buildBenchmarkRoutes } from "./routes.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const resultsDir = path.join(__dirname, "results");
const isSmoke = process.env.BENCHMARK_SMOKE === "1" || process.argv.includes("--smoke");
const duration = Number(process.env.BENCHMARK_DURATION_SECONDS ?? (isSmoke ? 1 : 5));
const connections = Number(process.env.BENCHMARK_CONNECTIONS ?? (isSmoke ? 1 : 8));
const jwtSecret = process.env.BENCHMARK_JWT_SECRET ?? process.env.JWT_SECRET ?? "benchmark-secret";

process.env.JWT_SECRET = jwtSecret;
process.env.BENCHMARK_DISABLE_RATE_LIMIT ??= "1";
process.env.NODE_ENV ??= "benchmark";

async function main() {
  await fs.mkdir(resultsDir, { recursive: true });

  const serverContext = await getServerContext();
  const authToken = jwt.sign({ sub: "benchmark-admin", role: "admin" }, jwtSecret, { expiresIn: "15m" });
  const routes = buildBenchmarkRoutes(authToken);
  const startedAt = new Date().toISOString();
  const results = [];

  try {
    for (const route of routes) {
      const url = new URL(route.path, serverContext.baseUrl).toString();
      const ttfbMs = await measureTtfb(url, route);
      const load = await runLoad(url, route);
      results.push(toEndpointResult(route, load, ttfbMs));
    }
  } finally {
    await serverContext.close?.();
  }

  const thresholds = await readThresholds();
  const selectedThresholds = isSmoke ? thresholds.smoke : thresholds.default;
  const failures = findThresholdFailures(results, selectedThresholds);
  const report = {
    startedAt,
    finishedAt: new Date().toISOString(),
    mode: isSmoke ? "smoke" : "full",
    baseUrl: serverContext.redactedBaseUrl,
    configuration: { durationSeconds: duration, connections },
    environment: getEnvironment(),
    thresholds: selectedThresholds,
    endpoints: results,
    failures
  };

  const timestamp = startedAt.replace(/[:.]/g, "-");
  await fs.writeFile(path.join(resultsDir, `benchmark-${timestamp}.json`), `${JSON.stringify(report, null, 2)}\n`);
  await fs.writeFile(path.join(resultsDir, `benchmark-${timestamp}.md`), renderMarkdown(report));
  await fs.writeFile(path.join(resultsDir, "latest.json"), `${JSON.stringify(report, null, 2)}\n`);
  await fs.writeFile(path.join(resultsDir, "latest.md"), renderMarkdown(report));

  console.log(renderConsoleSummary(report));

  if (failures.length > 0) {
    process.exitCode = 1;
  }
}

async function getServerContext() {
  if (process.env.BENCHMARK_BASE_URL) {
    return {
      baseUrl: process.env.BENCHMARK_BASE_URL,
      redactedBaseUrl: process.env.BENCHMARK_BASE_URL.replace(/\/\/([^/@]+)@/, "//***@")
    };
  }

  const { createApp } = await import(path.join(rootDir, "apps/api/src/app.js"));
  const app = createApp();
  const server = http.createServer(app);

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();

  return {
    baseUrl: `http://127.0.0.1:${port}`,
    redactedBaseUrl: "local Express app",
    close: () => new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())))
  };
}

function runLoad(url, route) {
  return new Promise((resolve, reject) => {
    autocannon({
      url,
      method: route.method,
      headers: route.headers,
      body: route.body,
      connections,
      duration,
      timeout: 10
    }, (err, result) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(result);
    });
  });
}

function measureTtfb(url, route) {
  return new Promise((resolve, reject) => {
    const target = new URL(url);
    const client = target.protocol === "https:" ? https : http;
    const started = process.hrtime.bigint();
    const req = client.request({
      method: route.method,
      protocol: target.protocol,
      hostname: target.hostname,
      port: target.port,
      path: `${target.pathname}${target.search}`,
      headers: {
        ...(route.headers ?? {}),
        ...(route.body ? { "content-length": Buffer.byteLength(route.body) } : {})
      }
    }, (res) => {
      const firstByte = process.hrtime.bigint();
      res.resume();
      res.on("end", () => resolve(Number(firstByte - started) / 1_000_000));
    });

    req.on("error", reject);
    if (route.body) {
      req.write(route.body);
    }
    req.end();
  });
}

function toEndpointResult(route, load, ttfbMs) {
  const totalRequests = load.requests.total || 0;
  const failedRequests = (load.errors || 0) + (load.timeouts || 0) + (load.non2xx || 0);
  const errorRatePercent = totalRequests === 0 ? 100 : (failedRequests / totalRequests) * 100;

  return {
    name: route.name,
    method: route.method,
    path: route.path,
    latencyMs: {
      p50: load.latency.p50,
      p95: load.latency.p95 ?? load.latency.p97_5 ?? load.latency.p90 ?? load.latency.p99,
      p99: load.latency.p99
    },
    requestsPerSecond: {
      sustained: load.requests.average,
      peak: load.requests.max
    },
    errorRatePercent: Number(errorRatePercent.toFixed(2)),
    ttfbMs: Number(ttfbMs.toFixed(2)),
    totalRequests,
    failedRequests
  };
}

async function readThresholds() {
  const raw = await fs.readFile(path.join(__dirname, "thresholds.json"), "utf8");
  return JSON.parse(raw);
}

function findThresholdFailures(results, thresholds) {
  return results.flatMap((result) => {
    const failures = [];
    if (result.latencyMs.p99 > thresholds.maxP99Ms) {
      failures.push(`${result.name}: p99 ${result.latencyMs.p99}ms > ${thresholds.maxP99Ms}ms`);
    }
    if (result.errorRatePercent > thresholds.maxErrorRatePercent) {
      failures.push(`${result.name}: error rate ${result.errorRatePercent}% > ${thresholds.maxErrorRatePercent}%`);
    }
    if (result.requestsPerSecond.sustained < thresholds.minSustainedRps) {
      failures.push(`${result.name}: sustained RPS ${result.requestsPerSecond.sustained} < ${thresholds.minSustainedRps}`);
    }
    return failures;
  });
}

function getEnvironment() {
  const cpus = os.cpus();
  return {
    cpu: cpus[0] ? `${cpus[0].model} (${cpus.length} logical cores)` : "unknown",
    ramMb: Math.round(os.totalmem() / 1024 / 1024),
    freeRamMb: Math.round(os.freemem() / 1024 / 1024),
    platform: `${os.type()} ${os.release()} ${os.arch()}`,
    node: process.version,
    network: process.env.BENCHMARK_BASE_URL ? "configured target" : "loopback",
    machineType: process.env.CI ? "CI runner" : "local workstation"
  };
}

function renderMarkdown(report) {
  const rows = report.endpoints.map((endpoint) => [
    endpoint.name,
    `${endpoint.method} ${endpoint.path}`,
    endpoint.latencyMs.p50,
    endpoint.latencyMs.p95,
    endpoint.latencyMs.p99,
    endpoint.requestsPerSecond.sustained,
    endpoint.requestsPerSecond.peak,
    endpoint.errorRatePercent,
    endpoint.ttfbMs
  ]);

  return `# API Benchmark Summary

- Started: ${report.startedAt}
- Finished: ${report.finishedAt}
- Mode: ${report.mode}
- Target: ${report.baseUrl}
- Duration per endpoint: ${report.configuration.durationSeconds}s
- Connections: ${report.configuration.connections}
- Thresholds: p99 <= ${report.thresholds.maxP99Ms}ms, error rate <= ${report.thresholds.maxErrorRatePercent}%, sustained RPS >= ${report.thresholds.minSustainedRps}

## Environment

- CPU: ${report.environment.cpu}
- RAM: ${report.environment.ramMb} MB total, ${report.environment.freeRamMb} MB free at start
- Storage: local workspace storage
- Network: ${report.environment.network}
- Machine type: ${report.environment.machineType}
- OS: ${report.environment.platform}
- Node.js: ${report.environment.node}
- Other significant processes: normal local/CI background processes

## Endpoint Metrics

| Endpoint | Route | p50 ms | p95 ms | p99 ms | Sustained RPS | Peak RPS | Error rate % | TTFB ms |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
${rows.map((row) => `| ${row.join(" | ")} |`).join("\n")}

## Regression Gate

${report.failures.length === 0 ? "No threshold failures." : report.failures.map((failure) => `- ${failure}`).join("\n")}
`;
}

function renderConsoleSummary(report) {
  return [
    `Benchmark ${report.mode} run complete: ${report.endpoints.length} endpoints`,
    `Results: ${path.relative(rootDir, path.join(resultsDir, "latest.json"))}`,
    `Summary: ${path.relative(rootDir, path.join(resultsDir, "latest.md"))}`,
    report.failures.length ? `Failures:\n${report.failures.join("\n")}` : "Thresholds passed"
  ].join("\n");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
