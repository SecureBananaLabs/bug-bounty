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
const rootDir = path.resolve(__dirname, "..");
const resultsDir = path.join(__dirname, "results");

const args = new Set(process.argv.slice(2));
const isSmoke = args.has("--smoke");
const requestCount = Number(process.env.BENCHMARK_REQUESTS_PER_ENDPOINT ?? (isSmoke ? 1 : 5));
const concurrency = Number(process.env.BENCHMARK_CONCURRENCY ?? (isSmoke ? 1 : 2));
const timeoutMs = Number(process.env.BENCHMARK_TIMEOUT_MS ?? 5000);

const manifest = JSON.parse(await readFile(path.join(__dirname, "route-manifest.json"), "utf8"));
const thresholds = JSON.parse(await readFile(path.join(__dirname, "thresholds.json"), "utf8"));

let server;
let targetUrl = process.env.BENCHMARK_TARGET_URL;

if (!targetUrl) {
  const app = createApp();
  server = await new Promise((resolve) => {
    const listener = app.listen(0, "127.0.0.1", () => resolve(listener));
  });
  const address = server.address();
  targetUrl = `http://127.0.0.1:${address.port}`;
}

try {
  await mkdir(resultsDir, { recursive: true });
  const startedAt = new Date().toISOString();
  const endpointResults = [];

  for (const endpoint of manifest) {
    endpointResults.push(await benchmarkEndpoint(endpoint));
  }

  const finishedAt = new Date().toISOString();
  const summary = {
    metadata: {
      mode: isSmoke ? "smoke" : "full",
      targetUrl,
      startedAt,
      finishedAt,
      requestCount,
      concurrency,
      timeoutMs,
      routeCount: manifest.length,
      environment: {
        node: process.version,
        platform: `${os.platform()} ${os.release()} ${os.arch()}`,
        cpu: os.cpus()[0]?.model ?? "unknown",
        cpuCount: os.cpus().length,
        totalMemoryMb: Math.round(os.totalmem() / 1024 / 1024),
        freeMemoryMb: Math.round(os.freemem() / 1024 / 1024)
      }
    },
    endpoints: endpointResults,
    totals: summarizeTotals(endpointResults)
  };

  const failures = evaluateThresholds(endpointResults);
  summary.thresholdFailures = failures;

  await writeFile(
    path.join(resultsDir, "api-benchmark-latest.json"),
    `${JSON.stringify(summary, null, 2)}\n`
  );
  await writeFile(path.join(resultsDir, "api-benchmark-summary.md"), renderMarkdown(summary));

  printConsoleSummary(summary);

  if (failures.length > 0) {
    console.error(`\nBenchmark thresholds failed:\n${failures.map((failure) => `- ${failure}`).join("\n")}`);
    process.exitCode = 1;
  }
} finally {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function benchmarkEndpoint(endpoint) {
  const timings = [];
  const statuses = new Map();
  let failed = 0;
  const started = performance.now();
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < requestCount) {
      nextIndex += 1;
      const result = await sendRequest(endpoint);
      timings.push(result);
      statuses.set(result.statusCode, (statuses.get(result.statusCode) ?? 0) + 1);
      if (!endpoint.expectedStatus.includes(result.statusCode) || result.error) {
        failed += 1;
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, requestCount) }, () => worker()));

  const elapsedMs = performance.now() - started;
  const sortedLatency = timings.map((timing) => timing.latencyMs).sort((a, b) => a - b);
  const sortedTtfb = timings.map((timing) => timing.ttfbMs).sort((a, b) => a - b);
  const p50 = percentile(sortedLatency, 50);
  const p95 = percentile(sortedLatency, 95);
  const p99 = percentile(sortedLatency, 99);
  const p99Ttfb = percentile(sortedTtfb, 99);
  const sustainedRps = requestCount / (elapsedMs / 1000);
  const peakRps = p50 > 0 ? (1000 / p50) * Math.min(concurrency, requestCount) : sustainedRps;

  return {
    name: endpoint.name,
    method: endpoint.method,
    path: endpoint.path,
    requests: requestCount,
    statuses: Object.fromEntries([...statuses.entries()].sort(([a], [b]) => a - b)),
    p50Ms: round(p50),
    p95Ms: round(p95),
    p99Ms: round(p99),
    p99TtfbMs: round(p99Ttfb),
    sustainedRps: round(sustainedRps),
    peakRps: round(peakRps),
    errorRatePct: round((failed / requestCount) * 100),
    elapsedMs: round(elapsedMs)
  };
}

function sendRequest(endpoint) {
  return new Promise((resolve) => {
    const target = new URL(endpoint.path, targetUrl);
    const body = buildBody(endpoint);
    const headers = { ...body.headers };

    if (endpoint.auth) {
      headers.Authorization = `Bearer ${signAccessToken({ sub: "usr_benchmark_admin", role: "admin" })}`;
    }

    const options = {
      method: endpoint.method,
      hostname: target.hostname,
      port: target.port,
      path: `${target.pathname}${target.search}`,
      protocol: target.protocol,
      headers,
      timeout: timeoutMs
    };

    const transport = target.protocol === "https:" ? https : http;
    const started = performance.now();
    let ttfbMs = 0;

    const req = transport.request(options, (res) => {
      ttfbMs = performance.now() - started;
      res.resume();
      res.on("end", () => {
        resolve({
          statusCode: res.statusCode ?? 0,
          ttfbMs,
          latencyMs: performance.now() - started
        });
      });
    });

    req.on("timeout", () => {
      req.destroy(new Error(`Request timed out after ${timeoutMs}ms`));
    });
    req.on("error", () => {
      resolve({
        statusCode: 0,
        ttfbMs: ttfbMs || performance.now() - started,
        latencyMs: performance.now() - started,
        error: true
      });
    });

    if (body.payload) {
      req.write(body.payload);
    }

    req.end();
  });
}

