import autocannon from "autocannon";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import jwt from "jsonwebtoken";
import { createApp } from "../apps/api/src/app.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runBenchmark() {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`Test server running at: ${baseUrl}`);

  // Generate a valid benchmark JWT token to test auth-protected routes
  const jwtSecret = process.env.JWT_SECRET || "development-secret";
  const testToken = jwt.sign(
    { id: "benchmark_test_user", role: "ADMIN" },
    jwtSecret,
    { expiresIn: "1h" }
  );

  const endpoints = [
    { path: "/health", method: "GET" },
    { path: "/api/jobs", method: "GET" },
    { path: "/api/users", method: "GET" },
    { path: "/api/proposals", method: "GET" },
    { 
      path: "/api/admin/metrics", 
      method: "GET", 
      headers: {
        Authorization: `Bearer ${testToken}`
      }
    }
  ];

  const results = {};
  let markdownSummary = `# API Benchmark Results\n\nGenerated on: ${new Date().toISOString()}\n\n`;
  markdownSummary += "| Endpoint | p50 (ms) | p95 (ms) | p99 (ms) | RPS | Error Rate (%) | TTFB (ms) |\n";
  markdownSummary += "| --- | --- | --- | --- | --- | --- | --- |\n";

  let passesGate = true;
  let threshold = 300;
  
  try {
    const thresholdData = JSON.parse(fs.readFileSync(path.join(__dirname, "thresholds.json"), "utf8"));
    threshold = thresholdData.p99_latency_threshold_ms || 300;
  } catch (e) {
    console.warn("Could not read thresholds.json, using default 300ms", e);
  }

  for (const ep of endpoints) {
    console.log(`Running benchmark on ${ep.method} ${ep.path}...`);
    const runResult = await new Promise((resolve, reject) => {
      autocannon({
        url: `${baseUrl}${ep.path}`,
        connections: 10,
        pipelining: 1,
        duration: 3,
        headers: ep.headers || {}
      }, (err, res) => {
        if (err) reject(err);
        else resolve(res);
      });
    });

    const errorRate = (runResult.errors / runResult.requests.sent) * 100 || 0;
    
    results[ep.path] = {
      p50: runResult.latency.p50,
      p95: runResult.latency.p95,
      p99: runResult.latency.p99,
      rps: runResult.requests.average,
      errorRate: errorRate,
      ttfb: runResult.latency.average
    };

    markdownSummary += `| ${ep.method} ${ep.path} | ${runResult.latency.p50} | ${runResult.latency.p95} | ${runResult.latency.p99} | ${runResult.requests.average} | ${errorRate.toFixed(2)}% | ${runResult.latency.average} |\n`;

    if (runResult.latency.p99 > threshold) {
      passesGate = false;
      console.error(`❌ REGRESSION DETECTED on ${ep.path}: p99 latency was ${runResult.latency.p99}ms (threshold: ${threshold}ms)`);
    }
  }

  // Write outputs
  fs.mkdirSync(path.join(__dirname, "results"), { recursive: true });
  fs.writeFileSync(path.join(__dirname, "results", "results.json"), JSON.stringify(results, null, 2));
  fs.writeFileSync(path.join(__dirname, "results", "results.md"), markdownSummary);

  server.close();
  
  console.log("\n--- Benchmark Complete ---");
  console.log(markdownSummary);

  if (!passesGate) {
    console.error("❌ Benchmark Regression Gate Failed.");
    process.exit(1);
  } else {
    console.log("✅ All benchmarks passed threshold checks!");
    process.exit(0);
  }
}

runBenchmark().catch(err => {
  console.error(err);
  process.exit(1);
});
