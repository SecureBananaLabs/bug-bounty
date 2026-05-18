# Create a new directory for benchmarks
diff --git a/benchmarks b/benchmarks
new file mode 100644
index 0000000..0000000
--- /dev/null
+++ b/benchmarks

# Create a new file for benchmarking setup
diff --git a/benchmarks/setup.js b/benchmarks/setup.js
new file mode 100644
index 0000000..7f3f4ab
--- /dev/null
+++ b/benchmarks/setup.js
@@ -0,0 +1,14 @@
+const autocannon = require('autocannon');
+const { createApp } = require('../apps/api/src/app.js');
+
+async function setupBenchmark() {
+  const app = createApp();
+  const server = app.listen(0);
+  await new Promise((resolve, reject) => {
+    server.once('listening', resolve);
+    server.once('error', reject);
+  });
+  const port = server.address().port;
+  return `http://127.0.0.1:${port}`;
+}
+
+module.exports = setupBenchmark;

# Create a new file for running the benchmark
diff --git a/benchmarks/run.js b/benchmarks/run.js
new file mode 100644
index 0000000..c943b5a
--- /dev/null
+++ b/benchmarks/run.js
@@ -0,0 +1,29 @@
+const autocannon = require('autocannon');
+const setupBenchmark = require('./setup.js');
+const fs = require('fs');
+const path = require('path');
+
+async function runBenchmark() {
+  const url = await setupBenchmark();
+  const endpoints = [
+    '/api/health',
+    '/api/users',
+    '/api/jobs',
+    '/api/proposals',
+    '/api/payments',
+  ];
+
+  const results = {};
+  for (const endpoint of endpoints) {
+    const result = await autocannon({
+      url: `${url}${endpoint}`,
+      connections: 100,
+      pipelining: 10,
+      duration: 60,
+    });
+    results[endpoint] = result;
+  }
+
+  fs.writeFileSync('results.json', JSON.stringify(results));
+  const markdown = Object.keys(results).map((endpoint) => {
+    const result = results[endpoint];
+    return `### ${endpoint}\n` +
+           `* p50 latency: ${result.latency.mean}\n` +
+           `* p95 latency: ${result.latency['95']}\n` +
+           `* p99 latency: ${result.latency['99']}\n` +
+           `* Requests per second: ${result.requests.mean}\n` +
+           `* Error rate: ${result.errorRate}\n` +
+           `* Time to first byte: ${result.ttfb.mean}\n`;
+  }).join('\n');
+  fs.writeFileSync('results.md', markdown);
+}
+
+runBenchmark();

# Add a new script to package.json
diff --git a/package.json b/package.json
index 7f3f4ab..8c9d4a5 100644
--- a/package.json
+++ b/package.json
@@ -12,6 +12,7 @@
   "scripts": {
     "start": "node apps/api/src/server.js",
+    "benchmark": "node benchmarks/run.js",
     "test": "node apps/api/src/tests/health.test.js"
   },
@@ -23,4 +24,4 @@
 
-}
\ No newline at end of file
+}
\ No newline at end of file

# Update autocannon package
diff --git a/package.json b/package.json
index 8c9d4a5..5c7d6a2 100644
--- a/package.json
+++ b/package.json
@@ -10,6 +10,7 @@
   "dependencies": {
+    "autocannon": "^6.4.4",
     "cors": "^2.8.5",
     "express": "^4.17.1",
     "helmet": "^4.6.0",
@@ -20,4 +21,4 @@
 
-}
\ No newline at end of file
+}
\ No newline at end of file
