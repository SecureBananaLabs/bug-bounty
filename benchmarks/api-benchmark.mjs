#!/usr/bin/env node
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { performance } from "node:perf_hooks";
import { createApp } from "../apps/api/src/app.js";
import { signAccessToken } from "../apps/api/src/utils/jwt.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

const endpointCatalog = [
  {
    id: "health",
    method: "GET",
    path: "/health",
    description: "Service health check",
    expectedStatuses: [200]
  },
  {
    id: "auth_register",
    method: "POST",
    path: "/api/auth/register",
    description: "Client account registration",
    expectedStatuses: [201],
    json: ({ runId, sequence }) => ({
      email: `benchmark.client.${runId}.${sequence}@example.com`,
      password: "BenchmarkPass123!",
      role: "client"
    })
  },
  {
    id: "auth_login",
    method: "POST",
    path: "/api/auth/login",
    description: "Client login",
    expectedStatuses: [200],
    json: ({ runId, sequence }) => ({
      email: `benchmark.login.${runId}.${sequence}@example.com`,
      password: "BenchmarkPass123!"
    })
  },
  {
    id: "auth_oauth_callback",
    method: "GET",
    path: "/api/auth/oauth/github/callback",
    description: "OAuth provider callback",
    expectedStatuses: [200]
  },
  {
    id: "auth_refresh",
    method: "POST",
    path: "/api/auth/refresh",
    description: "JWT refresh",
    expectedStatuses: [200],
    json: () => ({})
  },
  {
    id: "users_list",
    method: "GET",
    path: "/api/users",
    description: "List users",
    expectedStatuses: [200]
  },
  {
    id: "users_create",
    method: "POST",
    path: "/api/users",
    description: "Create user profile",
    expectedStatuses: [201],
    json: ({ runId, sequence }) => ({
      email: `freelancer.${runId}.${sequence}@example.com`,
      name: `Benchmark Freelancer ${sequence}`,
      role: "freelancer",
      skills: ["react", "node", "api-performance"],
      hourlyRate: 7500
    })
  },
  {
    id: "jobs_list",
    method: "GET",
    path: "/api/jobs",
    description: "List jobs",
    expectedStatuses: [200]
  },
  {
    id: "jobs_create",
    method: "POST",
    path: "/api/jobs",
    description: "Create client job",
    expectedStatuses: [201],
    json: ({ sequence }) => ({
      title: `Benchmark API reliability audit ${sequence}`,
      description: "Load-test the marketplace API and document performance regressions.",
      budgetMin: 500,
      budgetMax: 1500,
      categoryId: "cat_software",
      skills: ["express", "benchmarking", "observability"]
    })
  },
  {
    id: "proposals_list",
    method: "GET",
    path: "/api/proposals",
    description: "List proposals",
    expectedStatuses: [200]
  },
  {
    id: "proposals_create",
    method: "POST",
    path: "/api/proposals",
    description: "Create proposal",
    expectedStatuses: [201],
    json: ({ sequence }) => ({
      jobId: `job_benchmark_${sequence}`,
      freelancerId: "usr_benchmark_freelancer",
      coverLetter: "I can benchmark this API and provide threshold-backed reports.",
      bidAmount: 900,
      estimatedDays: 2
    })
  },
  {
    id: "payments_create",
    method: "POST",
    path: "/api/payments",
    description: "Create payment intent",
    expectedStatuses: [201],
    json: ({ sequence }) => ({
      proposalId: `prp_benchmark_${sequence}`,
      amount: 90000,
      currency: "usd"
    })
  },
  {
    id: "reviews_list",
    method: "GET",
    path: "/api/reviews",
    description: "List reviews",
    expectedStatuses: [200]
  },
  {
    id: "reviews_create",
    method: "POST",
    path: "/api/reviews",
    description: "Create review",
    expectedStatuses: [201],
    json: ({ sequence }) => ({
      contractId: `ctr_benchmark_${sequence}`,
      reviewerId: "usr_client",
      revieweeId: "usr_freelancer",
      rating: 5,
      comment: "Clear benchmark report and reproducible smoke test."
    })
  },
  {
    id: "messages_list",
    method: "GET",
    path: "/api/messages",
    description: "List messages",
    expectedStatuses: [200]
  },
  {
    id: "messages_create",
    method: "POST",
    path: "/api/messages",
    description: "Send message",
    expectedStatuses: [201],
    json: ({ sequence }) => ({
      threadId: `thr_benchmark_${sequence}`,
      senderId: "usr_client",
      recipientId: "usr_freelancer",
      body: "Can you share the latest p95 and p99 benchmark report?"
    })
  },
  {
    id: "notifications_list",
    method: "GET",
    path: "/api/notifications",
    description: "List notifications",
    expectedStatuses: [200]
  },
  {
    id: "notifications_create",
    method: "POST",
    path: "/api/notifications",
    description: "Create notification",
    expectedStatuses: [201],
    json: ({ sequence }) => ({
      userId: "usr_client",
      type: "benchmark_ready",
      title: "Benchmark report ready",
      body: `Benchmark run ${sequence} completed successfully.`
    })
  },
  {
    id: "uploads_create",
    method: "POST",
    path: "/api/uploads",
    description: "Upload benchmark attachment",
    expectedStatuses: [201],
    formData: ({ runId, sequence }) => {
      const form = new FormData();
      const contents = JSON.stringify({
        runId,
        sequence,
        kind: "benchmark-artifact",
        generatedAt: new Date().toISOString()
      });
      form.set("file", new Blob([contents], { type: "application/json" }), "benchmark-artifact.json");
      return form;
    }
  },
  {
    id: "search",
    method: "GET",
    path: "/api/search?q=api%20benchmark%20react",
    description: "Global search",
    expectedStatuses: [200]
  },
  {
    id: "admin_metrics",
    method: "GET",
    path: "/api/admin/metrics",
    description: "Protected admin metrics",
    expectedStatuses: [200],
    auth: true
  }
];

