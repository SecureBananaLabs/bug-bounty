import http from "node:http";
import https from "node:https";
import { createHmac } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { benchmarkRoutes } from "./routes.mjs";
import { buildJson, buildReport, summarizeSamples, writeResultsFiles } from "./report.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, "..");
const resultsDir = process.env.BENCHMARK_RESULTS_DIR
  ? path.resolve(projectRoot, process.env.BENCHMARK_RESULTS_DIR)
  : path.join(projectRoot, "benchmarks", "results");
const profile = process.env.BENCHMARK_PROFILE === "smoke" ? "smoke" : "full";
const benchmarkSecret = process.env.JWT_SECRET ?? "development-secret";
const targetUrl = process.env.BENCHMARK_TARGET_URL ?? "";

process.env.JWT_SECRET = benchmarkSecret;

let createApp = null;
if (!targetUrl) {
  ({ createApp } = await import("../apps/api/src/app.js"));
}

function parseConfig() {
  const defaults = profile === "smoke"
    ? { sampleCount: 4, warmupCount: 1, concurrency: 2 }
    : { sampleCount: 12, warmupCount: 2, concurrency: 4 };

  return {
    sampleCount: Number(process.env.BENCHMARK_SAMPLE_COUNT ?? defaults.sampleCount),
    warmupCount: Number(process.env.BENCHMARK_WARMUP_COUNT ?? defaults.warmupCount),
    concurrency: Number(process.env.BENCHMARK_CONCURRENCY ?? defaults.concurrency)
  };
}

function buildContext() {
  return {
    benchmarkToken: signJwt(
      {
        sub: "usr_benchmark",
        role: "admin"
      },
      benchmarkSecret
    )
  };
}

function getRequestClient(url) {
  return url.protocol === "https:" ? https : http;
}

function signJwt(payload, secret) {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  const body = Buffer.from(
    JSON.stringify({
      iat: now,
      exp: now + 3600,
      ...payload
    })
  ).toString("base64url");
  const unsignedToken = `${header}.${body}`;
  const signature = createHmac("sha256", secret).update(unsignedToken).digest("base64url");
  return `${unsignedToken}.${signature}`;
}

function executeRequest(baseUrl, route, context) {
  return new Promise((resolve) => {
    const requestDetails = route.buildRequest(context) ?? {};
    const url = new URL(route.path, baseUrl);
    const startedAt = process.hrtime.bigint();
    let ttfbAt = null;
    const headers = {
      ...(requestDetails.headers ?? {})
    };

    if (route.requiresAuth && !headers.authorization) {
      headers.authorization = `Bearer ${context.benchmarkToken}`;
    }

    if (requestDetails.body && !headers["content-length"]) {
      headers["content-length"] = Buffer.byteLength(requestDetails.body);
    }

    const req = getRequestClient(url).request(
      url,
      {
        method: route.method,
        headers
      },
      (res) => {
        ttfbAt = process.hrtime.bigint();
        const chunks = [];

        res.on("data", (chunk) => {
          chunks.push(chunk);
        });

        res.on("end", () => {
          const endedAt = process.hrtime.bigint();
          const statusCode = res.statusCode ?? 0;
          const totalMs = Number(endedAt - startedAt) / 1e6;
          const ttfbMs = Number((ttfbAt ?? endedAt) - startedAt) / 1e6;
          const error = statusCode >= 400;

          resolve({
            statusCode,
            totalMs,
            ttfbMs,
            error,
            body: Buffer.concat(chunks).toString("utf8")
          });
        });
      }
    );

    req.on("error", (error) => {
      const failedAt = process.hrtime.bigint();
      resolve({
        statusCode: 0,
        totalMs: Number(failedAt - startedAt) / 1e6,
        ttfbMs: Number(failedAt - startedAt) / 1e6,
        error: true,
        body: error.message
      });
    });

    if (requestDetails.body) {
      req.write(requestDetails.body);
    }

    req.end();
  });
}

