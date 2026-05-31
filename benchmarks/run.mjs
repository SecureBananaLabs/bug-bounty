import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { performance } from "node:perf_hooks";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");
const smokeMode = process.argv.includes("--smoke");

loadBenchmarkEnv();
process.env.NODE_ENV ??= "benchmark";
process.env.BENCHMARK_DISABLE_RATE_LIMIT ??= process.env.BENCHMARK_BASE_URL ? "false" : "true";

const iterations = smokeMode ? 3 : readPositiveInt("BENCHMARK_ITERATIONS", 30);
const concurrency = smokeMode ? 1 : readPositiveInt("BENCHMARK_CONCURRENCY", 4);
const warmup = smokeMode ? 1 : readPositiveInt("BENCHMARK_WARMUP", 2);
const resultsDir = resolve(repoRoot, process.env.BENCHMARK_RESULTS_DIR ?? "benchmarks/results");
const thresholds = JSON.parse(readFileSync(resolve(__dirname, "thresholds.json"), "utf8"));

const { baseUrl, close } = await resolveBenchmarkTarget();
const authToken = await resolveAuthToken();
const endpoints = buildEndpointScenarios(authToken);

console.log(`Benchmark target: ${baseUrl}`);
console.log(`Mode: ${smokeMode ? "smoke" : "full"} | endpoints: ${endpoints.length} | iterations: ${iterations} | concurrency: ${concurrency}`);

const startedAt = new Date();
const endpointResults = [];

for (const endpoint of endpoints) {
  await runWarmup(endpoint, baseUrl);
  endpointResults.push(await runEndpoint(endpoint, baseUrl));
}

const summary = summarize(endpointResults, startedAt);
const report = {
  generatedAt: startedAt.toISOString(),
  mode: smokeMode ? "smoke" : "full",
  baseUrl,
  config: { iterations, concurrency, warmup },
  summary,
  endpoints: endpointResults
};

mkdirSync(resultsDir, { recursive: true });
const stamp = startedAt.toISOString().replace(/[:.]/g, "-");
const jsonPath = resolve(resultsDir, `benchmark-${stamp}.json`);
const markdownPath = resolve(resultsDir, `benchmark-${stamp}.md`);
writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(markdownPath, renderMarkdown(report));

console.log(`Wrote ${relativeToRoot(jsonPath)}`);
console.log(`Wrote ${relativeToRoot(markdownPath)}`);

const failures = evaluateThresholds(report, thresholds);
if (close) {
  await close();
}

if (failures.length > 0) {
  console.error("Benchmark threshold failures:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exitCode = 1;
}

function loadBenchmarkEnv() {
  const envPath = resolve(repoRoot, ".env.benchmark");
  if (!existsSync(envPath)) {
    return;
  }

  for (const rawLine of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separator = line.indexOf("=");
    if (separator === -1) {
      continue;
    }

    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim().replace(/^["']|["']$/g, "");
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

async function resolveBenchmarkTarget() {
  if (process.env.BENCHMARK_BASE_URL) {
    return {
      baseUrl: process.env.BENCHMARK_BASE_URL.replace(/\/$/, ""),
      close: null
    };
  }

  const { createApp } = await import("../apps/api/src/app.js");
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolveListen, rejectListen) => {
    server.once("listening", resolveListen);
    server.once("error", rejectListen);
  });

  const { port } = server.address();
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolveClose, rejectClose) => {
      server.close((error) => (error ? rejectClose(error) : resolveClose()));
    })
  };
}

async function resolveAuthToken() {
  if (process.env.BENCHMARK_AUTH_TOKEN) {
    return process.env.BENCHMARK_AUTH_TOKEN;
  }

  const { signAccessToken } = await import("../apps/api/src/utils/jwt.js");
  return signAccessToken({
    sub: "benchmark-admin",
    role: "admin",
    scope: "benchmark"
  });
}

