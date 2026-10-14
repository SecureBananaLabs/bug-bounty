import { performance } from "node:perf_hooks";
import { pathToFileURL } from "node:url";
import { createApp } from "../src/app.js";
import { signAccessToken } from "../src/utils/jwt.js";

const DEFAULT_ITERATIONS = 8;
const DEFAULT_CONCURRENCY = 4;

function uniqueEmail(prefix, iteration) {
  return `${prefix}.${Date.now()}.${iteration}@example.com`;
}

function jsonBody(payload) {
  return {
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  };
}

export const scenarios = [
  { name: "GET /health", method: "GET", path: "/health", expectedStatus: 200 },
  {
    name: "POST /api/auth/register",
    method: "POST",
    path: "/api/auth/register",
    expectedStatus: 201,
    buildRequest: (iteration) =>
      jsonBody({
        email: uniqueEmail("benchmark.register", iteration),
        password: "benchmark-password",
        role: "client"
      })
  },
  {
    name: "POST /api/auth/login",
    method: "POST",
    path: "/api/auth/login",
    expectedStatus: 200,
    buildRequest: () =>
      jsonBody({
        email: "benchmark.login@example.com",
        password: "benchmark-password"
      })
  },
  {
    name: "GET /api/auth/oauth/:provider/callback",
    method: "GET",
    path: "/api/auth/oauth/github/callback",
    expectedStatus: 200
  },
  {
    name: "POST /api/auth/refresh",
    method: "POST",
    path: "/api/auth/refresh",
    expectedStatus: 200,
    buildRequest: () => jsonBody({ refreshToken: "benchmark-refresh-token" })
  },
  { name: "GET /api/users", method: "GET", path: "/api/users", expectedStatus: 200 },
  {
    name: "POST /api/users",
    method: "POST",
    path: "/api/users",
    expectedStatus: 201,
    buildRequest: (iteration) =>
      jsonBody({
        email: uniqueEmail("benchmark.user", iteration),
        fullName: "Benchmark User",
        role: "client"
      })
  },
  { name: "GET /api/jobs", method: "GET", path: "/api/jobs", expectedStatus: 200 },
  {
    name: "POST /api/jobs",
    method: "POST",
    path: "/api/jobs",
    expectedStatus: 201,
    buildRequest: () =>
      jsonBody({
        title: "Benchmark marketplace build",
        description: "Build a realistic marketplace feature for API benchmark payload coverage.",
        budgetMin: 500,
        budgetMax: 2500,
        categoryId: "engineering",
        skills: ["node", "api", "benchmarking"]
      })
  },
  { name: "GET /api/proposals", method: "GET", path: "/api/proposals", expectedStatus: 200 },
  {
    name: "POST /api/proposals",
    method: "POST",
    path: "/api/proposals",
    expectedStatus: 201,
    buildRequest: () =>
      jsonBody({
        jobId: "job_benchmark",
        freelancerId: "usr_benchmark_freelancer",
        coverLetter: "I can deliver this benchmarked marketplace workflow.",
        bidAmount: 1200,
        estimatedDurationDays: 14
      })
  },
  {
    name: "POST /api/payments",
    method: "POST",
    path: "/api/payments",
    expectedStatus: 201,
    buildRequest: () => jsonBody({ amount: 150000, currency: "usd", jobId: "job_benchmark" })
  },
  { name: "GET /api/reviews", method: "GET", path: "/api/reviews", expectedStatus: 200 },
  {
    name: "POST /api/reviews",
    method: "POST",
    path: "/api/reviews",
    expectedStatus: 201,
    buildRequest: () =>
      jsonBody({
        jobId: "job_benchmark",
        reviewerId: "usr_benchmark_client",
        revieweeId: "usr_benchmark_freelancer",
        rating: 5,
        comment: "Clear communication and reliable delivery."
      })
  },
  { name: "GET /api/messages", method: "GET", path: "/api/messages", expectedStatus: 200 },
  {
    name: "POST /api/messages",
    method: "POST",
    path: "/api/messages",
    expectedStatus: 201,
    buildRequest: () =>
      jsonBody({
        threadId: "thr_benchmark",
        senderId: "usr_benchmark_client",
        recipientId: "usr_benchmark_freelancer",
        body: "Can you confirm milestone availability this week?"
      })
  },
  {
    name: "GET /api/notifications",
    method: "GET",
    path: "/api/notifications",
    expectedStatus: 200
  },
  {
    name: "POST /api/notifications",
    method: "POST",
    path: "/api/notifications",
    expectedStatus: 201,
    buildRequest: () =>
      jsonBody({
        userId: "usr_benchmark_client",
        type: "proposal_update",
        message: "A freelancer submitted a proposal."
      })
  },
  {
    name: "POST /api/uploads",
    method: "POST",
    path: "/api/uploads",
    expectedStatus: 201,
    buildRequest: () => {
      const form = new FormData();
      form.set("file", new Blob(["benchmark upload payload"], { type: "text/plain" }), "benchmark.txt");
      return { body: form };
    }
  },
  {
    name: "GET /api/search",
    method: "GET",
    path: "/api/search?q=benchmark%20marketplace",
    expectedStatus: 200
  },
  {
    name: "GET /api/admin/metrics",
    method: "GET",
    path: "/api/admin/metrics",
    expectedStatus: 200,
    buildRequest: () => ({
      headers: {
        authorization: `Bearer ${signAccessToken({ sub: "usr_benchmark_admin", role: "admin" })}`
      }
    })
  }
];