function buildBody(endpoint) {
  if (endpoint.json) {
    const payload = Buffer.from(JSON.stringify(endpoint.json));
    return {
      payload,
      headers: {
        "Content-Type": "application/json",
        "Content-Length": payload.length
      }
    };
  }

  if (endpoint.multipart) {
    const boundary = `benchmark-${Date.now()}`;
    const part = [
      `--${boundary}`,
      `Content-Disposition: form-data; name="${endpoint.multipart.fieldName}"; filename="${endpoint.multipart.filename}"`,
      `Content-Type: ${endpoint.multipart.contentType}`,
      "",
      endpoint.multipart.content,
      `--${boundary}--`,
      ""
    ].join("\r\n");
    const payload = Buffer.from(part);
    return {
      payload,
      headers: {
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
        "Content-Length": payload.length
      }
    };
  }

  return { headers: {} };
}

function summarizeTotals(endpointResults) {
  const totalRequests = endpointResults.reduce((sum, result) => sum + result.requests, 0);
  const weightedErrors = endpointResults.reduce(
    (sum, result) => sum + (result.errorRatePct / 100) * result.requests,
    0
  );

  return {
    endpoints: endpointResults.length,
    requests: totalRequests,
    maxP99Ms: round(Math.max(...endpointResults.map((result) => result.p99Ms))),
    maxP99TtfbMs: round(Math.max(...endpointResults.map((result) => result.p99TtfbMs))),
    aggregateErrorRatePct: round((weightedErrors / totalRequests) * 100)
  };
}

function evaluateThresholds(endpointResults) {
  const failures = [];

  for (const result of endpointResults) {
    const endpointThreshold = {
      ...thresholds.default,
      ...(thresholds.endpoints?.[result.name] ?? {})
    };

    if (result.p99Ms > endpointThreshold.p99Ms) {
      failures.push(`${result.name} p99 ${result.p99Ms}ms > ${endpointThreshold.p99Ms}ms`);
    }
    if (result.p99TtfbMs > endpointThreshold.p99TtfbMs) {
      failures.push(`${result.name} p99 TTFB ${result.p99TtfbMs}ms > ${endpointThreshold.p99TtfbMs}ms`);
    }
    if (result.errorRatePct > endpointThreshold.errorRatePct) {
      failures.push(`${result.name} error rate ${result.errorRatePct}% > ${endpointThreshold.errorRatePct}%`);
    }
  }

  return failures;
}

function renderMarkdown(summary) {
  const rows = summary.endpoints
    .map((endpoint) =>
      `| ${[
        endpoint.name,
        endpoint.method,
        endpoint.path,
        endpoint.requests,
        endpoint.p50Ms,
        endpoint.p95Ms,
        endpoint.p99Ms,
        endpoint.p99TtfbMs,
        endpoint.sustainedRps,
        endpoint.errorRatePct
      ].join(" | ")} |`
    )
    .join("\n");

  return `# API Benchmark Summary

- Mode: ${summary.metadata.mode}
- Target: ${summary.metadata.targetUrl}
- Started: ${summary.metadata.startedAt}
- Finished: ${summary.metadata.finishedAt}
- Runtime: ${summary.metadata.environment.node} on ${summary.metadata.environment.platform}
- CPU: ${summary.metadata.environment.cpu} (${summary.metadata.environment.cpuCount} cores)
- Requests: ${summary.totals.requests} across ${summary.totals.endpoints} endpoints
- Max p99 latency: ${summary.totals.maxP99Ms} ms
- Max p99 TTFB: ${summary.totals.maxP99TtfbMs} ms
- Aggregate error rate: ${summary.totals.aggregateErrorRatePct}%
- Threshold failures: ${summary.thresholdFailures.length}

| Endpoint | Method | Path | Requests | p50 ms | p95 ms | p99 ms | p99 TTFB ms | Sustained RPS | Error % |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
${rows}
`;
}

function printConsoleSummary(summary) {
  console.log(`Benchmarked ${summary.totals.endpoints} endpoints (${summary.totals.requests} requests)`);
  console.log(`Max p99: ${summary.totals.maxP99Ms}ms`);
  console.log(`Max p99 TTFB: ${summary.totals.maxP99TtfbMs}ms`);
  console.log(`Aggregate error rate: ${summary.totals.aggregateErrorRatePct}%`);
  console.log(`Results: ${path.relative(rootDir, path.join(resultsDir, "api-benchmark-summary.md"))}`);
}

function percentile(sortedValues, percentileValue) {
  if (sortedValues.length === 0) return 0;
  const index = Math.ceil((percentileValue / 100) * sortedValues.length) - 1;
  return sortedValues[Math.min(Math.max(index, 0), sortedValues.length - 1)];
}

function round(value) {
  return Math.round(value * 100) / 100;
}