function buildEndpointScenarios(authToken) {
  const authHeaders = { Authorization: `Bearer ${authToken}` };
  return [
    scenario("POST", "/api/auth/register", {
      body: () => ({
        email: `bench-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`,
        password: "benchmark-pass",
        role: "client"
      })
    }),
    scenario("POST", "/api/auth/login", {
      body: () => ({ email: "benchmark@example.com", password: "benchmark-pass" })
    }),
    scenario("GET", "/api/auth/oauth/github/callback"),
    scenario("POST", "/api/auth/refresh"),
    scenario("GET", "/api/users"),
    scenario("POST", "/api/users", {
      body: () => ({
        name: "Benchmark Client",
        email: `client-${Date.now()}@example.com`,
        role: "client"
      })
    }),
    scenario("GET", "/api/jobs"),
    scenario("POST", "/api/jobs", {
      body: () => ({
        title: "Build benchmark landing page",
        description: "Create a realistic benchmark payload for the marketplace API.",
        budgetMin: 500,
        budgetMax: 1200,
        categoryId: "web-development",
        skills: ["nextjs", "node", "api"]
      })
    }),
    scenario("GET", "/api/proposals"),
    scenario("POST", "/api/proposals", {
      body: () => ({
        jobId: "job_benchmark",
        freelancerId: "usr_freelancer",
        bidAmount: 850,
        coverLetter: "I can deliver a tested implementation with documented tradeoffs."
      })
    }),
    scenario("POST", "/api/payments", {
      body: () => ({ amount: 125000, currency: "usd", jobId: "job_benchmark" })
    }),
    scenario("GET", "/api/reviews"),
    scenario("POST", "/api/reviews", {
      body: () => ({
        reviewerId: "usr_client",
        revieweeId: "usr_freelancer",
        rating: 5,
        comment: "Fast delivery and clear communication."
      })
    }),
    scenario("GET", "/api/messages"),
    scenario("POST", "/api/messages", {
      body: () => ({
        threadId: "thread_benchmark",
        senderId: "usr_client",
        recipientId: "usr_freelancer",
        body: "Can you share an implementation update today?"
      })
    }),
    scenario("GET", "/api/notifications"),
    scenario("POST", "/api/notifications", {
      body: () => ({
        userId: "usr_client",
        type: "proposal_received",
        message: "A freelancer submitted a proposal."
      })
    }),
    scenario("POST", "/api/uploads", {
      form: () => {
        const form = new FormData();
        form.set("file", new Blob(["benchmark upload"], { type: "text/plain" }), "benchmark.txt");
        return form;
      }
    }),
    scenario("GET", "/api/search?q=benchmark"),
    scenario("GET", "/api/admin/metrics", { headers: authHeaders })
  ];
}

function scenario(method, path, options = {}) {
  return {
    name: `${method} ${path.replace(/\?.*/, "")}`,
    method,
    path,
    headers: options.headers ?? {},
    body: options.body,
    form: options.form
  };
}

async function runWarmup(endpoint, baseUrl) {
  for (let i = 0; i < warmup; i += 1) {
    await makeRequest(endpoint, baseUrl);
  }
}

