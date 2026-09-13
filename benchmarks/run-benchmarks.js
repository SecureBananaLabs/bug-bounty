import { spawn } from "child_process";
import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration
const HOST = process.env.HOST || "http://localhost:4000";
const PORT = process.env.PORT || 4000;
const DURATION_MS = 2000; // 2 seconds per endpoint
const CONCURRENCY = 5;    // Low concurrency for smoke/CI run

// Load thresholds
const thresholdsPath = path.join(__dirname, "thresholds.json");
const thresholds = JSON.parse(fs.readFileSync(thresholdsPath, "utf8"));
const P99_LIMIT = thresholds.p99_latency_limit_ms || 150;

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Helper to make a single request and measure latency and TTFB
function makeRequest(urlPath, method = "GET", headers = {}, body = null) {
  return new Promise((resolve) => {
    const startTime = performance.now();
    let ttfb = 0;

    const parsedUrl = new URL(urlPath, HOST);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: method,
      headers: {
        ...headers,
        "Connection": "keep-alive"
      }
    };

    if (body) {
      options.headers["Content-Type"] = "application/json";
      options.headers["Content-Length"] = Buffer.byteLength(body);
    }

    const req = http.request(options, (res) => {
      // First byte received (on headers or data)
      res.once("readable", () => {
        if (ttfb === 0) {
          ttfb = performance.now() - startTime;
        }
      });
      res.on("data", () => {});
      res.on("end", () => {
        const latency = performance.now() - startTime;
        if (ttfb === 0) ttfb = latency;
        const success = res.statusCode >= 200 && res.statusCode < 300;
        resolve({ success, latency, ttfb });
      });
    });

    req.on("error", () => {
      const elapsed = performance.now() - startTime;
      resolve({ success: false, latency: elapsed, ttfb: elapsed });
    });

    if (body) req.write(body);
    req.end();
  });
}

// Run benchmark for a specific endpoint
async function benchmarkEndpoint(name, urlPath, method, headers, getBodyFn) {
  console.log(`Benchmarking ${name} (${method} ${urlPath})...`);
  const latencies = [];
  const ttfbs = [];
  let successfulRequests = 0;
  let failedRequests = 0;

  const endTime = Date.now() + DURATION_MS;
  let activeRequests = 0;
  let requestCount = 0;

  return new Promise((resolve) => {
    async function launchRequest() {
      if (Date.now() >= endTime) {
        if (activeRequests === 0) {
          finish();
        }
        return;
      }

      activeRequests++;
      requestCount++;
      const body = getBodyFn ? getBodyFn(requestCount) : null;
      
      const res = await makeRequest(urlPath, method, headers, body);
      
      latencies.push(res.latency);
      ttfbs.push(res.ttfb);
      if (res.success) {
        successfulRequests++;
      } else {
        failedRequests++;
      }
      activeRequests--;

      // Launch next request immediately to maintain concurrency
      launchRequest();
    }

    // Spawn initial concurrency workers
    for (let i = 0; i < CONCURRENCY; i++) {
      launchRequest();
    }

    function finish() {
      const totalRequests = successfulRequests + failedRequests;
      const rps = totalRequests / (DURATION_MS / 1000);
      const errorRate = (failedRequests / totalRequests) * 100 || 0;

      // Calculate percentiles
      latencies.sort((a, b) => a - b);
      ttfbs.sort((a, b) => a - b);

      const p50 = latencies[Math.floor(latencies.length * 0.50)] || 0;
      const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0;
      const p99 = latencies[Math.floor(latencies.length * 0.99)] || 0;
      const avgTtfb = ttfbs.reduce((a, b) => a + b, 0) / ttfbs.length || 0;

      resolve({
        name,
        method,
        urlPath,
        p50: Number(p50.toFixed(2)),
        p95: Number(p95.toFixed(2)),
        p99: Number(p99.toFixed(2)),
        avgTtfb: Number(avgTtfb.toFixed(2)),
        rps: Number(rps.toFixed(2)),
        errorRate: Number(errorRate.toFixed(2)),
        totalRequests
      });
    }
  });
}

