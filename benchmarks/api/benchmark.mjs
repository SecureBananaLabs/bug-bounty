#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { performance } from "node:perf_hooks";
import { createApp } from "../../apps/api/src/app.js";

const DEFAULT_OPTIONS = {
  baseUrl: process.env.API_BENCHMARK_BASE_URL ?? "",
  concurrency: Number(process.env.API_BENCHMARK_CONCURRENCY ?? 2),
  requestsPerEndpoint: Number(process.env.API_BENCHMARK_REQUESTS_PER_ENDPOINT ?? 6),
  output: process.env.API_BENCHMARK_JSON ?? "benchmarks/results/api-latest.json",
  markdown: process.env.API_BENCHMARK_MARKDOWN ?? "benchmarks/results/api-latest.md",
  timeoutMs: Number(process.env.API_BENCHMARK_TIMEOUT_MS ?? 10_000)
};

function parseArgs(argv) {
  const options = { ...DEFAULT_OPTIONS };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const value = argv[i + 1];

    if (arg === "--base-url") {
      options.baseUrl = value;
      i += 1;
    } else if (arg === "--concurrency") {
      options.concurrency = Number(value);
      i += 1;
    } else if (arg === "--requests-per-endpoint") {
      options.requestsPerEndpoint = Number(value);
      i += 1;
    } else if (arg === "--output") {
      options.output = value;
      i += 1;
    } else if (arg === "--markdown") {
      options.markdown = value;
      i += 1;
    } else if (arg === "--timeout-ms") {
      options.timeoutMs = Number(value);
      i += 1;
    } else if (arg === "--help") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!Number.isInteger(options.concurrency) || options.concurrency < 1) {
    throw new Error("--concurrency must be a positive integer");
  }

  if (!Number.isInteger(options.requestsPerEndpoint) || options.requestsPerEndpoint < 1) {
    throw new Error("--requests-per-endpoint must be a positive integer");
  }

  return options;
}

function printHelp() {
  console.log(`API benchmark runner

Usage:
  node benchmarks/api/benchmark.mjs [options]

Options:
  --base-url <url>                 Benchmark an already running API server.
                                   If omitted, the runner starts the Express app on a random local port.
  --concurrency <n>                Concurrent requests per endpoint. Default: 2
  --requests-per-endpoint <n>      Requests to send to each endpoint. Default: 6
  --output <path>                  JSON report path. Default: benchmarks/results/api-latest.json
  --markdown <path>                Markdown report path. Default: benchmarks/results/api-latest.md
  --timeout-ms <n>                 Per-request timeout. Default: 10000
`);
}

const ENDPOINTS = [
  {
    name: "auth.register",
    method: "POST",
    path: "/api/auth/register",
    json: ({ sequence }) => ({
      email: `bench-register-${Date.now()}-${sequence}@example.test`,
      password: "benchmark-pass",
      role: "client"
    })
  },
  {
    name: "auth.login",
    method: "POST",
    path: "/api/auth/login",
    json: ({ sequence }) => ({
      email: `bench-login-${sequence}@example.test`,
      password: "benchmark-pass"
    })
  },
  {
    name: "auth.oauthCallback",
    method: "GET",
    path: "/api/auth/oauth/github/callback"
  },
  {
    name: "auth.refresh",
    method: "POST",
    path: "/api/auth/refresh"
  },
  {
    name: "users.list",
    method: "GET",
    path: "/api/users"
  },
  {
    name: "users.create",
    method: "POST",
    path: "/api/users",
    json: ({ sequence }) => ({
      email: `bench-user-${Date.now()}-${sequence}@example.test`,
      name: "Benchmark User",
      role: "client"
    })
  },
  {
    name: "jobs.list",
    method: "GET",
    path: "/api/jobs"
  },
  {
    name: "jobs.create",
    method: "POST",
    path: "/api/jobs",
    json: ({ sequence }) => ({
      title: `Benchmark job ${sequence}`,
      description: "Benchmark job used to exercise the job creation endpoint.",
      budgetMin: 100,
      budgetMax: 500,
      categoryId: "benchmark",
      skills: ["benchmark", "api"]
    })
  },
  {
    name: "proposals.list",
    method: "GET",
    path: "/api/proposals"
  },
  {
    name: "proposals.create",
    method: "POST",
    path: "/api/proposals",
    json: ({ sequence }) => ({
      jobId: `job_benchmark_${sequence}`,
      freelancerId: `usr_benchmark_${sequence}`,
      coverLetter: "Benchmark proposal payload.",
      bidAmount: 250
    })
  },
  {
    name: "payments.create",
    method: "POST",
    path: "/api/payments",
    json: ({ sequence }) => ({
      amount: 125 + sequence,
      currency: "usd",
      jobId: `job_benchmark_${sequence}`
    })
  },
  {
    name: "reviews.list",
    method: "GET",
    path: "/api/reviews"
  },
  {
    name: "reviews.create",
    method: "POST",
    path: "/api/reviews",
    json: ({ sequence }) => ({
      reviewerId: `usr_reviewer_${sequence}`,
      revieweeId: `usr_reviewee_${sequence}`,
      rating: 5,
      comment: "Benchmark review payload."
    })
  },
  {
    name: "messages.list",
    method: "GET",
    path: "/api/messages"
  },
  {
    name: "messages.create",
    method: "POST",
    path: "/api/messages",
    json: ({ sequence }) => ({
      senderId: `usr_sender_${sequence}`,
      recipientId: `usr_recipient_${sequence}`,
      body: "Benchmark message payload."
    })
  },
  {
    name: "notifications.list",
    method: "GET",
    path: "/api/notifications"
  },
  {
    name: "notifications.create",
    method: "POST",
    path: "/api/notifications",
    json: ({ sequence }) => ({
      userId: `usr_notify_${sequence}`,
      type: "benchmark",
      message: "Benchmark notification payload."
    })
  },
  {
    name: "uploads.create",
    method: "POST",
    path: "/api/uploads",
    form: ({ sequence }) => {
      const form = new FormData();
      form.append(
        "file",
        new Blob([`benchmark upload ${sequence}\n`], { type: "text/plain" }),
        `benchmark-${sequence}.txt`
      );
      return form;
    }
  },
  {
    name: "search.global",
    method: "GET",
    path: "/api/search?q=benchmark"
  },
  {
    name: "admin.metrics",
    method: "GET",
    path: "/api/admin/metrics",
    headers: ({ adminToken }) => ({
      authorization: `Bearer ${adminToken}`
    })
  }
];