async function runRoute(baseUrl, route, config, context) {
  for (let index = 0; index < config.warmupCount; index += 1) {
    await executeRequest(baseUrl, route, context);
  }

  const samples = [];
  const pendingIndexes = Array.from({ length: config.sampleCount }, (_, index) => index);
  const startedAt = process.hrtime.bigint();
  const workers = Array.from({ length: Math.max(1, config.concurrency) }, async () => {
    while (pendingIndexes.length > 0) {
      const index = pendingIndexes.shift();
      if (index === undefined) {
        break;
      }

      samples[index] = await executeRequest(baseUrl, route, context);
    }
  });
  await Promise.all(workers);
  const endedAt = process.hrtime.bigint();
  const elapsedMs = Number(endedAt - startedAt) / 1e6;

  return {
    samples,
    metrics: summarizeSamples(samples, elapsedMs),
    elapsedMs
  };
}

function assertThresholds(report, thresholds) {
  const failures = [];
  const overall = thresholds.overall ?? {};

  if (overall.maxErrorRate !== undefined && report.overall.errorRate > overall.maxErrorRate) {
    failures.push(
      `overall error rate ${report.overall.errorRate.toFixed(4)} exceeded ${overall.maxErrorRate}`
    );
  }

  if (overall.minRps !== undefined && report.overall.rps < overall.minRps) {
    failures.push(`overall RPS ${report.overall.rps.toFixed(2)} dropped below ${overall.minRps}`);
  }

  if (overall.maxTtfbP95Ms !== undefined && report.overall.ttfb.p95 > overall.maxTtfbP95Ms) {
    failures.push(
      `overall TTFB p95 ${report.overall.ttfb.p95.toFixed(1)}ms exceeded ${overall.maxTtfbP95Ms}ms`
    );
  }

  const routeThresholds = thresholds.routes ?? {};
  for (const route of report.routes) {
    const threshold = routeThresholds[route.label];
    if (!threshold) {
      continue;
    }

    if (threshold.maxErrorRate !== undefined && route.metrics.errorRate > threshold.maxErrorRate) {
      failures.push(
        `${route.label} error rate ${route.metrics.errorRate.toFixed(4)} exceeded ${threshold.maxErrorRate}`
      );
    }

    if (threshold.minRps !== undefined && route.metrics.rps < threshold.minRps) {
      failures.push(
        `${route.label} RPS ${route.metrics.rps.toFixed(2)} dropped below ${threshold.minRps}`
      );
    }

    if (threshold.maxTtfbP95Ms !== undefined && route.metrics.ttfb.p95 > threshold.maxTtfbP95Ms) {
      failures.push(
        `${route.label} TTFB p95 ${route.metrics.ttfb.p95.toFixed(1)}ms exceeded ${threshold.maxTtfbP95Ms}ms`
      );
    }
  }

  if (failures.length > 0) {
    throw new Error(`Benchmark thresholds failed:\n- ${failures.join("\n- ")}`);
  }
}

async function main() {
  const config = parseConfig();
  let server = null;
  let baseUrl = targetUrl;

  if (!baseUrl) {
    const app = createApp();
    server = app.listen(0);

    await new Promise((resolve, reject) => {
      server.once("listening", resolve);
      server.once("error", reject);
    });

    const address = server.address();
    baseUrl = `http://127.0.0.1:${address.port}`;
  }

  const context = buildContext();
  const benchmarkThresholds = JSON.parse(
    await readFile(path.join(projectRoot, "benchmarks", "thresholds.json"), "utf8")
  )[profile] ?? {};

  try {
    const startedAt = new Date();
    const routeResults = [];

    for (const route of benchmarkRoutes) {
      const result = await runRoute(baseUrl, route, config, context);
      routeResults.push({
        label: route.label,
        method: route.method,
        path: route.path,
        requiresAuth: route.requiresAuth,
        ...result
      });
    }

    const overallElapsedMs = routeResults.reduce((sum, route) => sum + route.elapsedMs, 0);
    const overall = summarizeSamples(
      routeResults.flatMap((route) => route.samples),
      overallElapsedMs
    );
    const report = {
      profile,
      generatedAt: startedAt.toISOString(),
      baseUrl,
      sampleCount: config.sampleCount,
      warmupCount: config.warmupCount,
      concurrency: config.concurrency,
      thresholds: benchmarkThresholds,
      overall,
      routes: routeResults
    };

    assertThresholds(report, benchmarkThresholds);

    const timestamp = startedAt.toISOString().replace(/[:.]/g, "-");
    const json = buildJson(report);
    const markdown = buildReport(report);
    await writeResultsFiles({
      resultsDir,
      baseName: `benchmark-${profile}-${timestamp}`,
      markdown,
      json
    });

    console.log(markdown);
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(() => resolve()));
    }
  }
}

await main();
