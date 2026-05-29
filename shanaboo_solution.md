```diff
--- /dev/null
+++ b/benchmarks/benchmark.js
@@ -0,0 +1,200 @@
+import autocannon from 'autocannon';
+import fs from 'fs';
+import path from 'path';
+import { fileURLToPath } from 'url';
+
+const __filename = fileURLToPath(import.meta.url);
+const __dirname = path.dirname(__filename);
+
+// Load environment variables
+const envPath = path.resolve(__dirname, '../.env.benchmark');
+if (fs.existsSync(envPath)) {
+  const envConfig = fs.readFileSync(envPath, 'utf8');
+  envConfig.split('\n').forEach(line => {
+    const [key, value] = line.split('=');
+    if (key && value) {
+      process.env[key.trim()] = value.trim();
+    }
+  });
+}
+
+const BASE_URL = process.env.BENCHMARK_HOST || 'http://localhost:3000';
+const BENCHMARK_TOKEN = process.env.BENCHMARK_TOKEN || 'test-token';
+
+// Define endpoints to benchmark
+const endpoints = [
+  { method: 'GET', path: '/api/auth/profile', auth: true },
+  { method: 'POST', path: '/api/auth/login', auth: false, body: { email: 'test@example.com', password: 'password123' } },
+  { method: 'GET', path: '/api/users', auth: true },
+  { method: 'GET', path: '/api/jobs', auth: false },
+  { method: 'POST', path: '/api/jobs', auth: true, body: { title: 'Test Job', description: 'Test Description', budget: 100 } },
+  { method: 'GET', path: '/api/proposals', auth: true },
+  { method: 'POST', path: '/api/proposals', auth: true, body: { jobId: 1, coverLetter: 'Test Proposal', price: 50 } },
+  { method: 'GET', path: '/api/payments', auth: true },
+  { method: 'GET', path: '/api/reviews', auth: false },
+  { method: 'GET', path: '/api/messages', auth: true },
+  { method: 'GET', path: '/api/notifications', auth: true },
+  { method: 'POST', path: '/api/search', auth: false, body: { query: 'developer' } },
+  { method: 'GET', path: '/api/admin/stats', auth: true }
+];
+
+// Load thresholds
+const thresholdsPath = path.resolve(__dirname, 'thresholds.json');
+let thresholds = {};
+if (fs.existsSync(thresholdsPath)) {
+  thresholds = JSON.parse(fs.readFileSync(thresholdsPath, 'utf8'));
+}
+
+// Benchmark configuration
+const defaultConfig = {
+  connections: 10,
+  pipelining: 1,
+  duration: 10,
+  timeout: 10
+};
+
+// Run benchmark for a single endpoint
+function runBenchmark(endpoint) {
+  return new Promise((resolve) => {
+    const headers = {};
+    if (endpoint.auth) {
+      headers['Authorization'] = `Bearer ${BENCHMARK_TOKEN}`;
+    }
+
+    const config = {
+      ...defaultConfig,
+      url: `${BASE_URL}${endpoint.path}`,
+      method: endpoint.method,
+      headers,
+      ...(endpoint.body && { body: JSON.stringify(endpoint.body) })
+    };
+
+    const instance = autocannon(config, (err, result) => {
+      if (err) {
+        console.error(`Error benchmarking ${endpoint.path}:`, err);
+        resolve(null);
+        return;
+      }
+      
+      resolve({
+        endpoint: endpoint.path,
+        method: endpoint.method,
+        requests: {
+          average: result.requests.average,
+          total: result.requests.total
+        },
+        latency: {
+          average: result.latency.average,
+          p50: result.latency.p50,
+          p95: result.latency.p95,
+          p99: result.latency.p99
+        },
+        throughput: {
+          average: result.throughput.average,
+          total: result.throughput.total
+        },
+        errors: {
+          total: result.errors,
+          rate: result.requests.total > 0 ? (result.errors / result.requests.total) * 100 : 0
+        },
+        timeouts: result.timeouts,
+        duration: result.duration,
+        start: result.start,
+        finish: result.finish
+      });
+    });
+
+    autocannon.track(instance, { renderResultsTable: false });
+  });
+}
+
+// Run benchmarks for all endpoints
+async function runAllBenchmarks() {
+  console.log(`Starting benchmarks against ${BASE_URL}`);
+  const results = [];
+  
+  for (const endpoint of endpoints) {
+    console.log(`Benchmarking ${endpoint.method} ${endpoint.path}...`);
+    const result = await runBenchmark(endpoint);
+    if (result) {
+      results.push(result);
+    }
+  }
+  
+  return results;
+}
+
+// Save results to JSON file
+function saveResultsToJson(results) {
+  const outputPath = path.resolve(__dirname, 'results', 'benchmark-results.json');
+  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
+  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
+  console.log(`Results saved to ${outputPath}`);
+}
+
+// Generate markdown report
+function generateMarkdownReport(results) {
+  let markdown = `# API Benchmark Results\n\n`;
+  markdown += `Benchmarked against: ${BASE_URL}\n\n`;
+  markdown += `| Endpoint | Method | RPS (avg) | p50 (ms) | p95 (ms) | p99 (ms) | Error Rate (%) | TTFB Avg (ms) |\n`;
+  markdown += `|----------|--------|-----------|---------|---------|---------|----------------|---------------|\n`;
+  
+  results.forEach(result => {
+    markdown += `| ${result.endpoint} | ${result.method} | ${result.requests.average.toFixed(2)} | ${result.latency.p50.toFixed(2)} | ${result.latency.p95.toFixed(2)} | ${result.latency.p99.toFixed(2)} | ${result.errors.rate.toFixed(2)} | ${result.latency.average.toFixed(2)} |\n`;
+  });
+  
+  const outputPath = path.resolve(__dirname, 'results', 'benchmark-report.md');
+  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
+  fs.writeFileSync(outputPath, markdown);
+  console.log(`