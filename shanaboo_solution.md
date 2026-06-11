 ```diff
--- /dev/null
+++ b/benchmarks/.env.benchmark
@@ -0,0 +1,12 @@
+# Benchmark Environment Configuration
+# Copy this file to .env and fill in your values
+
+# Target API base URL (no trailing slash)
+# Examples: http://localhost:3001, https://staging-api.example.com
+API_BASE_URL=http://localhost:3001
+
+# Benchmark token for auth-protected routes
+# This should be a valid JWT for a benchmark/test user
+BENCHMARK_TOKEN=your_benchmark_jwt_token_here
+
+# Optional: override default benchmark duration in seconds
+# BENCHMARK_DURATION=30
--- /dev/null
+++ b	benchmarks/package.json
@@ -0,0 +1,17 @@
+{
+  "name": "@bug-bounty/benchmarks",
+  "version": "1.0.0",
+  "private": true,
+  "type": "module",
+  "scripts": {
+    "benchmark": "node run-benchmarks.js",
+    "benchmark:smoke": "node run-benchmarks.js --smoke"
+  },
+  "dependencies": {
+    "autocannon": "^7.15.0",
+    "dotenv": "^16.4.5"
+  },
+  "devDependencies": {
+    "@types/node": "^20.0.0"
+  }
+}
--- /dev/null
+++ b	benchmarks/run-benchmarks.js
@@ -0,0 +1,374 @@
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
+const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3001";
+const BENCHMARK_TOKEN = process.env.BENCHMARK_TOKEN || "";
+const BENCHMARK_DURATION = parseInt(process.env.BENCHMARK_DURATION || "30", 10);
+const IS_SMOKE = process.argv.includes("--smoke");
+
+// Configuration
+const CONCURRENCY = IS_SMOKE ? 5 : 50;
+const CONNECTIONS = IS_SMOKE ? 10 : 100;
+const DURATION = IS_SMOKE ? 10 : BENCHMARK_DURATION;
+
+// Results storage
+const resultsDir = path.join(__dirname, "results");
+if (!fs.existsSync(resultsDir)) {
+  fs.mkdirSync(resultsDir, { recursive: true });
+}
+
+// Auth header for protected routes
+const authHeader = BENCHMARK_TOKEN ? `Bearer ${BENCHMARK_TOKEN}` : "";
+
+// Define all API endpoints to benchmark
+const endpoints = [
+  // Public endpoints
+  { name: "health", method: "GET", path: "/health", protected: false },
+  
+  // Auth endpoints
+  { name: "auth-register", method: "POST", path: "/api/auth/register", protected: false, body: { email: "bench@test.com", password: "password123", name: "Benchmark User" } },
+  { name: "auth-login", method: "POST", path: "/api/auth/login", protected: false, body: { email: "bench@test.com", password: "password123" } },
+  
+  // User endpoints
+  { name: "users-list", method: "GET", path: "/api/users", protected: true },
+  { name: "users-me", method: "GET", path: "/api/users/me", protected: true },
+  
+  // Job endpoints
+  { name: "jobs-list", method: "GET", path: "/api/jobs", protected: false },
+  { name: "jobs-create", method: "POST", path: "/api/jobs", protected: true, body: { title: "Benchmark Job", description: "This is a benchmark job posting with realistic payload size.", budget: 1000, category: "development", skills: ["javascript", "typescript"] } },
+  
+  // Proposal endpoints
+  { name: "proposals-list", method: "GET", path: "/api/proposals", protected: true },
+  { name: "proposals-create", method: "POST", path: "/api/proposals", protected: true, body: { jobId: "123e4567-e89b-12d3-a456-426614174000", coverLetter: "This is a benchmark proposal with a realistic cover letter length to simulate production payload sizes.", proposedRate: 50 } },
+  
+  // Payment endpoints
+  { name: "payments-list", method: "GET", path: "/api/payments", protected: true },
+  
+  // Review endpoints
+  { name: "reviews-list", method: "GET", path: "/api/reviews", protected: false },
+  { name: "reviews-create", method: "POST", path: "/api/reviews", protected: true, body: { recipientId: "123e4567-e89b-12d3-a456-426614174000", rating: 5, comment: "Great work on the benchmark project!" } },
+  
+  // Message endpoints
+  { name: "messages-list", method: "GET", path: "/api/messages", protected: true },
+  { name: "messages-create", method: "POST", path: "/api/messages", protected: true, body: { recipientId: "123e4567-e89b-12d3-a456-426614174000", content: "This is a benchmark message with realistic content length." } },
+  
+  // Notification endpoints
+  { name: "notifications-list", method: "GET", path: "/api/notifications", protected: true },
+  
+  // Search endpoints
+  { name: "search-jobs", method: "GET", path: "/api/search/jobs?q=developer", protected: false },
+  { name: "search-freelancers", method: "GET", path: "/api/search/freelancers?q=developer", protected: false },
+  
+  // Admin endpoints
+  { name: "admin-dashboard", method: "GET", path: "/api/admin/dashboard", protected: true },
+  { name: "admin-users", method: "GET", path: "/api/admin/users", protected: true },
+];
+
+// Filter out protected endpoints if no token is provided
+const activeEndpoints = endpoints.filter((ep) => {
+  if (ep.protected && !BENCHMARK_TOKEN) {
+    console.warn(`Skipping protected endpoint ${ep.name} - no BENCHMARK_TOKEN provided`);
+    return false;
+  }
+ 