function parseArgs(argv) {
  const options = {
    concurrency: Number(process.env.BENCHMARK_CONCURRENCY ?? 2),
    iterations: Number(process.env.BENCHMARK_ITERATIONS ?? 5),
    outputDir: process.env.BENCHMARK_OUTPUT_DIR ?? "benchmarks/results",
    smoke: false,
    targetUrl: process.env.BENCHMARK_TARGET_URL ?? "",
    thresholdsPath: process.env.BENCHMARK_THRESHOLDS_PATH ?? "benchmarks/thresholds.json",
    warmupIterations: Number(process.env.BENCHMARK_WARMUP_ITERATIONS ?? 1),
    writeResults: true
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--smoke") {
      options.smoke = true;
      options.concurrency = Number(process.env.BENCHMARK_CONCURRENCY ?? 1);
      options.iterations = Number(process.env.BENCHMARK_ITERATIONS ?? 1);
      options.warmupIterations = Number(process.env.BENCHMARK_WARMUP_ITERATIONS ?? 0);
    } else if (arg === "--no-write-results") {
      options.writeResults = false;
    } else if (arg === "--target") {
      options.targetUrl = argv[++i] ?? "";
    } else if (arg === "--iterations") {
      options.iterations = Number(argv[++i]);
    } else if (arg === "--concurrency") {
      options.concurrency = Number(argv[++i]);
    } else if (arg === "--output-dir") {
      options.outputDir = argv[++i] ?? options.outputDir;
    } else if (arg === "--thresholds") {
      options.thresholdsPath = argv[++i] ?? options.thresholdsPath;
    } else {
      throw new Error(`Unknown benchmark option: ${arg}`);
    }
  }

  if (!Number.isInteger(options.iterations) || options.iterations < 1) {
    throw new Error("Benchmark iterations must be a positive integer.");
  }
  if (!Number.isInteger(options.concurrency) || options.concurrency < 1) {
    throw new Error("Benchmark concurrency must be a positive integer.");
  }
  if (!Number.isInteger(options.warmupIterations) || options.warmupIterations < 0) {
    throw new Error("Benchmark warmup iterations must be zero or a positive integer.");
  }

  return options;
}

