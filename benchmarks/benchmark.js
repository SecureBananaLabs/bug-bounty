import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import jwt from "jsonwebtoken";
import autocannon from "autocannon";

const __dirname = dirname(fileURLToPath(import.meta.url));
const RESULTS_DIR = resolve(__dirname, "results");
mkdirSync(RESULTS_DIR, { recursive: true });

const PORT = 9999;
const BASE = `http://127.0.0.1:${PORT}`;
const JWT_SECRET = "development-secret";

const clientToken = jwt.sign({ sub: "usr_benchmark", role: "client" }, JWT_SECRET, { expiresIn: "1h" });
const adminToken = jwt.sign({ sub: "usr_admin", role: "admin" }, JWT_SECRET, { expiresIn: "1h" });

const endpoints = [
  { name: "GET /health", method: "GET", path: "/health", headers: {} },

  { name: "POST /auth/register", method: "POST", path: "/api/auth/register",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "bench@test.com", password: "password123" }) },

  { name: "POST /auth/login", method: "POST", path: "/api/auth/login",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "bench@test.com", password: "password123" }) },

  { name: "GET /users", method: "GET", path: "/api/users",
    headers: { authorization: `Bearer ${clientToken}` } },

  { name: "POST /users", method: "POST", path: "/api/users",
    headers: { authorization: `Bearer ${clientToken}`, "content-type": "application/json" },
    body: JSON.stringify({ email: "user@bench.com" }) },

  { name: "GET /jobs", method: "GET", path: "/api/jobs",
    headers: { authorization: `Bearer ${clientToken}` } },

  { name: "POST /jobs", method: "POST", path: "/api/jobs",
    headers: { authorization: `Bearer ${clientToken}`, "content-type": "application/json" },
    body: JSON.stringify({ title: "Benchmark Job Post", description: "This is a benchmark test job used for performance measurement.", budgetMin: 100, budgetMax: 500, categoryId: "cat-1", skills: ["node", "js"] }) },

  { name: "GET /proposals", method: "GET", path: "/api/proposals",
    headers: { authorization: `Bearer ${clientToken}` } },

  { name: "POST /proposals", method: "POST", path: "/api/proposals",
    headers: { authorization: `Bearer ${clientToken}`, "content-type": "application/json" },
    body: JSON.stringify({ jobId: "job-1", coverLetter: "I am interested in this position." }) },

  { name: "POST /payments", method: "POST", path: "/api/payments",
    headers: { authorization: `Bearer ${clientToken}`, "content-type": "application/json" },
    body: JSON.stringify({ amount: 5000, currency: "usd" }) },

  { name: "GET /reviews", method: "GET", path: "/api/reviews",
    headers: { authorization: `Bearer ${clientToken}` } },

  { name: "POST /reviews", method: "POST", path: "/api/reviews",
    headers: { authorization: `Bearer ${clientToken}`, "content-type": "application/json" },
    body: JSON.stringify({ reviewerId: "usr-1", revieweeId: "usr-2", rating: 5, comment: "Great delivery" }) },

  { name: "GET /messages", method: "GET", path: "/api/messages",
    headers: { authorization: `Bearer ${clientToken}` } },

  { name: "POST /messages", method: "POST", path: "/api/messages",
    headers: { authorization: `Bearer ${clientToken}`, "content-type": "application/json" },
    body: JSON.stringify({ senderId: "usr-1", receiverId: "usr-2", body: "Test message for benchmarking." }) },

  { name: "GET /notifications", method: "GET", path: "/api/notifications",
    headers: { authorization: `Bearer ${clientToken}` } },

  { name: "POST /notifications", method: "POST", path: "/api/notifications",
    headers: { authorization: `Bearer ${clientToken}`, "content-type": "application/json" },
    body: JSON.stringify({ userId: "usr-1", message: "Benchmark notification" }) },

  { name: "GET /search?q=js", method: "GET", path: "/api/search?q=javascript",
    headers: { authorization: `Bearer ${clientToken}` } },

  { name: "POST /uploads", method: "POST", path: "/api/uploads",
    headers: { authorization: `Bearer ${clientToken}` } },

  { name: "GET /admin/metrics", method: "GET", path: "/api/admin/metrics",
    headers: { authorization: `Bearer ${adminToken}` } },
];