async function runEndpoint(endpoint, baseUrl) {
  const samples = [];
  const started = performance.now();
  let nextIteration = 0;

  async function worker() {
    while (nextIteration < iterations) {
      nextIteration += 1;
      samples.push(await makeRequest(endpoint, baseUrl));
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  const elapsedMs = performance.now() - started;
  return summarizeEndpoint(endpoint.name, samples, elapsedMs);
}

async function makeRequest(endpoint, baseUrl) {
  const url = `${baseUrl}${endpoint.path}`;
  const headers = { ...endpoint.headers };
  let body;

  if (endpoint.form) {
    body = endpoint.form();
  } else if (endpoint.body) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(endpoint.body());
  }

  const started = performance.now();
  let ttfbMs = 0;
  let status = 0;
  let ok = false;
  let error = null;

  try {
    const response = await fetch(url, { method: endpoint.method, headers, body });
    ttfbMs = performance.now() - started;
    status = response.status;
    ok = response.ok;
    await response.arrayBuffer();
  } catch (requestError) {
    error = requestError.message;
  }

  const latencyMs = performance.now() - started;
  return { latencyMs, ttfbMs: ttfbMs || latencyMs, status, ok, error };
}

function summarizeEndpoint(name, samples, elapsedMs) {
  const latencies = samples.map((sample) => sample.latencyMs).sort((a, b) => a - b);
  const ttfbs = samples.map((sample) => sample.ttfbMs).sort((a, b) => a - b);
  const errors = samples.filter((sample) => !sample.ok).length;

  return {
    name,
    samples: samples.length,
    elapsedMs: round(elapsedMs),
    rps: round(samples.length / (elapsedMs / 1000)),
    errorRate: round(errors / samples.length),
    errors,
    latency: {
      p50: percentile(latencies, 50),
      p95: percentile(latencies, 95),
      p99: percentile(latencies, 99)
    },
    ttfb: {
      p50: percentile(ttfbs, 50),
      p95: percentile(ttfbs, 95),
      p99: percentile(ttfbs, 99)
    },
    statuses: samples.reduce((counts, sample) => {
      const key = String(sample.status);
      counts[key] = (counts[key] ?? 0) + 1;
      return counts;
    }, {})
  };
}

function summarize(endpointResults, startedAt) {
  const totalSamples = endpointResults.reduce((sum, endpoint) => sum + endpoint.samples, 0);
  const totalErrors = endpointResults.reduce((sum, endpoint) => sum + endpoint.errors, 0);
  const totalElapsedMs = endpointResults.reduce((sum, endpoint) => sum + endpoint.elapsedMs, 0);
  const worstP95 = Math.max(...endpointResults.map((endpoint) => endpoint.latency.p95));
  const worstP99 = Math.max(...endpointResults.map((endpoint) => endpoint.latency.p99));

  return {
    startedAt: startedAt.toISOString(),
    endpointCount: endpointResults.length,
    samples: totalSamples,
    elapsedMs: round(totalElapsedMs),
    rps: round(totalSamples / (totalElapsedMs / 1000)),
    errorRate: round(totalErrors / totalSamples),
    errors: totalErrors,
    worstP95,
    worstP99
  };
}

function evaluateThresholds(report, thresholdConfig) {
  const failures = [];
  const aggregate = thresholdConfig.aggregate ?? {};

  if (aggregate.maxP95Ms !== undefined && report.summary.worstP95 > aggregate.maxP95Ms) {
    failures.push(`aggregate p95 ${report.summary.worstP95}ms exceeded ${aggregate.maxP95Ms}ms`);
  }
  if (aggregate.maxErrorRate !== undefined && report.summary.errorRate > aggregate.maxErrorRate) {
    failures.push(`aggregate error rate ${report.summary.errorRate} exceeded ${aggregate.maxErrorRate}`);
  }
  if (aggregate.minRps !== undefined && report.summary.rps < aggregate.minRps) {
    failures.push(`aggregate RPS ${report.summary.rps} below ${aggregate.minRps}`);
  }

  for (const endpoint of report.endpoints) {
    const threshold = thresholdConfig.endpoints?.[endpoint.name];
    if (!threshold) {
      continue;
    }

    if (threshold.maxP95Ms !== undefined && endpoint.latency.p95 > threshold.maxP95Ms) {
      failures.push(`${endpoint.name} p95 ${endpoint.latency.p95}ms exceeded ${threshold.maxP95Ms}ms`);
    }
  }

  return failures;
}

function renderMarkdown(report) {
  const rows = report.endpoints
    .map((endpoint) => [
      endpoint.name,
      endpoint.samples,
      endpoint.rps,
      endpoint.errorRate,
      endpoint.latency.p50,
      endpoint.latency.p95,
      endpoint.latency.p99,
      endpoint.ttfb.p95
    ])
    .map((cells) => `| ${cells.join(" | ")} |`)
    .join("\n");

  return `# API Benchmark Results

- Generated: ${report.generatedAt}
- Mode: ${report.mode}
- Target: ${report.baseUrl}
- Endpoints: ${report.summary.endpointCount}
- Samples: ${report.summary.samples}
- Aggregate RPS: ${report.summary.rps}
- Aggregate error rate: ${report.summary.errorRate}
- Worst p95 latency: ${report.summary.worstP95} ms
- Worst p99 latency: ${report.summary.worstP99} ms

| Endpoint | Samples | RPS | Error rate | p50 ms | p95 ms | p99 ms | TTFB p95 ms |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
${rows}
`;
}

function percentile(sortedValues, p) {
  if (sortedValues.length === 0) {
    return 0;
  }

  const index = Math.ceil((p / 100) * sortedValues.length) - 1;
  return round(sortedValues[Math.min(Math.max(index, 0), sortedValues.length - 1)]);
}

function readPositiveInt(name, fallback) {
  const value = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function round(value) {
  return Math.round(value * 100) / 100;
}

function relativeToRoot(path) {
  return path.replace(`${repoRoot}\\`, "").replaceAll("\\", "/");
}
