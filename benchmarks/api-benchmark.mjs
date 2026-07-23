import { mkdir, readFile, writeFile } from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import { performance } from "node:perf_hooks";
import { setTimeout as sleep } from "node:timers/promises";

const RESULTS_DIR = "benchmarks/results";
const THRESHOLDS_PATH = new URL("./thresholds.json", import.meta.url);

function parseArgs(argv) {
  const args = {
    concurrency: 4,
    durationMs: 5000,
    enforceThresholds: false,
    iterations: null,
    outputDir: process.env.BENCHMARK_OUTPUT_DIR ?? RESULTS_DIR,
    smoke: false,
    targetUrl: process.env.BENCHMARK_TARGET_URL ?? null
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--smoke") {
      args.smoke = true;
      args.concurrency = 1;
      args.durationMs = 0;
      args.iterations = 2;
    } else if (arg === "--enforce-thresholds") {
      args.enforceThresholds = true;
    } else if (arg === "--target") {
      args.targetUrl = argv[index + 1];
      index += 1;
    } else if (arg === "--concurrency") {
      args.concurrency = Number(argv[index + 1]);
      index += 1;
    } else if (arg === "--duration") {
      args.durationMs = Number(argv[index + 1]) * 1000;
      index += 1;
    } else if (arg === "--iterations") {
      args.iterations = Number(argv[index + 1]);
      args.durationMs = 0;
      index += 1;
    } else if (arg === "--output-dir") {
      args.outputDir = argv[index + 1];
      index += 1;
    }
  }

  return args;
}

const runId = new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-");

function benchmarkEmail(label, workerId, iteration) {
  return `benchmark+${runId}-${label}-${workerId}-${iteration}@example.com`;
}

function jsonHeaders(extraHeaders = {}) {
  return {
    "content-type": "application/json",
    ...extraHeaders
  };
}

function buildScenarios(context) {
  const adminHeaders = context.adminToken
    ? { authorization: `Bearer ${context.adminToken}` }
    : {};

  return [
    {
      id: "health",
      method: "GET",
      path: "/health"
    },
    {
      id: "api-auth-register",
      method: "POST",
      path: "/api/auth/register",
      body: ({ workerId, iteration }) => ({
        email: benchmarkEmail("register", workerId, iteration),
        password: "benchmark-password",
        role: "client"
      })
    },
    {
      id: "api-auth-login",
      method: "POST",
      path: "/api/auth/login",
      body: () => ({
        email: "benchmark-login@example.com",
        password: "benchmark-password"
      })
    },
    {
      id: "api-auth-refresh",
      method: "POST",
      path: "/api/auth/refresh"
    },
    {
      id: "api-auth-oauth-callback",
      method: "GET",
      path: "/api/auth/oauth/github/callback"
    },
    {
      id: "api-users-list",
      method: "GET",
      path: "/api/users"
    },
    {
      id: "api-users-create",
      method: "POST",
      path: "/api/users",
      body: ({ workerId, iteration }) => ({
        email: benchmarkEmail("user", workerId, iteration),
        role: "freelancer",
        displayName: "Benchmark Freelancer",
        skills: ["node", "api", "marketplace"]
      })
    },
    {
      id: "api-jobs-list",
      method: "GET",
      path: "/api/jobs"
    },
    {
      id: "api-jobs-create",
      method: "POST",
      path: "/api/jobs",
      body: ({ workerId, iteration }) => ({
        title: `Benchmark marketplace API review ${workerId}-${iteration}`,
        description: "Synthetic benchmark job payload with realistic marketplace fields.",
        budgetMin: 500,
        budgetMax: 1500,
        categoryId: "development",
        skills: ["express", "performance", "api"]
      })
    },
    {
      id: "api-proposals-list",
      method: "GET",
      path: "/api/proposals"
    },
    {
      id: "api-proposals-create",
      method: "POST",
      path: "/api/proposals",
      body: ({ workerId, iteration }) => ({
        jobId: `job_benchmark_${workerId}_${iteration}`,
        freelancerId: `usr_benchmark_${workerId}`,
        amount: 1200,
        coverLetter: "Synthetic proposal payload for benchmark coverage."
      })
    },
    {
      id: "api-payments-create",
      method: "POST",
      path: "/api/payments",
      body: () => ({
        amount: 1200,
        currency: "usd",
        jobId: "job_benchmark_payment"
      })
    },
    {
      id: "api-reviews-list",
      method: "GET",
      path: "/api/reviews"
    },
    {
      id: "api-reviews-create",
      method: "POST",
      path: "/api/reviews",
      body: ({ workerId, iteration }) => ({
        jobId: `job_benchmark_${workerId}_${iteration}`,
        rating: 5,
        comment: "Synthetic review for benchmark traffic."
      })
    },
    {
      id: "api-messages-list",
      method: "GET",
      path: "/api/messages"
    },
    {
      id: "api-messages-create",
      method: "POST",
      path: "/api/messages",
      body: ({ workerId, iteration }) => ({
        threadId: `thread_benchmark_${workerId}`,
        senderId: `usr_benchmark_${workerId}`,
        recipientId: "usr_benchmark_client",
        body: `Benchmark message ${iteration}`
      })
    },
    {
      id: "api-notifications-list",
      method: "GET",
      path: "/api/notifications"
    },
    {
      id: "api-notifications-create",
      method: "POST",
      path: "/api/notifications",
      body: ({ workerId, iteration }) => ({
        userId: `usr_benchmark_${workerId}`,
        type: "proposal_update",
        message: `Benchmark notification ${iteration}`
      })
    },
    {
      id: "api-uploads-create",
      method: "POST",
      path: "/api/uploads",
      formData: ({ workerId, iteration }) => {
        const form = new FormData();
        form.append(
          "file",
          new Blob([`benchmark upload ${workerId}-${iteration}`], { type: "text/plain" }),
          "benchmark.txt"
        );
        return form;
      }
    },
    {
      id: "api-search",
      method: "GET",
      path: "/api/search?q=benchmark%20developer"
    },
    {
      id: "api-admin-metrics",
      method: "GET",
      path: "/api/admin/metrics",
      headers: adminHeaders
    }
  ];
}