async function startLocalServer() {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const address = server.address();
  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: () => new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    })
  };
}

async function loadThresholds(thresholdsPath) {
  const resolvedPath = path.resolve(repoRoot, thresholdsPath);
  const raw = await fs.readFile(resolvedPath, "utf8");
  return JSON.parse(raw);
}

function buildRequest(endpoint, context) {
  const headers = {
    accept: "application/json",
    "user-agent": "freelanceflow-api-benchmark/1.0"
  };

  if (endpoint.auth) {
    headers.authorization = `Bearer ${context.authToken}`;
  }

  if (endpoint.formData) {
    return {
      body: endpoint.formData(context),
      headers,
      method: endpoint.method
    };
  }

  if (endpoint.json) {
    headers["content-type"] = "application/json";
    return {
      body: JSON.stringify(endpoint.json(context)),
      headers,
      method: endpoint.method
    };
  }

  return {
    headers,
    method: endpoint.method
  };
}

async function runSingleRequest(endpoint, baseUrl, context) {
  const url = new URL(endpoint.path, baseUrl);
  const request = buildRequest(endpoint, context);
  const startedAt = performance.now();

  try {
    const response = await fetch(url, request);
    const firstByteAt = performance.now();
    const body = await response.text();
    const completedAt = performance.now();
    const expected = endpoint.expectedStatuses.includes(response.status);

    return {
      bodyBytes: Buffer.byteLength(body),
      completedAt,
      error: expected ? null : `Expected ${endpoint.expectedStatuses.join("/")} but received ${response.status}`,
      latencyMs: completedAt - startedAt,
      ok: expected,
      startedAt,
      status: response.status,
      ttfbMs: firstByteAt - startedAt
    };
  } catch (error) {
    const completedAt = performance.now();
    return {
      bodyBytes: 0,
      completedAt,
      error: error instanceof Error ? error.message : String(error),
      latencyMs: completedAt - startedAt,
      ok: false,
      startedAt,
      status: 0,
      ttfbMs: completedAt - startedAt
    };
  }
}

async function runWarmup(endpoint, baseUrl, context, iterations) {
  for (let i = 0; i < iterations; i += 1) {
    await runSingleRequest(endpoint, baseUrl, {
      ...context,
      sequence: `warmup-${i}`
    });
  }
}

async function runEndpoint(endpoint, baseUrl, options, context) {
  await runWarmup(endpoint, baseUrl, context, options.warmupIterations);

  const results = [];
  let nextIndex = 0;

  async function worker(workerId) {
    while (nextIndex < options.iterations) {
      const sequence = nextIndex;
      nextIndex += 1;
      const result = await runSingleRequest(endpoint, baseUrl, {
        ...context,
        sequence: `${workerId}-${sequence}`
      });
      results.push(result);
    }
  }

  const workerCount = Math.min(options.concurrency, options.iterations);
  await Promise.all(Array.from({ length: workerCount }, (_, index) => worker(index)));

  return summarizeEndpoint(endpoint, results);
}

function percentile(values, percentileValue) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil(percentileValue * sorted.length) - 1);
  return sorted[index];
}

function round(value, places = 2) {
  return Number(value.toFixed(places));
}

