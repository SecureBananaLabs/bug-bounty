import autocannon from "autocannon";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createApp } from "../apps/api/src/app.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

process.env.DISABLE_RATE_LIMIT = "true";

// Configuration
const PORT = process.env.PORT || 4002;
const HOST = process.env.HOST || `http://localhost:${PORT}`;
const JWT_SECRET = process.env.JWT_SECRET || "development-secret";

// Generate admin benchmark token
const adminToken = jwt.sign({ sub: "usr_bench_admin", role: "admin" }, JWT_SECRET);

// Load thresholds
const thresholds = JSON.parse(
  fs.readFileSync(path.join(__dirname, "thresholds.json"), "utf8")
);

// All Endpoints to Benchmark
const endpoints = [
  {
    name: "health",
    path: "/health",
    method: "GET",
    headers: {},
    body: ""
  },
  {
    name: "auth_register",
    path: "/api/auth/register",
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: `smoke_${Date.now()}@example.com`, password: "securepassword123", role: "client" })
  },
  {
    name: "auth_login",
    path: "/api/auth/login",
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "bench_user@example.com", password: "securepassword123" })
  },
  {
    name: "auth_refresh",
    path: "/api/auth/refresh",
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}"
  },
  {
    name: "users_list",
    path: "/api/users",
    method: "GET",
    headers: {},
    body: ""
  },
  {
    name: "users_create",
    path: "/api/users",
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: `user_${Date.now()}@example.com`, name: "Bench User" })
  },
  {
    name: "jobs_list",
    path: "/api/jobs",
    method: "GET",
    headers: {},
    body: ""
  },
  {
    name: "jobs_create",
    path: "/api/jobs",
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Benchmarking Position",
      description: "Looking for an expert developer for optimization",
      budgetMin: 100,
      budgetMax: 1000,
      categoryId: "cat_opt",
      skills: ["Node.js", "Performance"]
    })
  },
  {
    name: "proposals_list",
    path: "/api/proposals",
    method: "GET",
    headers: {},
    body: ""
  },
  {
    name: "proposals_create",
    path: "/api/proposals",
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jobId: "job_bench", bid: 500, coverLetter: "Highly qualified candidate." })
  },
  {
    name: "payments_create",
    path: "/api/payments",
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount: 1000, currency: "usd" })
  },
  {
    name: "reviews_list",
    path: "/api/reviews",
    method: "GET",
    headers: {},
    body: ""
  },
  {
    name: "reviews_create",
    path: "/api/reviews",
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reviewerId: "usr_1", revieweeId: "usr_2", rating: 5, comment: "Excellent work!" })
  },
  {
    name: "messages_list",
    path: "/api/messages",
    method: "GET",
    headers: {},
    body: ""
  },
  {
    name: "messages_create",
    path: "/api/messages",
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ senderId: "usr_1", receiverId: "usr_2", content: "Benchmark message content." })
  },
  {
    name: "notifications_list",
    path: "/api/notifications",
    method: "GET",
    headers: {},
    body: ""
  },
  {
    name: "notifications_create",
    path: "/api/notifications",
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: "usr_1", title: "Bench notification", message: "A test notification." })
  },
  {
    name: "uploads_create",
    path: "/api/uploads",
    method: "POST",
    headers: {
      "Content-Type": "multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW"
    },
    body: `------WebKitFormBoundary7MA4YWxkTrZu0gW\r\nContent-Disposition: form-data; name="file"; filename="bench.txt"\r\nContent-Type: text/plain\r\n\r\nBenchmark payload content\r\n------WebKitFormBoundary7MA4YWxkTrZu0gW--`
  },
  {
    name: "search",
    path: "/api/search?q=bench",
    method: "GET",
    headers: {},
    body: ""
  },
  {
    name: "admin_metrics",
    path: "/api/admin/metrics",
    method: "GET",
    headers: { "Authorization": `Bearer ${adminToken}` },
    body: ""
  }
];

async function runSmoke() {
  console.log(`Starting smoke API server on port ${PORT}...`);
  const app = createApp();
  const server = app.listen(PORT);
  
  await new Promise((r) => setTimeout(r, 100));
  
  console.log("Running regression gate check...");
  let failed = false;
  
  for (const endpoint of endpoints) {
    const threshold = thresholds[endpoint.name];
    if (threshold === undefined) {
      console.warn(`Warning: No threshold defined for ${endpoint.name}`);
      continue;
    }
    
    // Low concurrency test
    const runResult = await autocannon({
      url: `${HOST}${endpoint.path}`,
      method: endpoint.method,
      headers: endpoint.headers,
      body: endpoint.body,
      connections: 2,
      duration: 1
    });
    
    const p99 = runResult.latency.p99;
    const pass = p99 <= threshold;
    
    console.log(
      `Endpoint: ${endpoint.name.padEnd(20)} | p99: ${String(p99).padStart(3)} ms | Limit: ${String(threshold).padStart(3)} ms | Result: ${pass ? "PASS" : "FAIL"}`
    );
    
    if (!pass) {
      failed = true;
    }
  }
  
  console.log("Smoke check complete. Shutting down server...");
  server.close();
  
  if (failed) {
    console.error("\nFAIL: One or more endpoints exceeded p99 latency thresholds!");
    process.exit(1);
  } else {
    console.log("\nPASS: All endpoints are within acceptable p99 latency thresholds.");
    process.exit(0);
  }
}

runSmoke().catch((err) => {
  console.error("Smoke check runner failed:", err);
  process.exit(1);
});