export function percentile(values, p) {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(sorted.length - 1, index))];
}

function parseOptions(argv) {
  const options = {
    iterations: Number(process.env.API_BENCHMARK_ITERATIONS ?? DEFAULT_ITERATIONS),
    concurrency: Number(process.env.API_BENCHMARK_CONCURRENCY ?? DEFAULT_CONCURRENCY)
  };

  for (const arg of argv) {
    const [name, value] = arg.split("=");
    if (name === "--iterations") {
      options.iterations = Number(value);
    }
    if (name === "--concurrency") {
      options.concurrency = Number(value);
    }
  }

  if (!Number.isInteger(options.iterations) || options.iterations < 1) {
    throw new Error("iterations must be a positive integer");
  }

  if (!Number.isInteger(options.concurrency) || options.concurrency < 1) {
    throw new Error("concurrency must be a positive integer");
  }

  return options;
}

async function listen(app) {
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  return server;
}

async function close(server) {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

async function runRequest(baseUrl, scenario, iteration) {
  const request = scenario.buildRequest?.(iteration) ?? {};
  const startedAt = performance.now();
  const response = await fetch(`${baseUrl}${scenario.path}`, {
    method: scenario.method,
    ...request,
    headers: request.headers
  });
  const ttfbMs = performance.now() - startedAt;
  await response.arrayBuffer();
  const totalMs = performance.now() - startedAt;

  return {
    ok: response.status === scenario.expectedStatus,
    status: response.status,
    ttfbMs,
    totalMs
  };
}

async function runScenario(baseUrl, scenario, options) {
  await runRequest(baseUrl, scenario, -1);

  const results = [];
  const startedAt = performance.now();
  let nextIteration = 0;

  async function worker() {
    while (nextIteration < options.iterations) {
      const iteration = nextIteration;
      nextIteration += 1;
      try {
        results.push(await runRequest(baseUrl, scenario, iteration));
      } catch (error) {
        results.push({
          ok: false,
          status: "request-error",
          error: error.message,
          ttfbMs: 0,
          totalMs: 0
        });
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(options.concurrency, options.iterations) }, () => worker())
  );

  const elapsedMs = performance.now() - startedAt;
  const totalLatencies = results.map((result) => result.totalMs);
  const ttfbLatencies = results.map((result) => result.ttfbMs);
  const failures = results.filter((result) => !result.ok);

  return {
    name: scenario.name,
    requests: results.length,
    expectedStatus: scenario.expectedStatus,
    errorRate: failures.length / results.length,
    rps: results.length / (elapsedMs / 1000),
    totalMs: {
      p50: percentile(totalLatencies, 50),
      p95: percentile(totalLatencies, 95),
      p99: percentile(totalLatencies, 99)
    },
    ttfbMs: {
      p50: percentile(ttfbLatencies, 50),
      p95: percentile(ttfbLatencies, 95),
      p99: percentile(ttfbLatencies, 99)
    },
    failures: failures.slice(0, 3).map((failure) => ({
      status: failure.status,
      error: failure.error
    }))
  };
}

function formatNumber(value) {
  return Number(value).toFixed(2);
}

function renderMarkdown(summary) {
  const lines = [
    "# API Benchmark Report",
    "",
    `Iterations per endpoint: ${summary.iterations}`,
    `Concurrency per endpoint: ${summary.concurrency}`,
    "",
    "| Endpoint | Requests | RPS | Error rate | Latency p50/p95/p99 (ms) | TTFB p50/p95/p99 (ms) |",
    "| --- | ---: | ---: | ---: | --- | --- |"
  ];

  for (const result of summary.results) {
    lines.push(
      `| ${result.name} | ${result.requests} | ${formatNumber(result.rps)} | ${formatNumber(
        result.errorRate * 100
      )}% | ${formatNumber(result.totalMs.p50)} / ${formatNumber(result.totalMs.p95)} / ${formatNumber(
        result.totalMs.p99
      )} | ${formatNumber(result.ttfbMs.p50)} / ${formatNumber(result.ttfbMs.p95)} / ${formatNumber(
        result.ttfbMs.p99
      )} |`
    );
  }

  const failing = summary.results.filter((result) => result.errorRate > 0);
  if (failing.length > 0) {
    lines.push("", "## Failures");
    for (const result of failing) {
      lines.push(`- ${result.name}: ${JSON.stringify(result.failures)}`);
    }
  }

  return `${lines.join("\n")}\n`;
}

export async function runBenchmark(options) {
  const app = createApp();
  const server = await listen(app);
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const results = [];
    for (const scenario of scenarios) {
      results.push(await runScenario(baseUrl, scenario, options));
    }

    return {
      baseUrl,
      iterations: options.iterations,
      concurrency: options.concurrency,
      results
    };
  } finally {
    await close(server);
  }
}

async function main() {
  const options = parseOptions(process.argv.slice(2));
  const summary = await runBenchmark(options);
  console.log(renderMarkdown(summary));

  if (summary.results.some((result) => result.errorRate > 0)) {
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
