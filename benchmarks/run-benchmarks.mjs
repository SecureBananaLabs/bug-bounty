import { existsSync, readFileSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";

const benchmarkDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(benchmarkDir, "..");

loadEnvFile(path.join(repoRoot, ".env.benchmark"));

const args = new Set(process.argv.slice(2));
const smoke = args.has("--smoke") || process.env.BENCHMARK_SMOKE === "1";

process.env.NODE_ENV ||= "benchmark";
process.env.BENCHMARK_DISABLE_RATE_LIMIT ||= "1";

const config = {
  concurrency: toPositiveInt(process.env.BENCHMARK_CONCURRENCY, smoke ? 1 : 4),
  durationMs: toPositiveInt(process.env.BENCHMARK_DURATION_MS, smoke ? 250 : 1500),
  warmupRequests: toPositiveInt(process.env.BENCHMARK_WARMUP_REQUESTS, smoke ? 1 : 2),
  requestTimeoutMs: toPositiveInt(process.env.BENCHMARK_REQUEST_TIMEOUT_MS, 5000),
  outputDir: process.env.BENCHMARK_OUTPUT_DIR
    ? path.resolve(repoRoot, process.env.BENCHMARK_OUTPUT_DIR)
    : path.join(benchmarkDir, "results"),
  thresholdsPath: process.env.BENCHMARK_THRESHOLDS
    ? path.resolve(repoRoot, process.env.BENCHMARK_THRESHOLDS)
    : path.join(benchmarkDir, "thresholds.json")
};

const localTarget = !process.env.BENCHMARK_TARGET_URL || process.env.BENCHMARK_TARGET_URL === "local";
let server;
let baseUrl = process.env.BENCHMARK_TARGET_URL;

if (localTarget) {
  const { createApp } = await import("../apps/api/src/app.js");
  const app = createApp();
  const port = toNonNegativeInt(process.env.BENCHMARK_PORT, 0);

  server = await new Promise((resolve) => {
    const listener = app.listen(port, "127.0.0.1", () => resolve(listener));
  });

  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
}

const benchmarkToken = await getBenchmarkToken(localTarget);
const routes = createRoutes(benchmarkToken);
const thresholds = JSON.parse(await readFile(config.thresholdsPath, "utf8"));

try {
  await mkdir(config.outputDir, { recursive: true });

  const endpoints = [];
  for (const route of routes) {
    endpoints.push(await runEndpoint(route, baseUrl, config));
  }

  const failures = evaluateThresholds(endpoints, thresholds);
  const report = {
    generatedAt: new Date().toISOString(),
    mode: smoke ? "smoke" : "full",
    target: {
      baseUrl,
      localServerStarted: localTarget
    },
    config: serializeConfig(config),
    environment: {
      node: process.version,
      platform: process.platform,
      arch: process.arch,
      rateLimitDisabled: process.env.BENCHMARK_DISABLE_RATE_LIMIT === "1"
    },
    endpoints,
    failures
  };

  await writeFile(path.join(config.outputDir, "latest.json"), `${JSON.stringify(report, null, 2)}\n`);
  await writeFile(path.join(config.outputDir, "latest.md"), renderMarkdown(report));

  console.log(renderConsoleSummary(report));

  if (failures.length > 0) {
    process.exitCode = 1;
  }
} finally {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return;
  }

  const content = existsSync(filePath) ? requireText(filePath) : "";
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    process.env[key] ??= value;
  }
}

function requireText(filePath) {
  return existsSync(filePath) ? readFileSync(filePath, "utf8") : "";
}

async function getBenchmarkToken(isLocal) {
  if (process.env.BENCHMARK_TOKEN) {
    return process.env.BENCHMARK_TOKEN;
  }

  if (!isLocal) {
    throw new Error("BENCHMARK_TOKEN is required when BENCHMARK_TARGET_URL points at an external server.");
  }

  const { signAccessToken } = await import("../apps/api/src/utils/jwt.js");
  return signAccessToken({ sub: "usr_benchmark", role: "admin", purpose: "benchmark" });
}

