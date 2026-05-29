```diff
--- /dev/null
+++ b/benchmarks/.env.benchmark
@@ -0,0 +1,12 @@
+# Benchmark Environment Configuration
+# Copy this file to .env and adjust values for your environment
+
+# Target server URL (local or staging)
+BENCHMARK_TARGET_URL=http://localhost:3001
+
+# Benchmark token for auth-protected routes
+# Generate a test token with benchmark scope for your environment
+BENCHMARK_TOKEN=your-benchmark-token-here
+
+# Results output directory (relative to benchmarks/)
+RESULTS_DIR=./results
\ No newline at end of file
--- /dev/null
+++ 	benchmarks/package.json
@@ -0,0 +1,18 @@
+{
+  "name": "@bug-bounty/benchmarks",
+  "version": "1.0.0",
+  "private": true,
+  "type": "module",
+  "scripts": {
+    "benchmark": "node run-benchmarks.js",
+    "benchmark:smoke": "node run-benchmarks.js --smoke",
+    "benchmark:ci": "node run-benchmarks.js --ci"
+  },
+  "dependencies": {
+    "autocannon": "^7.15.0",
+    "dotenv": "^16.3.1"
+  },
+  "devDependencies": {
+    "autocannon": "^7.15.0",
+    "dotenv": "^16.3.1"
+  }
+}
\ No newline at end of file
--- /dev/null
+++ 	benchmarks/run-benchmarks.js
@@ -0,0 +1,462 @@
+import autocannon from "autocannon";
+import fs from "fs";
+import path from "path";
+import { fileURLToPath } from "url";
+import dotenv from "dotenv";
+
+const __filename = fileURLToPath(import.meta.url);
+const __dirname = path.dirname(__filename);
+
+// Load environment variables
+dotenv.config({ path: path.join(__dirname, ".env") });
+
+const TARGET_URL = process.env.BENCHMARK_TARGET_URL || "http://localhost:3001";
+const BENCHMARK_TOKEN = process.env.BENCHMARK_TOKEN || "";
+const RESULTS_DIR = process.env.RESULTS_DIR || "./results";
+
+// Parse CLI args
+const isSmoke = process.argv.includes("--smoke");
+const isCI = process.argv.includes("--ci");
+
+// Benchmark configuration
+const CONNECTIONS = isSmoke ? 5 : isCI ? 10 : 50;
+const DURATION = isSmoke ? 10 : isCI ? 30 : 60;
+const PIPELINING = 1;
+
+// Ensure results directory exists
+const resultsPath = path.resolve(__dirname, RESULTS_DIR);
+if (!fs.existsSync(resultsPath)) {
+  fs.mkdirSync(resultsPath, { recursive: true });
+}
+
+// API endpoint definitions with realistic payloads
+const endpoints = [
+  {
+    name: "health",
+    method: "GET",
+    path: "/health",
+    auth: false,
+  },
+  {
+    name: "auth-register",
+    method: "POST",
+    path: "/api/auth/register",
+    auth: false,
+    body: JSON.stringify({
+      email: "benchmark@example.com",
+      password: "BenchmarkPass123!",
+      name: "Benchmark User",
+      role: "FREELANCER",
+    }),
+    headers: { "content-type": "application/json" },
+  },
+  {
+    name: "auth-login",
+    method: "POST",
+    path: "/api/auth/login",
+    auth: false,
+    body: JSON.stringify({
+      email: "benchmark@example.com",
+      password: "BenchmarkPass123!",
+    }),
+    headers: { "content-type": "application/json" },
+  },
+  {
+    name: "users-list",
+    method: "GET",
+    path: "/api/users",
+    auth: true,
+  },
+  {
+    name: "users-me",
+    method: "GET",
+    path: "/api/users/me",
+    auth: true,
+  },
+  {
+    name: "jobs-list",
+    method: "GET",
+    path: "/api/jobs",
+    auth: false,
+  },
+  {
+    name: "jobs-create",
+    method: "POST",
+    path: "/api/jobs",
+    auth: true,
+    body: JSON.stringify({
+      title: "Benchmark Job Posting",
+      description: "This is a realistic job description for benchmark purposes. ".repeat(20),
+      budget: 5000,
+      category: "web-development",
+      skills: ["react", "node", "typescript"],
+      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
+    }),
+    headers: { "content-type": "application/json" },
+  },
+  {
+    name: "proposals-list",
+    method: "GET",
+    path: "/api/proposals",
+    auth: true,
+  },
+  {
+    name: "proposals-create",
+    method: "POST",
+    path: "/api/proposals",
+    auth: true,
+    body: JSON.stringify({
+      jobId: "benchmark-job-id",
+      coverLetter: "This is a realistic proposal cover letter. ".repeat(15),
+      proposedBudget: 4500,
+      estimatedDuration: "2 weeks",
+    }),
+    headers: { "content-type": "application/json" },
+  },
+  {
+    name: "reviews-list",
+    method: "GET",
+    path: "/api/reviews",
+    auth: false,
+  },
+  {
+    name: "messages-list",
+    method: "GET",
+    path: "/api/messages",
+    auth: true,
+  },
+  {
+    name: "notifications-list",
+    method: "GET",
+    path: "/api/notifications",
+    auth: true,
+  },
+  {
+    name: "search-jobs",
+    method: "GET",
+    path: "/api/search/jobs?q=react&page=1&limit=20",
+    auth: false,
+  },
+  {
+    name: "admin-dashboard",
+    method: "GET",
+    path: "/api/admin/dashboard",
+    auth: true,
+  },
+];
+
+// Build request options for autocannon
+function buildRequest(endpoint) {
+  const req = {
+    method: endpoint.method,
+    path: endpoint.path,
+    headers: { ...(endpoint