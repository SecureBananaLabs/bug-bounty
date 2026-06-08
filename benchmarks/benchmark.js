import autocannon from "autocannon";
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const HERE = dirname(fileURLToPath(import.meta.url));
const TARGET = process.env.BENCHMARK_TARGET || "http://localhost:4000";
const DURATION = Number(process.env.BENCHMARK_DURATION || 10);
const CONNECTIONS = Number(process.env.BENCHMARK_CONNECTIONS || 10);
const TOKEN = process.env.BENCHMARK_TOKEN || "";

const results = [];

function endpoint(method, path, opts = {}) {
  console.log(`\n  ${method} ${path}...`);
  const headers = { "Content-Type": "application/json" };
  if (TOKEN) headers["Authorization"] = `Bearer ${TOKEN}`;
  return new Promise((resolve) => {
    const instance = autocannon({
      url: `${TARGET}${path}`,
      method,
      headers,
      connections: opts.connections || CONNECTIONS,
      duration: opts.duration || DURATION,
      requests: opts.requests
        ? [
            {
              method,
              path,
              headers,
              body: opts.body ? JSON.stringify(opts.body) : undefined,
            },
          ]
        : undefined,
      setupClient: opts.setup,
    });
    autocannon.track(instance, { renderProgressBar: false });
    instance.on("done", (r) => {
      const res = {
        endpoint: `${method} ${path}`,
        p50: r.latency.p50,
        p95: r.latency.p97_5,
        p99: r.latency.p99,
        rps: r.requests.average,
        errorRate: r.errors / (r.requests.total || 1),
        ttfb: r.latency.average,
        totalRequests: r.requests.total,
        timeouts: r.timeouts,
        non2xx: r.non2xx,
      };
      results.push(res);
      console.log(
        `    p50=${res.p50}ms p95=${res.p95}ms p99=${res.p99}ms rps=${res.rps.toFixed(0)} errs=${(res.errorRate * 100).toFixed(1)}%`,
      );
      resolve();
    });
  });
}

async function main() {
  console.log(`\n FreelanceFlow API Benchmark`);
  console.log(` target: ${TARGET}`);
  console.log(` duration: ${DURATION}s`);
  console.log(` connections: ${CONNECTIONS}`);
  console.log("");

  // unauthenticated public endpoints
  await endpoint("GET", "/health");
  await endpoint("POST", "/api/auth/register", {
    body: { email: "bench@test.com", password: "12345678", role: "freelancer" },
  });
  await endpoint("POST", "/api/auth/login", {
    body: { email: "test@test.com", password: "12345678" },
  });
  await endpoint("GET", "/api/jobs");
  await endpoint("POST", "/api/jobs", {
    body: {
      title: "Test job post",
      description: "A test job posting for benchmark",
      budgetMin: 50,
      budgetMax: 200,
      categoryId: "cat_1",
      skills: ["node"],
    },
  });
  await endpoint("GET", "/api/users");
  await endpoint("POST", "/api/users", {
    body: { email: "test2@test.com", name: "Test User", role: "freelancer" },
  });
  await endpoint("GET", "/api/proposals");
  await endpoint("POST", "/api/proposals", {
    body: { jobId: "1", coverLetter: "I can do this", rate: 50 },
  });
  await endpoint("POST", "/api/payments", {
    body: { amount: 100, currency: "usd", method: "card" },
  });
  await endpoint("GET", "/api/reviews");
  await endpoint("POST", "/api/reviews", {
    body: { targetId: "1", score: 5, comment: "Great work" },
  });
  await endpoint("GET", "/api/messages");
  await endpoint("POST", "/api/messages", {
    body: { recipientId: "2", text: "Hello there" },
  });
  await endpoint("GET", "/api/notifications");
  await endpoint("POST", "/api/notifications", {
    body: { userId: "1", type: "info", message: "Test notification" },
  });
  await endpoint("GET", "/api/search");
  await endpoint("GET", "/api/search?q=developer");

  // auth-protected endpoints
  if (TOKEN) {
    await endpoint("GET", "/api/admin/metrics");
  }

  // generate report
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const jsonPath = join(HERE, "results", `benchmark-${ts}.json`);
  const mdPath = join(HERE, "results", `benchmark-${ts}.md`);

  writeFileSync(
    jsonPath,
    JSON.stringify({ timestamp: ts, target: TARGET, results }, null, 2),
  );
  console.log(`\n JSON: ${jsonPath}`);

  const md = [
    `# FreelanceFlow API Benchmark`,
    ``,
    `**Date:** ${new Date().toISOString()}`,
    `**Target:** ${TARGET}`,
    `**Duration:** ${DURATION}s`,
    `**Connections:** ${CONNECTIONS}`,
    ``,
    `| Endpoint | p50 (ms) | p95 (ms) | p99 (ms) | RPS | Error Rate |`,
    `|---|---|---|---|---|---|`,
    ...results.map(
      (r) =>
        `| ${r.endpoint} | ${r.p50.toFixed(1)} | ${r.p95.toFixed(1)} | ${r.p99.toFixed(1)} | ${r.rps.toFixed(0)} | ${(r.errorRate * 100).toFixed(1)}% |`,
    ),
  ].join("\n");

  writeFileSync(mdPath, md);
  console.log(` Markdown: ${mdPath}`);

  // summary
  const avgRps = results.reduce((s, r) => s + r.rps, 0) / results.length;
  const avgP95 = results.reduce((s, r) => s + r.p95, 0) / results.length;
  console.log(`\n Summary:`);
  console.log(`   avg RPS:  ${avgRps.toFixed(0)}`);
  console.log(`   avg p95:  ${avgP95.toFixed(1)}ms`);
  console.log(`   endpoints: ${results.length}`);
}

main().catch(console.error);