function summarizeEndpoint(endpoint, results) {
  const latencies = results.map((result) => result.latencyMs);
  const ttfbs = results.map((result) => result.ttfbMs);
  const failures = results.filter((result) => !result.ok);
  const firstStart = Math.min(...results.map((result) => result.startedAt));
  const lastComplete = Math.max(...results.map((result) => result.completedAt));
  const elapsedSeconds = Math.max((lastComplete - firstStart) / 1000, 0.001);
  const bucketCounts = new Map();

  for (const result of results) {
    const bucket = Math.floor((result.completedAt - firstStart) / 1000);
    bucketCounts.set(bucket, (bucketCounts.get(bucket) ?? 0) + 1);
  }

  return {
    id: endpoint.id,
    method: endpoint.method,
    path: endpoint.path,
    description: endpoint.description,
    requestCount: results.length,
    statuses: countBy(results, "status"),
    errorRate: round(failures.length / Math.max(results.length, 1), 4),
    errors: failures.slice(0, 3).map((failure) => failure.error),
    latencyMs: {
      p50: round(percentile(latencies, 0.5)),
      p95: round(percentile(latencies, 0.95)),
      p99: round(percentile(latencies, 0.99)),
      max: round(Math.max(...latencies))
    },
    ttfbMs: {
      p50: round(percentile(ttfbs, 0.5)),
      p95: round(percentile(ttfbs, 0.95)),
      p99: round(percentile(ttfbs, 0.99)),
      max: round(Math.max(...ttfbs))
    },
    rps: {
      sustained: round(results.length / elapsedSeconds),
      peakOneSecondBucket: Math.max(...bucketCounts.values())
    }
  };
}