async function startLocalApi() {
  process.env.BENCHMARK_DISABLE_RATE_LIMIT ??= "true";
  process.env.NODE_ENV ??= "benchmark";

  const { createApp } = await import("../apps/api/src/app.js");
  const app = createApp();
  const server = http.createServer(app);

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });

  const { port } = server.address();
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    async close() {
      await new Promise((resolve, reject) => {
        server.close(error => (error ? reject(error) : resolve()));
      });
    }
  };
}

async function requestJson(baseUrl, path, body) {
  const response = await fetch(new URL(path, baseUrl), {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(body)
  });

  return response.json();
}

async function prepareContext(baseUrl) {
  if (process.env.BENCHMARK_ADMIN_TOKEN) {
    return { adminToken: process.env.BENCHMARK_ADMIN_TOKEN };
  }

  const response = await requestJson(baseUrl, "/api/auth/register", {
    email: benchmarkEmail("admin", 0, 0),
    password: "benchmark-password",
    role: "admin"
  });

  return { adminToken: response?.data?.token ?? null };
}

function percentile(values, p) {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[index];
}

function round(value, digits = 2) {
  return Number(value.toFixed(digits));
}

function scenarioRequestInit(scenario, workerId, iteration) {
  const headers = scenario.headers ?? {};
  const bodyPayload = scenario.body?.({ workerId, iteration });
  const form = scenario.formData?.({ workerId, iteration });

  if (form) {
    return {
      method: scenario.method,
      headers,
      body: form
    };
  }

  if (bodyPayload) {
    return {
      method: scenario.method,
      headers: jsonHeaders(headers),
      body: JSON.stringify(bodyPayload)
    };
  }

  return {
    method: scenario.method,
    headers
  };
}

