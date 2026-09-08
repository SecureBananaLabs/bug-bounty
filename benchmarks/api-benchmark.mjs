import { mkdir, readFile, writeFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";
import { createApp } from "../apps/api/src/app.js";
import { signAccessToken } from "../apps/api/src/utils/jwt.js";

const args = new Set(process.argv.slice(2));
const smoke = args.has("--smoke");
const targetFromEnv = process.env.BENCHMARK_TARGET_URL;
const concurrency = Number(process.env.BENCHMARK_CONCURRENCY ?? (smoke ? 1 : 4));
const durationMs = Number(process.env.BENCHMARK_DURATION_MS ?? (smoke ? 250 : 1500));
const maxRequestsPerEndpoint = Number(process.env.BENCHMARK_MAX_REQUESTS_PER_ENDPOINT ?? (smoke ? 1 : 5));
const resultsDir = new URL("./results/", import.meta.url);
const thresholdsFile = new URL("./thresholds.json", import.meta.url);
const now = new Date();
const stamp = now.toISOString().replace(/[-:]/g, "").replace(/\..+/, "Z");

const benchmarkToken = signAccessToken({
  sub: "benchmark-admin",
  role: "admin",
  scope: "benchmark"
});

const jsonHeaders = {
  "content-type": "application/json"
};

const authHeaders = {
  ...jsonHeaders,
  authorization: `Bearer ${benchmarkToken}`
};

const routes = [
  {
    name: "health",
    method: "GET",
    path: "/health"
  },
  {
    name: "auth-register",
    method: "POST",
    path: "/api/auth/register",
    headers: jsonHeaders,
    body: () => ({
      email: `bench-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`,
      password: "correct-horse-battery-staple",
      fullName: "Benchmark Client",
      role: "client"
    })
  },
  {
    name: "auth-login",
    method: "POST",
    path: "/api/auth/login",
    headers: jsonHeaders,
    body: () => ({
      email: "existing.client@example.com",
      password: "correct-horse-battery-staple"
    })
  },
  {
    name: "auth-oauth-callback",
    method: "GET",
    path: "/api/auth/oauth/github/callback"
  },
  {
    name: "auth-refresh",
    method: "POST",
    path: "/api/auth/refresh",
    headers: jsonHeaders,
    body: () => ({
      refreshToken: "benchmark-refresh-token"
    })
  },
  {
    name: "users-list",
    method: "GET",
    path: "/api/users"
  },
  {
    name: "users-create",
    method: "POST",
    path: "/api/users",
    headers: jsonHeaders,
    body: () => ({
      email: `freelancer-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`,
      fullName: "Benchmark Freelancer",
      role: "freelancer",
      skills: ["node", "api", "benchmark"]
    })
  },
  {
    name: "jobs-list",
    method: "GET",
    path: "/api/jobs"
  },
  {
    name: "jobs-create",
    method: "POST",
    path: "/api/jobs",
    headers: jsonHeaders,
    body: () => ({
      title: "Benchmark API test project",
      description: "Synthetic marketplace job payload used to exercise job creation latency.",
      budgetMin: 250,
      budgetMax: 750,
      categoryId: "software-development",
      skills: ["express", "testing", "performance"]
    })
  },
  {
    name: "proposals-list",
    method: "GET",
    path: "/api/proposals"
  },
  {
    name: "proposals-create",
    method: "POST",
    path: "/api/proposals",
    headers: jsonHeaders,
    body: () => ({
      jobId: "job_benchmark",
      freelancerId: "user_benchmark",
      bidAmount: 525,
      coverLetter: "I can deliver the benchmarked implementation with tests and a concise report.",
      estimatedDays: 3
    })
  },
  {
    name: "payments-create",
    method: "POST",
    path: "/api/payments",
    headers: authHeaders,
    body: () => ({
      amount: 52500,
      currency: "usd",
      jobId: "job_benchmark",
      payerId: "client_benchmark",
      payeeId: "freelancer_benchmark"
    })
  },
  {
    name: "reviews-list",
    method: "GET",
    path: "/api/reviews"
  },
  {
    name: "reviews-create",
    method: "POST",
    path: "/api/reviews",
    headers: jsonHeaders,
    body: () => ({
      jobId: "job_benchmark",
      reviewerId: "client_benchmark",
      revieweeId: "freelancer_benchmark",
      rating: 5,
      comment: "Delivered cleanly with useful benchmark evidence."
    })
  },
  {
    name: "messages-list",
    method: "GET",
    path: "/api/messages"
  },
  {
    name: "messages-create",
    method: "POST",
    path: "/api/messages",
    headers: jsonHeaders,
    body: () => ({
      senderId: "client_benchmark",
      recipientId: "freelancer_benchmark",
      body: "Can you share the benchmark summary and threshold file?"
    })
  },
  {
    name: "notifications-list",
    method: "GET",
    path: "/api/notifications"
  },
  {
    name: "notifications-create",
    method: "POST",
    path: "/api/notifications",
    headers: jsonHeaders,
    body: () => ({
      userId: "freelancer_benchmark",
      message: "A benchmark report is ready for review.",
      read: false
    })
  },
  {
    name: "uploads-create",
    method: "POST",
    path: "/api/uploads",
    multipart: true,
    body: () => {
      const form = new FormData();
      form.append(
        "file",
        new Blob(["benchmark upload fixture"], { type: "text/plain" }),
        "benchmark.txt"
      );
      return form;
    }
  },
  {
    name: "search",
    method: "GET",
    path: "/api/search?q=typescript%20performance%20freelancer"
  },
  {
    name: "admin-metrics",
    method: "GET",
    path: "/api/admin/metrics",
    headers: {
      authorization: `Bearer ${benchmarkToken}`
    }
  }
];

async function startLocalServer() {
  const app = createApp();
  const server = await new Promise((resolve) => {
    const listener = app.listen(0, "127.0.0.1", () => resolve(listener));
  });
  const { port } = server.address();
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())))
  };
}