function createRoutes(token) {
  const richDescription = [
    "Build a full-stack marketplace dashboard with authenticated messaging, payment milestones,",
    "proposal review, notification routing, and admin reporting for a growing freelance team.",
    "The project should include reusable components, measurable delivery checkpoints, and clear",
    "acceptance criteria for frontend, backend, and QA handoff."
  ].join(" ");

  return [
    {
      name: "auth.register",
      method: "POST",
      path: "/api/auth/register",
      json: (requestId) => ({
        email: `benchmark.register.${requestId}@example.com`,
        password: "benchmark-password",
        role: "client"
      })
    },
    {
      name: "auth.login",
      method: "POST",
      path: "/api/auth/login",
      json: (requestId) => ({
        email: `benchmark.login.${requestId}@example.com`,
        password: "benchmark-password"
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
      json: (requestId) => ({
        email: `benchmark.user.${requestId}@example.com`,
        name: `Benchmark User ${requestId}`,
        role: "freelancer",
        skills: ["node", "react", "performance-testing"],
        hourlyRate: 95
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
      json: (requestId) => ({
        title: `Benchmark API delivery ${requestId}`,
        description: richDescription,
        budgetMin: 2500,
        budgetMax: 7500,
        categoryId: "cat_engineering",
        skills: ["node", "express", "benchmarking", "observability"]
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
      json: (requestId) => ({
        jobId: `job_benchmark_${requestId}`,
        freelancerId: "usr_benchmark_freelancer",
        coverLetter: richDescription,
        proposedBudget: 4900,
        estimatedDays: 18,
        milestones: [
          { title: "Discovery", amount: 900 },
          { title: "Implementation", amount: 3000 },
          { title: "QA and handoff", amount: 1000 }
        ]
      })
    },
    {
      name: "payments.create",
      method: "POST",
      path: "/api/payments",
      json: (requestId) => ({
        proposalId: `prp_benchmark_${requestId}`,
        amount: 4900,
        currency: "usd",
        paymentMethodId: "pm_benchmark_card"
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
      json: (requestId) => ({
        contractId: `ctr_benchmark_${requestId}`,
        reviewerId: "usr_benchmark_client",
        revieweeId: "usr_benchmark_freelancer",
        rating: 5,
        comment: "Delivered the benchmark scenario with clear milestones and production-ready notes."
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
      json: (requestId) => ({
        conversationId: `cnv_benchmark_${requestId}`,
        senderId: "usr_benchmark_client",
        recipientId: "usr_benchmark_freelancer",
        body: "Please review the attached milestone notes and confirm the delivery window."
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
      json: (requestId) => ({
        userId: "usr_benchmark_client",
        type: "milestone_due",
        title: "Milestone review needed",
        body: `Benchmark notification ${requestId} with enough payload size to mirror production copy.`
      })
    },
    {
      name: "uploads.create",
      method: "POST",
      path: "/api/uploads",
      form: (requestId) => {
        const form = new FormData();
        const content = `benchmark upload ${requestId}\n${richDescription}\n`;
        form.set("file", new Blob([content], { type: "text/plain" }), `benchmark-${requestId}.txt`);
        return form;
      }
    },
    {
      name: "search.global",
      method: "GET",
      path: "/api/search?q=full-stack%20marketplace%20node%20benchmark"
    },
    {
      name: "admin.metrics",
      method: "GET",
      path: "/api/admin/metrics",
      headers: {
        authorization: `Bearer ${token}`
      }
    }
  ];
}

async function runEndpoint(route, baseUrl, config) {
  for (let index = 0; index < config.warmupRequests; index += 1) {
    await performRequest(route, baseUrl, `warmup-${index}`, config.requestTimeoutMs);
  }

  const samples = [];
  const bucketCounts = new Map();
  const startedAt = performance.now();
  let sequence = 0;

  await Promise.all(
    Array.from({ length: config.concurrency }, async () => {
      while (performance.now() - startedAt < config.durationMs) {
        sequence += 1;
        const requestId = `${route.name.replaceAll(".", "-")}-${Date.now()}-${sequence}`;
        const sample = await performRequest(route, baseUrl, requestId, config.requestTimeoutMs);
        samples.push(sample);

        const bucket = Math.floor((sample.startedAt - startedAt) / 1000);
        bucketCounts.set(bucket, (bucketCounts.get(bucket) ?? 0) + 1);
      }
    })
  );

  const elapsedMs = performance.now() - startedAt;
  const totalRequests = samples.length;
  const errors = samples.filter((sample) => !sample.ok).length;
  const latencies = samples.map((sample) => sample.totalMs).sort((a, b) => a - b);
  const ttfbs = samples.map((sample) => sample.ttfbMs).sort((a, b) => a - b);
  const statusCounts = countBy(samples, (sample) => String(sample.status ?? "network_error"));

  return {
    name: route.name,
    method: route.method,
    path: route.path,
    samples: totalRequests,
    durationMs: round(elapsedMs),
    p50LatencyMs: percentile(latencies, 50),
    p95LatencyMs: percentile(latencies, 95),
    p99LatencyMs: percentile(latencies, 99),
    p50TtfbMs: percentile(ttfbs, 50),
    p95TtfbMs: percentile(ttfbs, 95),
    p99TtfbMs: percentile(ttfbs, 99),
    sustainedRps: totalRequests === 0 ? 0 : round(totalRequests / (elapsedMs / 1000)),
    peakRps: Math.max(0, ...bucketCounts.values()),
    errorRatePercent: totalRequests === 0 ? 100 : round((errors / totalRequests) * 100),
    statusCounts
  };
}

async function performRequest(route, baseUrl, requestId, timeoutMs) {
  const headers = { ...(route.headers ?? {}) };
  const init = {
    method: route.method,
    headers
  };

  if (route.json) {
    headers["content-type"] = "application/json";
    init.body = JSON.stringify(route.json(requestId));
  }

  if (route.form) {
    init.body = route.form(requestId);
  }

  if (typeof AbortSignal !== "undefined" && AbortSignal.timeout) {
    init.signal = AbortSignal.timeout(timeoutMs);
  }

  const startedAt = performance.now();
  try {
    const response = await fetch(new URL(route.path, baseUrl), init);
    const ttfbMs = performance.now() - startedAt;
    const body = await response.arrayBuffer();
    const totalMs = performance.now() - startedAt;

    return {
      startedAt,
      status: response.status,
      ok: response.status < 400,
      totalMs: round(totalMs),
      ttfbMs: round(ttfbMs),
      bytes: body.byteLength
    };
  } catch (error) {
    const totalMs = performance.now() - startedAt;
    return {
      startedAt,
      status: null,
      ok: false,
      totalMs: round(totalMs),
      ttfbMs: round(totalMs),
      error: error.message
    };
  }
}

function evaluateThresholds(endpoints, thresholds) {
  const defaults = thresholds.defaults ?? {};
  const endpointThresholds = thresholds.endpoints ?? {};
  const failures = [];

  for (const endpoint of endpoints) {
    const rule = { ...defaults, ...(endpointThresholds[endpoint.name] ?? {}) };
    if (Number.isFinite(rule.maxP99Ms) && endpoint.p99LatencyMs > rule.maxP99Ms) {
      failures.push({
        endpoint: endpoint.name,
        metric: "p99LatencyMs",
        actual: endpoint.p99LatencyMs,
        threshold: rule.maxP99Ms
      });
    }

    if (Number.isFinite(rule.maxP99TtfbMs) && endpoint.p99TtfbMs > rule.maxP99TtfbMs) {
      failures.push({
        endpoint: endpoint.name,
        metric: "p99TtfbMs",
        actual: endpoint.p99TtfbMs,
        threshold: rule.maxP99TtfbMs
      });
    }

    if (Number.isFinite(rule.maxErrorRatePercent) && endpoint.errorRatePercent > rule.maxErrorRatePercent) {
      failures.push({
        endpoint: endpoint.name,
        metric: "errorRatePercent",
        actual: endpoint.errorRatePercent,
        threshold: rule.maxErrorRatePercent
      });
    }
  }

  return failures;
}

function renderMarkdown(report) {
  const rows = report.endpoints
    .map((endpoint) => [
      endpoint.name,
      endpoint.method,
      endpoint.path,
      endpoint.samples,
      endpoint.p50LatencyMs,
      endpoint.p95LatencyMs,
      endpoint.p99LatencyMs,
      endpoint.p95TtfbMs,
      endpoint.sustainedRps,
      endpoint.peakRps,
      endpoint.errorRatePercent,
      report.failures.some((failure) => failure.endpoint === endpoint.name) ? "fail" : "pass"
    ])
    .map((cells) => `| ${cells.join(" | ")} |`)
    .join("\n");

  const failures = report.failures.length === 0
    ? "No threshold failures."
    : report.failures
        .map((failure) => `- ${failure.endpoint}: ${failure.metric} ${failure.actual} exceeded ${failure.threshold}`)
        .join("\n");

  return `# API Benchmark Results

- Generated: ${report.generatedAt}
- Mode: ${report.mode}
- Target: ${report.target.baseUrl}
- Local server started by runner: ${report.target.localServerStarted ? "yes" : "no"}
- Concurrency: ${report.config.concurrency}
- Duration per endpoint: ${report.config.durationMs} ms
- Warmup requests per endpoint: ${report.config.warmupRequests}
- TTFB note: measured as Node fetch response-header timing; total latency includes body read.

| Endpoint | Method | Path | Samples | p50 ms | p95 ms | p99 ms | p95 TTFB ms | Sustained RPS | Peak RPS | Error % | Gate |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
${rows}

## Threshold Gate

${failures}
`;
}

function renderConsoleSummary(report) {
  const result = report.failures.length === 0 ? "passed" : "failed";
  return [
    `Benchmark ${result}: ${report.endpoints.length} endpoints, ${report.failures.length} threshold failures.`,
    `JSON: ${path.join(report.config.outputDir, "latest.json")}`,
    `Markdown: ${path.join(report.config.outputDir, "latest.md")}`
  ].join("\n");
}

function serializeConfig(config) {
  return {
    ...config,
    outputDir: toRepoRelative(config.outputDir),
    thresholdsPath: toRepoRelative(config.thresholdsPath)
  };
}

function toRepoRelative(filePath) {
  const relative = path.relative(repoRoot, filePath).replaceAll("\\", "/");
  return relative || ".";
}

function percentile(values, percent) {
  if (values.length === 0) {
    return 0;
  }

  const index = Math.ceil((percent / 100) * values.length) - 1;
  return round(values[Math.max(0, Math.min(index, values.length - 1))]);
}

function countBy(items, keyFn) {
  return items.reduce((counts, item) => {
    const key = keyFn(item);
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
}

function toPositiveInt(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

function toNonNegativeInt(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : fallback;
}

function round(value) {
  return Math.round(value * 100) / 100;
}