async function runRequest(baseUrl, scenario, workerId, iteration) {
  const url = new URL(scenario.path, baseUrl);
  const start = performance.now();

  try {
    const response = await fetch(url, scenarioRequestInit(scenario, workerId, iteration));
    const headersAt = performance.now();
    await response.arrayBuffer();
    const end = performance.now();

    return {
      ok: response.status < 400,
      status: response.status,
      latencyMs: end - start,
      ttfbMs: headersAt - start,
      completedAtMs: end
    };
  } catch (error) {
    const end = performance.now();
    return {
      ok: false,
      status: "error",
      error: error.message,
      latencyMs: end - start,
      ttfbMs: end - start,
      completedAtMs: end
    };
  }
}

async function runScenario(baseUrl, scenario, options) {
  const samples = [];
  const startedAt = performance.now();
  const stopAt = options.durationMs > 0 ? startedAt + options.durationMs : null;
  const iterationsPerWorker = options.iterations ?? Number.POSITIVE_INFINITY;

  async function worker(workerId) {
    for (let iteration = 0; iteration < iterationsPerWorker; iteration += 1) {
      if (stopAt && performance.now() >= stopAt) {
        return;
      }

      samples.push(await runRequest(baseUrl, scenario, workerId, iteration));
      if (options.smoke) {
        await sleep(10);
      }
    }
  }

  await Promise.all(
    Array.from({ length: options.concurrency }, (_, workerId) => worker(workerId))
  );

  const endedAt = performance.now();
  const latencyValues = samples.map(sample => sample.latencyMs);
  const ttfbValues = samples.map(sample => sample.ttfbMs);
  const errors = samples.filter(sample => !sample.ok);
  const statusCounts = Object.fromEntries(
    [...new Set(samples.map(sample => String(sample.status)))]
      .sort()
      .map(status => [status, samples.filter(sample => String(sample.status) === status).length])
  );
  const elapsedSeconds = Math.max((endedAt - startedAt) / 1000, 0.001);
  const buckets = new Map();

  for (const sample of samples) {
    const bucket = Math.floor((sample.completedAtMs - startedAt) / 1000);
    buckets.set(bucket, (buckets.get(bucket) ?? 0) + 1);
  }

  return {
    id: scenario.id,
    method: scenario.method,
    path: scenario.path,
    requests: samples.length,
    errors: errors.length,
    errorRatePct: samples.length === 0 ? 100 : round((errors.length / samples.length) * 100),
    statusCounts,
    latencyMs: {
      p50: round(percentile(latencyValues, 50)),
      p95: round(percentile(latencyValues, 95)),
      p99: round(percentile(latencyValues, 99))
    },
    ttfbMs: {
      p95: round(percentile(ttfbValues, 95))
    },
    rps: {
      sustained: round(samples.length / elapsedSeconds),
      peak: Math.max(0, ...buckets.values())
    }
  };
}

async function readThresholds() {
  return JSON.parse(await readFile(THRESHOLDS_PATH, "utf8"));
}

function evaluateThresholds(results, thresholds) {
  const checks = [];
  for (const result of results) {
    const threshold = {
      ...thresholds.default,
      ...(thresholds.endpoints?.[result.id] ?? {})
    };

    const p99Passed = result.latencyMs.p99 <= threshold.p99Ms;
    const errorRatePassed = result.errorRatePct <= threshold.errorRatePct;

    checks.push({
      id: result.id,
      p99Ms: result.latencyMs.p99,
      p99LimitMs: threshold.p99Ms,
      p99Passed,
      errorRatePct: result.errorRatePct,
      errorRateLimitPct: threshold.errorRatePct,
      errorRatePassed,
      passed: p99Passed && errorRatePassed
    });
  }

  return checks;
}