function countBy(items, key) {
  return items.reduce((counts, item) => {
    const value = String(item[key]);
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

function evaluateThresholds(endpointSummaries, thresholds) {
  const defaultThreshold = thresholds.default ?? {
    p99MaxMs: 3000,
    errorRateMax: 0
  };
  const failures = [];

  for (const summary of endpointSummaries) {
    const threshold = thresholds[summary.id] ?? defaultThreshold;
    if (summary.latencyMs.p99 > threshold.p99MaxMs) {
      failures.push(`${summary.id} p99 ${summary.latencyMs.p99}ms exceeds ${threshold.p99MaxMs}ms`);
    }
    if (summary.errorRate > threshold.errorRateMax) {
      failures.push(`${summary.id} error rate ${summary.errorRate} exceeds ${threshold.errorRateMax}`);
    }
  }

  return failures;
}

function createRunSummary({ baseUrl, endpointSummaries, failures, options, startedAtIso }) {
  const totalRequests = endpointSummaries.reduce((sum, endpoint) => sum + endpoint.requestCount, 0);
  const endpointErrors = endpointSummaries.reduce(
    (sum, endpoint) => sum + Math.round(endpoint.errorRate * endpoint.requestCount),
    0
  );

  return {
    generatedAt: startedAtIso,
    mode: options.smoke ? "smoke" : "full",
    target: baseUrl,
    configuration: {
      concurrency: options.concurrency,
      iterationsPerEndpoint: options.iterations,
      warmupIterationsPerEndpoint: options.warmupIterations,
      endpointCount: endpointCatalog.length
    },
    environment: {
      node: process.version,
      platform: process.platform,
      arch: process.arch,
      cpuModel: os.cpus()[0]?.model ?? "unknown",
      cpuCount: os.cpus().length,
      totalMemoryMb: Math.round(os.totalmem() / 1024 / 1024)
    },
    totals: {
      totalRequests,
      failedRequests: endpointErrors,
      errorRate: round(endpointErrors / Math.max(totalRequests, 1), 4)
    },
    endpoints: endpointSummaries,
    thresholdFailures: failures
  };
}

function createMarkdownReport(summary) {
  const rows = summary.endpoints.map((endpoint) => [
    endpoint.id,
    endpoint.method,
    endpoint.path.replaceAll("|", "\\|"),
    endpoint.requestCount,
    endpoint.latencyMs.p50,
    endpoint.latencyMs.p95,
    endpoint.latencyMs.p99,
    endpoint.ttfbMs.p95,
    endpoint.rps.sustained,
    endpoint.rps.peakOneSecondBucket,
    `${round(endpoint.errorRate * 100, 2)}%`,
    Object.entries(endpoint.statuses)
      .map(([status, count]) => `${status}:${count}`)
      .join(", ")
  ]);

  return [
    `# API Benchmark Report`,
    "",
    `Generated: ${summary.generatedAt}`,
    `Mode: ${summary.mode}`,
    `Target: ${summary.target}`,
    "",
    `Requests: ${summary.totals.totalRequests}`,
    `Failed requests: ${summary.totals.failedRequests}`,
    `Error rate: ${round(summary.totals.errorRate * 100, 2)}%`,
    "",
    "## Environment",
    "",
    `- Node.js: ${summary.environment.node}`,
    `- Platform: ${summary.environment.platform} ${summary.environment.arch}`,
    `- CPU: ${summary.environment.cpuModel}`,
    `- CPU count: ${summary.environment.cpuCount}`,
    `- Total memory: ${summary.environment.totalMemoryMb} MB`,
    "",
    "## Endpoint Metrics",
    "",
    "| Endpoint | Method | Path | Requests | p50 ms | p95 ms | p99 ms | p95 TTFB ms | Sustained RPS | Peak RPS | Error rate | Statuses |",
    "| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |",
    ...rows.map((row) => `| ${row.join(" | ")} |`),
    "",
    "## Thresholds",
    "",
    summary.thresholdFailures.length === 0
      ? "All configured benchmark thresholds passed."
      : summary.thresholdFailures.map((failure) => `- ${failure}`).join("\n"),
    ""
  ].join("\n");
}

async function writeReports(summary, outputDir) {
  const resolvedOutputDir = path.resolve(repoRoot, outputDir);
  await fs.mkdir(resolvedOutputDir, { recursive: true });
  const stamp = summary.generatedAt.replaceAll(":", "").replaceAll(".", "").replaceAll("-", "");
  const jsonPath = path.join(resolvedOutputDir, `${stamp}-${summary.mode}.json`);
  const markdownPath = path.join(resolvedOutputDir, `${stamp}-${summary.mode}.md`);

  await fs.writeFile(jsonPath, `${JSON.stringify(summary, null, 2)}\n`);
  await fs.writeFile(markdownPath, createMarkdownReport(summary));

  return { jsonPath, markdownPath };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const thresholds = await loadThresholds(options.thresholdsPath);
  const startedAtIso = new Date().toISOString();
  const runId = startedAtIso.replace(/\D/g, "");
  const localServer = options.targetUrl ? null : await startLocalServer();
  const baseUrl = (options.targetUrl || localServer.baseUrl).replace(/\/$/, "");
  const authToken = process.env.BENCHMARK_AUTH_TOKEN || signAccessToken({
    sub: "usr_benchmark_admin",
    role: "admin"
  });

  try {
    console.log(`Benchmarking ${endpointCatalog.length} endpoints against ${baseUrl}`);
    console.log(`Mode=${options.smoke ? "smoke" : "full"} iterations=${options.iterations} concurrency=${options.concurrency}`);

    const endpointSummaries = [];
    for (const endpoint of endpointCatalog) {
      const summary = await runEndpoint(endpoint, baseUrl, options, { authToken, runId });
      endpointSummaries.push(summary);
      console.log(
        `${endpoint.id.padEnd(22)} p95=${summary.latencyMs.p95}ms p99=${summary.latencyMs.p99}ms ` +
          `rps=${summary.rps.sustained} errors=${round(summary.errorRate * 100, 2)}%`
      );
    }

    const failures = evaluateThresholds(endpointSummaries, thresholds);
    const summary = createRunSummary({ baseUrl, endpointSummaries, failures, options, startedAtIso });

    if (options.writeResults) {
      const { jsonPath, markdownPath } = await writeReports(summary, options.outputDir);
      console.log(`Wrote benchmark JSON: ${path.relative(repoRoot, jsonPath)}`);
      console.log(`Wrote benchmark markdown: ${path.relative(repoRoot, markdownPath)}`);
    }

    if (failures.length > 0) {
      console.error("Benchmark threshold failures:");
      for (const failure of failures) {
        console.error(`- ${failure}`);
      }
      process.exitCode = 1;
    } else {
      console.log("All benchmark thresholds passed.");
    }
  } finally {
    if (localServer) {
      await localServer.close();
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