async function main() {
  console.log("Starting benchmark suite...");
  
  // 1. Start Server
  console.log("Starting API Server locally...");
  const serverProc = spawn("node", ["apps/api/src/server.js"], {
    env: { ...process.env, PORT: PORT.toString(), STRIPE_SECRET_KEY: "dummy_key", BENCHMARK: "true" }
  });

  serverProc.stdout.on("data", (data) => {
    // console.log(`[Server] ${data}`);
  });

  serverProc.stderr.on("data", (data) => {
    console.error(`[Server Error] ${data}`);
  });

  // Wait for server to be up
  let serverUp = false;
  for (let i = 0; i < 20; i++) {
    try {
      const res = await makeRequest("/health", "GET");
      if (res.success) {
        serverUp = true;
        break;
      }
    } catch (e) {}
    await sleep(200);
  }

  if (!serverUp) {
    console.error("Failed to start API server.");
    serverProc.kill();
    process.exit(1);
  }
  console.log("API Server is up and listening.");

  // Pre-register user to get a token for auth route tests and to allow logins
  const testEmail = `bench-${Date.now()}@example.com`;
  const registerPayload = JSON.stringify({
    email: testEmail,
    password: "securepassword123",
    role: "client"
  });

  let token = "";
  try {
    const res = await makeRequest("/api/auth/register", "POST", {}, registerPayload);
    // Log in to get the token
    const response = await fetch(`${HOST}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail, password: "securepassword123" })
    });
    if (response.ok) {
      const payload = await response.json();
      token = payload.data.token;
    }
  } catch (e) {
    console.error("Failed to pre-register/login test user:", e.message);
  }

  if (!token) {
    console.warn("WARNING: Auth token not generated. Auth benchmark will fail.");
  }

  // 2. Run Benchmarks
  const results = [];

  // Route 1: Health
  results.push(await benchmarkEndpoint("Health Endpoint", "/health", "GET"));

  // Route 2: Register
  results.push(await benchmarkEndpoint("Auth Register", "/api/auth/register", "POST", {}, (i) => {
    return JSON.stringify({
      email: `bench-user-${Date.now()}-${i}@example.com`,
      password: "securepassword123",
      role: "client"
    });
  }));

  // Route 3: Login
  results.push(await benchmarkEndpoint("Auth Login", "/api/auth/login", "POST", {}, () => {
    return JSON.stringify({
      email: testEmail,
      password: "securepassword123"
    });
  }));

  // Route 4: Payments
  results.push(await benchmarkEndpoint("Create Payment Intent", "/api/payments", "POST", {}, () => {
    return JSON.stringify({
      amount: 1000,
      currency: "usd"
    });
  }));

  // Route 5: Admin Metrics
  results.push(await benchmarkEndpoint(
    "Admin Metrics",
    "/api/admin/metrics",
    "GET",
    token ? { "Authorization": `Bearer ${token}` } : {}
  ));

  // Kill Server
  serverProc.kill();

  // 3. Write results
  console.log("\nWriting benchmark results...");
  const resultsDir = path.join(__dirname, "results");
  fs.mkdirSync(resultsDir, { recursive: true });

  fs.writeFileSync(path.join(resultsDir, "results.json"), JSON.stringify(results, null, 2));

  // Build Markdown summary
  let md = `# Benchmark Results Summary\n\n`;
  md += `Generated on ${new Date().toISOString()}\n\n`;
  md += `| Endpoint | Method | p50 (ms) | p95 (ms) | p99 (ms) | Avg TTFB (ms) | RPS | Error Rate (%) |\n`;
  md += `|---|---|---|---|---|---|---|---|\n`;
  for (const r of results) {
    md += `| ${r.name} | ${r.method} ${r.urlPath} | ${r.p50} | ${r.p95} | ${r.p99} | ${r.avgTtfb} | ${r.rps} | ${r.errorRate}% |\n`;
  }
  md += `\n*Threshold check: P99 latency limit is **${P99_LIMIT}ms***\n`;

  fs.writeFileSync(path.join(resultsDir, "results.md"), md);

  // Print results console table
  console.table(results.map(r => ({
    Endpoint: r.name,
    Path: `${r.method} ${r.urlPath}`,
    p50: `${r.p50}ms`,
    p95: `${r.p95}ms`,
    p99: `${r.p99}ms`,
    avgTTFB: `${r.avgTtfb}ms`,
    RPS: r.rps,
    Errors: `${r.errorRate}%`
  })));

  // Regression check: Fail if any endpoint p99 exceeds limit
  const failures = results.filter(r => r.p99 > P99_LIMIT);
  if (failures.length > 0) {
    console.error(`\n❌ REGRESSION DETECTED! The following endpoints exceeded the p99 threshold of ${P99_LIMIT}ms:`);
    for (const f of failures) {
      console.error(`  - ${f.name} (p99: ${f.p99}ms)`);
    }
    process.exit(1);
  }

  console.log("\n✅ All benchmark metrics are within thresholds.");
  process.exit(0);
}

main();