function runBenchmark(endpoint) {
  return new Promise((resolve, reject) => {
    const instance = autocannon({
      url: `${BASE}${endpoint.path}`,
      method: endpoint.method,
      headers: endpoint.headers || {},
      body: endpoint.body,
      connections: 10,
      duration: 5,
      pipelining: 1,
      timeout: 10,
    });
    instance.on("done", resolve);
    instance.on("error", reject);
  });
}

async function main() {
  console.log("=== API Benchmark Suite ===\n");

  console.log("Starting API server on port", PORT, "...");
  const server = spawn("node", ["src/server.js"], {
    cwd: resolve(__dirname, "../apps/api"),
    env: { ...process.env, PORT: String(PORT), JWT_SECRET },
    stdio: ["ignore", "pipe", "pipe"],
  });

  let stderrBuf = "";
  server.stderr.on("data", (d) => { stderrBuf += d.toString(); });

  // Poll until server is ready (max 15s)
  let ready = false;
  for (let i = 0; i < 15; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    try {
      const hr = await fetch(`${BASE}/health`);
      if (hr.ok) { ready = true; break; }
    } catch { /* retry */ }
  }

  if (!ready) {
    console.error("Server failed to start after 15s");
    if (stderrBuf) console.error("stderr:", stderrBuf);
    server.kill();
    process.exit(1);
  }

  console.log("Server ready\n");

  const results = [];

  for (const ep of endpoints) {
    process.stdout.write(`${ep.name}... `);
    try {
      const result = await runBenchmark(ep);
      const lat = result.latency || {};
      const req = result.requests || {};
      const errCount = result.errors || 0;

      const m = {
        endpoint: ep.name,
        method: ep.method,
        latency_p50: +(lat.p50 || lat.average || 0).toFixed(2),
        latency_p95: +(lat.p95 || lat.p99 || 0).toFixed(2),
        latency_p99: +(lat.p99 || lat.max || 0).toFixed(2),
        latency_avg: +(lat.average || 0).toFixed(2),
        rps_avg: +(req.average || 0).toFixed(1),
        rps_total: req.total || 0,
        error_rate: req.total > 0 ? +((errCount / req.total) * 100).toFixed(2) : 0,
        errors: errCount,
        timeouts: result.timeouts || 0,
        non2xx: result.non2xx || 0,
      };

      results.push(m);
      console.log(`p50=${m.latency_p50} p95=${m.latency_p95} p99=${m.latency_p99} RPS=${m.rps_avg}`);
    } catch (err) {
      console.log(`FAIL (${err.message})`);
      results.push({
        endpoint: ep.name, method: ep.method,
        latency_p50: 0, latency_p95: 0, latency_p99: 0, latency_avg: 0,
        rps_avg: 0, rps_total: 0, error_rate: 100, errors: 0, timeouts: 0, non2xx: 0,
      });
    }
  }

  const ts = Date.now();

  // JSON output
  const jsonPath = resolve(RESULTS_DIR, `benchmark-${ts}.json`);
  writeFileSync(jsonPath, JSON.stringify({ ranAt: new Date().toISOString(), results }, null, 2));
  console.log(`\nJSON -> ${jsonPath}`);

  // Markdown summary
  const md = [
    "# API Benchmark Results",
    "",
    `**Run at:** ${new Date().toISOString()}`,
    "**Tool:** autocannon (10 connections, 5s duration per endpoint)",
    `**Runtime:** Node.js ${process.version}`,
    "",
    "| Endpoint | Method | p50 | p95 | p99 | RPS | Error % |",
    "|----------|--------|-----|-----|-----|-----|---------|",
  ];

  for (const r of results) {
    md.push(`| ${r.endpoint} | ${r.method} | ${r.latency_p50}ms | ${r.latency_p95}ms | ${r.latency_p99}ms | ${r.rps_avg} | ${r.error_rate}% |`);
  }

  md.push("", "## Observations", "");
  const slow = results.filter((r) => r.latency_p99 > 100);
  if (slow.length > 0) {
    md.push("### Endpoints with p99 > 100ms:");
    for (const r of slow) md.push(`- **${r.endpoint}**: p99=${r.latency_p99}ms`);
  } else {
    md.push("All endpoints perform within bounds (p99 < 100ms).");
  }

  md.push("", "---", "", "Benchmark executed by LUMEN autonomous agent.");

  const mdPath = resolve(RESULTS_DIR, "benchmark-summary.md");
  writeFileSync(mdPath, md.join("\n"));
  console.log(`MD  -> ${mdPath}`);

  server.kill();
  console.log("\n=== Benchmark complete ===");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