function markdownReport(report) {
  const lines = [
    `# API Benchmark Report`,
    "",
    `- Run ID: \`${report.runId}\``,
    `- Target: \`${report.targetUrl}\``,
    `- Mode: \`${report.config.smoke ? "smoke" : "full"}\``,
    `- Concurrency: \`${report.config.concurrency}\``,
    `- Duration per endpoint: \`${report.config.durationMs / 1000}s\``,
    `- Iterations per worker: \`${report.config.iterations ?? "duration-based"}\``,
    "",
    "## Environment",
    "",
    `- Machine type: \`${report.environment.machineType}\``,
    `- Platform: \`${report.environment.platform} ${report.environment.release} ${report.environment.arch}\``,
    `- CPU: \`${report.environment.cpuModel}\``,
    `- Logical cores: \`${report.environment.logicalCores}\``,
    `- Total memory: \`${report.environment.totalMemoryGb} GB\``,
    `- Free memory at start: \`${report.environment.freeMemoryGb} GB\``,
    `- Node.js: \`${report.environment.nodeVersion}\``,
    "",
    "## Results",
    "",
    "| Endpoint | Requests | p50 ms | p95 ms | p99 ms | p95 TTFB ms | Sustained RPS | Peak RPS | Error % | Statuses |",
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |"
  ];

  for (const result of report.results) {
    lines.push(
      `| \`${result.method} ${result.path}\` | ${result.requests} | ${result.latencyMs.p50} | ${result.latencyMs.p95} | ${result.latencyMs.p99} | ${result.ttfbMs.p95} | ${result.rps.sustained} | ${result.rps.peak} | ${result.errorRatePct} | \`${JSON.stringify(result.statusCounts)}\` |`
    );
  }

  lines.push("", "## Threshold Checks", "");
  lines.push("| Endpoint | p99 ms | p99 limit | Error % | Error limit | Status |");
  lines.push("| --- | ---: | ---: | ---: | ---: | --- |");

  for (const check of report.thresholdChecks) {
    lines.push(
      `| \`${check.id}\` | ${check.p99Ms} | ${check.p99LimitMs} | ${check.errorRatePct} | ${check.errorRateLimitPct} | ${check.passed ? "PASS" : "FAIL"} |`
    );
  }

  return `${lines.join("\n")}\n`;
}

function environmentSnapshot() {
  const cpus = os.cpus();
  return {
    machineType: "local workstation",
    platform: os.platform(),
    release: os.release(),
    arch: os.arch(),
    cpuModel: cpus[0]?.model ?? "unknown",
    logicalCores: cpus.length,
    totalMemoryGb: round(os.totalmem() / 1024 ** 3, 2),
    freeMemoryGb: round(os.freemem() / 1024 ** 3, 2),
    nodeVersion: process.version
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const localServer = options.targetUrl ? null : await startLocalApi();
  const targetUrl = options.targetUrl ?? localServer.baseUrl;

  try {
    const context = await prepareContext(targetUrl);
    const scenarios = buildScenarios(context);
    const results = [];

    for (const scenario of scenarios) {
      console.log(`Benchmarking ${scenario.method} ${scenario.path}`);
      results.push(await runScenario(targetUrl, scenario, options));
    }

    const thresholds = await readThresholds();
    const thresholdChecks = evaluateThresholds(results, thresholds);
    const report = {
      runId,
      targetUrl,
      createdAt: new Date().toISOString(),
      config: {
        smoke: options.smoke,
        concurrency: options.concurrency,
        durationMs: options.durationMs,
        iterations: options.iterations
      },
      environment: environmentSnapshot(),
      results,
      thresholds,
      thresholdChecks
    };

    await mkdir(options.outputDir, { recursive: true });
    const prefix = options.smoke ? "smoke" : "full";
    const jsonPath = `${options.outputDir}/${prefix}-${runId}.json`;
    const markdownPath = `${options.outputDir}/${prefix}-${runId}.md`;
    await writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
    await writeFile(markdownPath, markdownReport(report));

    console.log(`Wrote ${jsonPath}`);
    console.log(`Wrote ${markdownPath}`);

    if (options.enforceThresholds) {
      const failed = thresholdChecks.filter(check => !check.passed);
      if (failed.length > 0) {
        console.error("Benchmark thresholds failed:");
        console.error(JSON.stringify(failed, null, 2));
        process.exitCode = 1;
      }
    }
  } finally {
    await localServer?.close();
  }
}

await main();