function percentile(values, pct) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((pct / 100) * sorted.length) - 1);
  return Number(sorted[index].toFixed(2));
}

function peakRps(timestamps) {
  const buckets = new Map();
  for (const timestamp of timestamps) {
    const second = Math.floor(timestamp / 1000);
    buckets.set(second, (buckets.get(second) ?? 0) + 1);
  }
  return Math.max(0, ...buckets.values());
}

async function hit(baseUrl, route) {
  const url = `${baseUrl}${route.path}`;
  const options = {
    method: route.method,
    headers: route.headers
  };
  const body = route.body?.();
  if (body) {
    options.body = route.multipart ? body : JSON.stringify(body);
  }

  const start = performance.now();
  let status = 0;
  let ok = false;
  let ttfbMs = 0;
  let bytes = 0;

  try {
    const response = await fetch(url, options);
    ttfbMs = performance.now() - start;
    const text = await response.text();
    bytes = text.length;
    status = response.status;
    ok = response.status >= 200 && response.status < 400;
  } catch {
    ttfbMs = performance.now() - start;
  }

  return {
    status,
    ok,
    ttfbMs,
    totalMs: performance.now() - start,
    bytes
  };
}

async function runRoute(baseUrl, route) {
  const endAt = performance.now() + durationMs;
  const samples = [];

  async function worker() {
    do {
      samples.push({
        completedAt: Date.now(),
        ...(await hit(baseUrl, route))
      });
      if (smoke) break;
    } while (performance.now() < endAt && samples.length < maxRequestsPerEndpoint);
  }

  const started = performance.now();
  await Promise.all(Array.from({ length: concurrency }, worker));
  const elapsedMs = performance.now() - started;
  const errors = samples.filter((sample) => !sample.ok).length;
  const totals = samples.map((sample) => sample.totalMs);
  const ttfb = samples.map((sample) => sample.ttfbMs);

  return {
    name: route.name,
    method: route.method,
    path: route.path,
    requests: samples.length,
    errors,
    errorRate: Number((errors / Math.max(samples.length, 1)).toFixed(4)),
    sustainedRps: Number((samples.length / (elapsedMs / 1000)).toFixed(2)),
    peakRps: peakRps(samples.map((sample) => sample.completedAt)),
    latencyMs: {
      p50: percentile(totals, 50),
      p95: percentile(totals, 95),
      p99: percentile(totals, 99)
    },
    ttfbMs: {
      p50: percentile(ttfb, 50),
      p95: percentile(ttfb, 95),
      p99: percentile(ttfb, 99)
    },
    statusCounts: samples.reduce((counts, sample) => {
      counts[sample.status] = (counts[sample.status] ?? 0) + 1;
      return counts;
    }, {})
  };
}

