 ```diff
--- /dev/null
5c5
+ import { benchmarkRoutes } from "./routes/benchmarkRoutes.js";
5c5
+   app.use("/api/benchmark", benchmarkRoutes);
--- /dev/null
+++ b benchmarks/benchmark.js
@@ -0,0 +1,287 @@
+/**
+ * Benchmark Suite for FreelanceFlow API
+ * 
+ * Uses autocannon for load testing all /api/ endpoints.
+ * Run with: node benchmarks/benchmark.js
+ */
+
+const autocannon = require('autocannon');
+const fs = require('fs');
+const path = require('path');
+
+// Configuration
+const TARGET_HOST = process.env.BENCHMARK_HOST || 'http://localhost:3001';
+const CONCURRENCY = parseInt(process.env.BENCHMARK_CONCURRENCY, 10) || 10;
+const DURATION = parseInt(process.env.BENCHMARK_DURATION, 10) || 30;
+const CONNECTIONS = parseInt(process.env.BENCHMARK_CONNECTIONS, 10) || 10;
+
+// Auth token for protected routes
+const AUTH_TOKEN = process.env.BENCHMARK_AUTH_TOKEN || '';
+
+// Thresholds for regression gate
+const THRESHOLDS = {
+  p99Latency: parseInt(process.env.BENCHMARK_P99_THRESHOLD, 10) || 1000,
+  errorRate: parseFloat(process.env.BENCHMARK_ERROR_THRESHOLD) || 5.0,
+};
+
+// Results storage
+Cascade results = [];
+
+/**
+ * Run a single benchmark against an endpoint
+ */
+async function runBenchmark(name, method, path, body = null, headers = {}) {
+  console.log(`\n🔥 Benchmarking: ${name} (${method} ${path})`);
+  
+  const defaultHeaders = {
+    'Content-Type': 'application/json',
+  };
+  
+  if (AUTH_TOKEN) {
+    defaultHeaders['Authorization'] = `Bearer ${AUTH_TOKEN}`;
+  }
+  
+  const allHeaders = { ...defaultHeaders, ...headers };
+  
+  const options = {
+    url: `${TARGET_HOST}${path}`,
+    connections: CONNECTIONS,
+    duration: DURATION,
+    method: method,
+    headers: allHeaders,
+  };
+  
+  if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
+    options.body = JSON.stringify(body);
+  }
+  
+  return new Promise((resolve, reject) => {
+    const instance = autocannon(options, (err, result) => {
+      if (err) {
+        console.error(`Error benchmarking ${name}:`, err);
+        reject(err);
+        return;
+      }
+      
+      const metrics = {
+        name,
+        method,
+        path,
+        latency: {
+          p50: result.latency.p50,
+          p95: result.latency.p95,
+          p99: result.latency.p99,
+        },
+        rps: {
+          average: result.requests.average,
+          mean: result.requests.mean,
+        },
+        errorRate: result.errors / result.requests.total * 100 || 0,
+        ttfb: result.timings.wait,
+        totalRequests: result.requests.total,
+        totalErrors: result.errors,
+        throughput: result.throughput.mean,
+      };
+      
+      console.log(`  ✅ p50: ${metrics.latency.p50}ms | p95: ${metrics.latency.p95}ms | p99: ${metrics.latency.p99}ms`);
+      console.log(`  📊 RPS: ${metrics.rps.average} | Error Rate: ${metrics.errorRate.toFixed(2)}% | TTFB: ${metrics.ttfb}ms`);
+      
+      results.push(metrics);
+      resolve(metrics);
+    });
+    
+    // Track progress
+    autocannon.track(instance, { renderProgressBar: false, renderResultsTable: false });
+  });
+}
+
+/**
+ * Run all benchmarks
+ */
+async function runAllBenchmarks() {
+  console.log('🚀 Starting FreelanceFlow API Benchmark Suite');
+  console.log(`   Target: ${TARGET_HOST}`);
+  console.log(`   Connections: ${CONNECTIONS} | Concurrency: ${CONCURRENCY} | Duration: ${DURATION}s`);
+  console.log(`   P99 Threshold: ${THRESHOLDS.p99Latency}ms | Error Threshold: ${THRESHOLDS.errorRate}%`);
+  
+  const startTime = Date.now();
+  
+  // Health check (unprotected)
+  await runBenchmark('Health Check', 'GET', '/health');
+  
+  // Auth endpoints (unprotected)
+  await runBenchmark('Auth - Register', 'POST', '/api/auth/register', {
+    email: 'benchmark@test.com',
+    password: 'BenchmarkPass123!',
+    name: 'Benchmark User',
+    role: 'FREELANCER',
+  });
+  
+  await runBenchmark('Auth - Login', 'POST', '/api/auth/login', {
+    email: 'benchmark@test.com',
+    password: 'BenchmarkPass123!',
+  });
+  
+  // Public data endpoints
+  await runBenchmark('Jobs - List', 'GET', '/api/jobs?page=1&limit=20');
+  await runBenchmark('Jobs - Search', 'GET', '/api/search/jobs?q=web+developer');
+  await runBenchmark('Users - List Freelancers', 'GET', '/api/users?role=FREELANCER&page=1&limit=20');
+  
+  // Protected endpoints (require auth token)
+  if (AUTH_TOKEN) {
+    await runBenchmark('Jobs - Create', 'POST', '/api/jobs', {
+      title: 'Benchmark Job Posting',
+      description: 'This is a benchmark job description with realistic payload size. '.repeat(10),
+      budget: 5000,
+      category: 'Web Development',
+      skills: ['React', 'Node.js', 'TypeScript'],
+    });
+    
+    await runBenchmark('Proposals - List', 'GET', '/api/proposals');
+    await runBenchmark('Messages - List', 'GET', '/api/messages');
+    await runBenchmark('Notifications - List', 'GET', '/api/notifications');
+    await runBenchmark('Reviews - List', 'GET', '/api/reviews');
+    await runBenchmark('Payments - List', 'GET', '/api/payments');
+    await runBenchmark('Admin - Dashboard', 'GET', '/api/admin/dashboard');
+  } else {
+    console.log('\n⚠️  No BENCHMARK_AUTH_TOKEN provided. Skipping protected endpoints.');
+  }
+  
+  const endTime = Date.now();
+  const totalDuration = ((endTime - startTime) / 1000).toFixed(