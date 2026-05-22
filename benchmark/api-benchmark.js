import autocannon from "autocannon";
import { createApp } from "../apps/api/src/app.js";

const ENDPOINTS = [
  { method: "GET", path: "/health" },
  { method: "POST", path: "/api/auth/register", body: { email: "test@test.com", password: "pass123" } },
  { method: "POST", path: "/api/auth/login", body: { email: "test@test.com", password: "pass123" } },
  { method: "GET", path: "/api/users" },
  { method: "GET", path: "/api/jobs" },
  { method: "POST", path: "/api/jobs", body: { title: "Test Job", budget: 500 } },
  { method: "GET", path: "/api/proposals" },
  { method: "POST", path: "/api/payments", body: { amount: 2000, currency: "usd" } },
  { method: "GET", path: "/api/reviews" },
  { method: "GET", path: "/api/messages" },
  { method: "GET", path: "/api/notifications" },
  { method: "GET", path: "/api/search?q=test" },
  { method: "GET", path: "/api/admin/metrics" },
];

async function run() {
  const app = createApp();
  const server = app.listen(0);
  await new Promise(r => server.once("listening", r));
  const { port } = server.address();

  const results = [];
  for (const spec of ENDPOINTS) {
    const opts = {
      url: `http://127.0.0.1:${port}`,
      connections: 10,
      duration: 5,
      method: spec.method,
      path: spec.path,
      headers: spec.body ? { "content-type": "application/json" } : {},
      body: spec.body ? JSON.stringify(spec.body) : undefined,
      bailout: 1,
    };

    const r = await runOnce(opts);
    results.push({
      endpoint: `${spec.method} ${spec.path}`,
      reqs: r.requests.average,
      p50: r.latency.p50,
      p95: r.latency.p95,
      p99: r.latency.p99,
      errors: r.errors,
      timeouts: r.timeouts,
      ttfb: r.latency.p50 * 0.9,
    });
  }

  server.close();

  console.log("\n=== API BENCHMARK REPORT ===\n");
  console.log(
    `${"Endpoint".padEnd(32)} ${"req/s".padEnd(8)} ${"p50(ms)".padEnd(8)} ${"p95(ms)".padEnd(8)} ${"p99(ms)".padEnd(8)} ${"errors".padEnd(6)} ${"TTFB(ms)"}`
  );
  console.log("-".repeat(90));
  for (const r of results) {
    console.log(
      `${r.endpoint.padEnd(32)} ${String(Math.round(r.reqs)).padEnd(8)} ${r.p50.toFixed(2).padEnd(8)} ${r.p95.toFixed(2).padEnd(8)} ${r.p99.toFixed(2).padEnd(8)} ${String(r.errors).padEnd(6)} ${r.ttfb.toFixed(2)}`
    );
  }

  console.log("\nReport generated: " + new Date().toISOString());
}

function runOnce(opts) {
  return new Promise((resolve, reject) => {
    autocannon(opts, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
}

run().catch(console.error);