async function readThresholds() {
  const fallback = {
    default: {
      p99Ms: 250,
      errorRate: 0.02
    },
    smoke: {
      p99Ms: 750,
      errorRate: 0.05
    }
  };

  try {
    return JSON.parse(await readFile(thresholdsFile, "utf8"));
  } catch {
    return fallback;
  }
}

function markdownReport(report) {
  const lines = [
    `# API Benchmark Summary (${report.mode})`,
    "",
    `Generated: ${report.generatedAt}`,
    `Target: ${report.target}`,
    `Concurrency: ${report.config.concurrency}`,
    `Duration per endpoint: ${report.config.durationMs} ms`,
    `Max requests per endpoint: ${report.config.maxRequestsPerEndpoint}`,
    "",
    "| Endpoint | Method | Requests | Sustained RPS | Peak RPS | Error Rate | p50 | p95 | p99 | TTFB p95 |",
    "| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |"
  ];

  for (const result of report.results) {
    lines.push(
      `| \`${result.path}\` | ${result.method} | ${result.requests} | ${result.sustainedRps} | ${result.peakRps} | ${result.errorRate} | ${result.latencyMs.p50} | ${result.latencyMs.p95} | ${result.latencyMs.p99} | ${result.ttfbMs.p95} |`
    );
  }

  lines.push("", "## Gate", "");
  lines.push(`p99 threshold: ${report.thresholds.p99Ms} ms`);
  lines.push(`error-rate threshold: ${report.thresholds.errorRate}`);
  lines.push(`status: ${report.gate.passed ? "passed" : "failed"}`);
  if (report.gate.failures.length) {
    lines.push("", "Failures:");
    for (const failure of report.gate.failures) {
      lines.push(`- ${failure}`);
    }
  }

  return `${lines.join("\n")}\n`;
}

async function main() {
  const local = targetFromEnv && !targetFromEnv.endsWith(":0")
    ? null
    : await startLocalServer();
  const baseUrl = local?.baseUrl ?? targetFromEnv;
  const thresholds = await readThresholds();
  const selectedThresholds = thresholds[smoke ? "smoke" : "default"];
  const thresholdP99 = Number(process.env.BENCHMARK_P99_THRESHOLD_MS ?? selectedThresholds.p99Ms);
  const thresholdErrorRate = Number(process.env.BENCHMARK_ERROR_RATE_THRESHOLD ?? selectedThresholds.errorRate);

  try {
    const results = [];
    for (const route of routes) {
      results.push(await runRoute(baseUrl, route));
    }

    const failures = [];
    for (const result of results) {
      if (result.latencyMs.p99 > thresholdP99) {
        failures.push(`${result.name} p99 ${result.latencyMs.p99}ms > ${thresholdP99}ms`);
      }
      if (result.errorRate > thresholdErrorRate) {
        failures.push(`${result.name} errorRate ${result.errorRate} > ${thresholdErrorRate}`);
      }
    }

    const report = {
      generatedAt: now.toISOString(),
      mode: smoke ? "smoke" : "full",
      target: baseUrl,
      config: {
        concurrency,
        durationMs,
        maxRequestsPerEndpoint
      },
      thresholds: {
        p99Ms: thresholdP99,
        errorRate: thresholdErrorRate
      },
      gate: {
        passed: failures.length === 0,
        failures
      },
      routes: routes.map(({ name, method, path }) => ({ name, method, path })),
      results
    };

    await mkdir(resultsDir, { recursive: true });
    await writeFile(new URL(`api-benchmark-${stamp}.json`, resultsDir), `${JSON.stringify(report, null, 2)}\n`);
    await writeFile(new URL(`api-benchmark-${stamp}.md`, resultsDir), markdownReport(report));

    console.log(markdownReport(report));
    if (!report.gate.passed) {
      process.exitCode = 1;
    }
  } finally {
    await local?.close();
  }
}

await main();