async function startSelfHostedServer() {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolveListening, rejectListening) => {
    server.once("listening", resolveListening);
    server.once("error", rejectListening);
  });

  const { port } = server.address();
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () =>
      new Promise((resolveClose, rejectClose) => {
        server.close((error) => (error ? rejectClose(error) : resolveClose()));
      })
  };
}

async function buildContext(baseUrl, timeoutMs) {
  const registration = await executeRequest(
    baseUrl,
    {
      name: "setup.adminToken",
      method: "POST",
      path: "/api/auth/register",
      json: () => ({
        email: `bench-admin-${Date.now()}@example.test`,
        password: "benchmark-pass",
        role: "admin"
      })
    },
    { sequence: 0, timeoutMs }
  );

  const adminToken = registration.payload?.data?.token;
  if (!adminToken) {
    throw new Error("Could not create benchmark admin token");
  }

  return { adminToken, timeoutMs };
}

async function executeRequest(baseUrl, endpoint, context) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), context.timeoutMs);
  const headers = {
    ...(endpoint.headers?.(context) ?? {})
  };

  let body;
  if (endpoint.json) {
    headers["content-type"] = "application/json";
    body = JSON.stringify(endpoint.json(context));
  } else if (endpoint.form) {
    body = endpoint.form(context);
  }

  const startedAt = performance.now();
  try {
    const response = await fetch(`${baseUrl}${endpoint.path}`, {
      method: endpoint.method,
      headers,
      body,
      signal: controller.signal
    });
    const firstByteAt = performance.now();
    const text = await response.text();
    const endedAt = performance.now();

    let payload = null;
    try {
      payload = text ? JSON.parse(text) : null;
    } catch {
      payload = null;
    }

    return {
      endpoint: endpoint.name,
      method: endpoint.method,
      path: endpoint.path,
      status: response.status,
      ok: response.status < 400,
      ttfbMs: firstByteAt - startedAt,
      durationMs: endedAt - startedAt,
      bytes: Buffer.byteLength(text),
      startedAt,
      endedAt,
      payload
    };
  } catch (error) {
    const endedAt = performance.now();
    return {
      endpoint: endpoint.name,
      method: endpoint.method,
      path: endpoint.path,
      status: 0,
      ok: false,
      error: error.name === "AbortError" ? "timeout" : error.message,
      ttfbMs: endedAt - startedAt,
      durationMs: endedAt - startedAt,
      bytes: 0,
      startedAt,
      endedAt
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function runEndpoint(baseUrl, endpoint, context, options) {
  const samples = [];
  let nextSequence = 0;
  const startedAt = performance.now();

  async function worker() {
    while (nextSequence < options.requestsPerEndpoint) {
      const sequence = nextSequence;
      nextSequence += 1;
      samples.push(await executeRequest(baseUrl, endpoint, { ...context, sequence }));
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(options.concurrency, options.requestsPerEndpoint) }, () => worker())
  );

  const endedAt = performance.now();
  return summarizeEndpoint(endpoint, samples, endedAt - startedAt);
}

function summarizeEndpoint(endpoint, samples, wallTimeMs) {
  const durations = samples.map((sample) => sample.durationMs);
  const ttfb = samples.map((sample) => sample.ttfbMs);
  const failures = samples.filter((sample) => !sample.ok);

  return {
    name: endpoint.name,
    method: endpoint.method,
    path: endpoint.path,
    requests: samples.length,
    failures: failures.length,
    errorRate: failures.length / samples.length,
    rps: samples.length / (wallTimeMs / 1000),
    sustainedRps: samples.length / (wallTimeMs / 1000),
    peakRps: calculatePeakRps(samples, wallTimeMs),
    latencyMs: {
      p50: percentile(durations, 50),
      p95: percentile(durations, 95),
      p99: percentile(durations, 99),
      max: Math.max(...durations)
    },
    ttfbMs: {
      p50: percentile(ttfb, 50),
      p95: percentile(ttfb, 95),
      p99: percentile(ttfb, 99),
      max: Math.max(...ttfb)
    },
    statuses: countBy(samples.map((sample) => sample.status)),
    sampleErrors: failures.slice(0, 3).map((sample) => ({
      status: sample.status,
      error: sample.error ?? sample.payload?.message ?? "request failed"
    }))
  };
}

function calculatePeakRps(samples, wallTimeMs) {
  if (wallTimeMs < 1000) {
    return samples.length / (wallTimeMs / 1000);
  }

  const buckets = new Map();
  const firstStart = Math.min(...samples.map((sample) => sample.startedAt));

  for (const sample of samples) {
    const bucket = Math.floor((sample.endedAt - firstStart) / 1000);
    buckets.set(bucket, (buckets.get(bucket) ?? 0) + 1);
  }

  return Math.max(...buckets.values());
}

function percentile(values, p) {
  if (!values.length) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return round(sorted[index]);
}

function countBy(values) {
  return values.reduce((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

function round(value) {
  return Math.round(value * 100) / 100;
}

function buildSummary(results) {
  const totalRequests = results.reduce((sum, result) => sum + result.requests, 0);
  const totalFailures = results.reduce((sum, result) => sum + result.failures, 0);
  const slowestP95 = [...results].sort((a, b) => b.latencyMs.p95 - a.latencyMs.p95)[0];
  const highestErrorRate = [...results].sort((a, b) => b.errorRate - a.errorRate)[0];

  return {
    totalEndpoints: results.length,
    totalRequests,
    totalFailures,
    errorRate: totalFailures / totalRequests,
    slowestP95Endpoint: slowestP95?.name ?? null,
    slowestP95Ms: slowestP95?.latencyMs.p95 ?? 0,
    highestErrorRateEndpoint: highestErrorRate?.name ?? null,
    highestErrorRate: highestErrorRate?.errorRate ?? 0
  };
}

function renderMarkdown(report) {
  const rows = report.endpoints
    .map(
      (result) =>
        `| ${result.name} | ${result.method} | \`${result.path}\` | ${result.requests} | ${formatPercent(
          result.errorRate
        )} | ${round(result.sustainedRps)} | ${round(result.peakRps)} | ${result.latencyMs.p50} | ${result.latencyMs.p95} | ${
          result.latencyMs.p99
        } | ${result.ttfbMs.p95} |`
    )
    .join("\n");

  return `# API Benchmark Report

Generated: ${report.metadata.generatedAt}

Base URL: \`${report.metadata.baseUrl}\`

Requests per endpoint: ${report.metadata.requestsPerEndpoint}
Concurrency per endpoint: ${report.metadata.concurrency}

## Summary

- Endpoints: ${report.summary.totalEndpoints}
- Total requests: ${report.summary.totalRequests}
- Total failures: ${report.summary.totalFailures}
- Error rate: ${formatPercent(report.summary.errorRate)}
- Slowest p95 endpoint: ${report.summary.slowestP95Endpoint} (${report.summary.slowestP95Ms} ms)

## Endpoint Results

| Endpoint | Method | Path | Requests | Error rate | Sustained RPS | Peak RPS | p50 ms | p95 ms | p99 ms | p95 TTFB ms |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
${rows}
`;
}

function formatPercent(value) {
  return `${round(value * 100)}%`;
}

async function writeReport(path, data) {
  const absolutePath = resolve(path);
  await mkdir(dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, data);
  return absolutePath;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const hosted = options.baseUrl ? null : await startSelfHostedServer();
  const baseUrl = options.baseUrl || hosted.baseUrl;

  try {
    const context = await buildContext(baseUrl, options.timeoutMs);
    const endpoints = [];

    for (const endpoint of ENDPOINTS) {
      endpoints.push(await runEndpoint(baseUrl, endpoint, context, options));
    }

    const report = {
      metadata: {
        generatedAt: new Date().toISOString(),
        baseUrl,
        selfHosted: !options.baseUrl,
        concurrency: options.concurrency,
        requestsPerEndpoint: options.requestsPerEndpoint,
        endpointCount: ENDPOINTS.length
      },
      summary: buildSummary(endpoints),
      endpoints
    };

    const jsonPath = await writeReport(options.output, `${JSON.stringify(report, null, 2)}\n`);
    const markdownPath = await writeReport(options.markdown, renderMarkdown(report));

    console.log(`Wrote JSON report: ${jsonPath}`);
    console.log(`Wrote Markdown report: ${markdownPath}`);
    console.log(
      `Benchmarked ${report.summary.totalEndpoints} endpoints with ${report.summary.totalRequests} requests`
    );

    if (report.summary.totalFailures > 0) {
      process.exitCode = 1;
    }
  } finally {
    await hosted?.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
