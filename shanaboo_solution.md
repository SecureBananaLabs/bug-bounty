 ```diff
--- /dev/null
+++ b/benchmarks/.env.benchmark
@@ -0,0 +1,10 @@
+# Benchmark Configuration
+# Copy this file to .env and adjust values for your environment
+
+# Target API base URL (local or staging)
+BENCHMARK_TARGET_URL=http://localhost:3001
+
+# Benchmark test token for auth-protected routes
+# Create a test user and generate a JWT token for benchmarking
+BENCHMARK_AUTH_TOKEN=your_benchmark_jwt_token_here
+
--- /dev/null
+++ b/benchmarks/package.json
@@ -0,0 +1,17 @@
+{
+  "name": "@bug-bounty/benchmarks",
+  "version": "1.0.0",
+  "private": true,
+  "type": "module",
+  "scripts": {
+    "benchmark": "node run-benchmarks.js",
+    "benchmark:smoke": "node run-benchmarks.js --smoke",
+    "benchmark:report": "node generate-report.js"
+  },
+  "dependencies": {
+    "autocannon": "^7.15.0"
+  },
+  "devDependencies": {
+    "dotenv": "^16.3.1"
+  }
+}
+
--- /dev/null
+++ b/benchmarks/config.js
@@ -0,0 +1,88 @@
+import { readFileSync } from 'fs';
+import { fileURLToPath } from 'url';
+import { dirname, join } from 'path';
+
+const __filename = fileURLToPath(import.meta.url);
+const __dirname = dirname(__filename);
+
+// Load environment variables
+try {
+  const envPath = join(__dirname, '.env');
+  const envContent = readFileSync(envPath, 'utf-8');
+  envContent.split('\n').forEach(line => {
+    const [key, value] = line.split('=');
+    if (key && value && !key.startsWith('#')) {
+      process.env[key.trim()] = value.trim();
+    }
+  });
+} catch (err) {
+  // .env file is optional, use defaults or process.env
+}
+
+const TARGET_URL = process.env.BENCHMARK_TARGET_URL || 'http://localhost:3001';
+const AUTH_TOKEN = process.env.BENCHMARK_AUTH_TOKEN || '';
+
+export const config = {
+  targetUrl: TARGET_URL,
+  authToken: AUTH_TOKEN,
+  duration: 30, // seconds for full benchmark
+  smokeDuration: 5, // seconds for smoke test
+  connections: 100,
+  smokeConnections: 10,
+  pipelining: 1,
+  resultsDir: join(__dirname, 'results'),
+  thresholdsPath: join(__dirname, 'thresholds.json'),
+};
+
+// Define all API endpoints to benchmark
+export const endpoints = [
+  // Public endpoints
+  {
+    name: 'health',
+    path: '/health',
+    method: 'GET',
+    requiresAuth: false,
+  },
+  // Auth endpoints
+  {
+    name: 'auth-register',
+    path: '/api/auth/register',
+    method: 'POST',
+    requiresAuth: false,
+    body: { email: 'bench@test.com', password: 'Benchmark123!', name: 'Benchmark User' },
+  },
+  {
+    name: 'auth-login',
+    path: '/api/auth/login',
+    method: 'POST',
+    requiresAuth: false,
+    body: { email: 'bench@test.com', password: 'Benchmark123!' },
+  },
+  // Protected endpoints
+  {
+    name: 'users-me',
+    path: '/api/users/me',
+    method: 'GET',
+    requiresAuth: true,
+  },
+  {
+    name: 'jobs-list',
+    path: '/api/jobs',
+    method: 'GET',
+    requiresAuth: false,
+  },
+  {
+    name: 'proposals-list',
+    path: '/api/proposals',
+    method: 'GET',
+    requiresAuth: true,
+  },
+  {
+    name: 'notifications',
+    path: '/api/notifications',
+    method: 'GET',
+    requiresAuth: true,
+  },
+];
+
+export default config;
+
--- /dev/null
+++ b/benchmarks/run-benchmarks.js
@@ -0,0 +1,228 @@
+import autocannon from 'autocannon';
+import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'fs';
+import { join } from 'path';
+import { config, endpoints } from './config.js';
+
+const isSmoke = process.argv.includes('--smoke');
+const runDuration = isSmoke ? config.smokeDuration : config.duration;
+const runConnections = isSmoke ? config.smokeConnections : config.connections;
+
+// Ensure results directory exists
+try {
+  mkdirSync(config.resultsDir, { recursive: true });
+} catch (err) {
+  // Directory already exists
+}
+
+function buildUrl(path) {
+  return `${config.targetUrl}${path}`;
+}
+
+function getHeaders(requiresAuth) {
+  const headers = {
+    'Content-Type': 'application/json',
+  };
+  if (requiresAuth && config.authToken) {
+    headers['Authorization'] = `Bearer ${config.authToken}`;
+  }
+  return headers;
+}
+
+async function runBenchmark(endpoint) {
+  const url = buildUrl(endpoint.path);
+  const headers = getHeaders(endpoint.requiresAuth);
+  
+  const options = {
+    url,
+    connections: runConnections,
+    duration: runDuration,
+    pipelining: config.pipelining,
+    method: endpoint.method || 'GET',
+    headers,
+  };
+
+  if (endpoint.body && (endpoint.method === 'POST' || endpoint.method === 'PUT' || endpoint.method === 'PATCH')) {
+    options.body = JSON.stringify(endpoint.body);
+  Salvador  }
+
+  console.log(`\n🔥 Benchmarking: ${endpoint.name} (${options.method} ${endpoint.path})`);
+  console.log(`   Connections: ${runConnections}, Duration: ${runDuration}s`);
+
+  try {
+    const result = await autocannon(options);
+    
+    const metrics = {
+      name: endpoint.name,
+      path: endpoint.path,
+      method: options.method,
+      timestamp: new Date().toISOString(),
+      latency: {
+        p50: result.latency.p50,
+        p95: result.latency.p95,
+        p99: result.latency.p99,
+        min: result.latency.min,
+        max: result.latency.max,
+      },
+      throughput: {
