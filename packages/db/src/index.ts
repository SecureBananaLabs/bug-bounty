# apps/api/src/benchmarks/autocannon.js
+ const autocannon = require('autocannon');
+ const { env } = require('../config/env');

# apps/api/src/benchmarks/index.js
+ const fs = require('fs');
+ const path = require('path');
+ const { exec } = require('child_process');

# apps/api/src/config/env.js
+ exports.env = {
+   BENCHMARK_HOST: process.env.BENCHMARK_HOST || 'http://localhost:3000',
+ };

# apps/api/src/tests/benchmark.test.js
+ const assert = require('assert').strict;
+ const { createApp } = require('../app');
+ const autocannon = require('autocannon');

# apps/api/src/middleware/rateLimit.js
+ const rateLimit = require('express-rate-limit');

# apps/api/src/routes/benchmarkRoutes.js
+ const express = require('express');
+ const router = express.Router();

# apps/api/package.json
+ "scripts": {
+   "benchmark": "node benchmarks/index.js"
+ }

# apps/api/benchmarks/results/
# (output directory for benchmark results)

# apps/api/benchmarks/thresholds.json
+ {
+   "p99": 500
+ }

# apps/api/src/config/benchmarkConfig.js
+ exports.benchmarkConfig = {
+   url: '/api',
+   auth: {
+     token: 'benchmark-token'
+   },
+   payload: {
+     size: '1kb'
+   },
+   concurrency: 10,
+   duration: 60
+ };

# apps/api/src/benchmarks/index.js
+ const { benchmarkConfig } = require('../config/benchmarkConfig');
+ const autocannon = require('autocannon');
+ const fs = require('fs');
+ const path = require('path');
+
+ autocannon({
+   url: benchmarkConfig.url,
+   headers: {
+     Authorization: `Bearer ${benchmarkConfig.auth.token}`
+   },
+   payload: Buffer.alloc(benchmarkConfig.payload.size, 'a'),
+   connections: benchmarkConfig.concurrency,
+   pipelining: 10,
+   duration: benchmarkConfig.duration
+ }, (err, results) => {
+   if (err) throw err;
+
+   fs.writeFileSync('results/results.json', JSON.stringify(results));
+   fs.writeFileSync('results/results.md', `
+ # Benchmark Results
+ ## p50 Latency: ${results.latency.p50} ms
+ ## p95 Latency: ${results.latency.p95} ms
+ ## p99 Latency: ${results.latency.p99} ms
+ ## Requests per Second: ${results.requests.average}
+ ## Error Rate: ${results.errors.average}%
+ ## Time to First Byte: ${results.ttfb.average} ms
+ `);
+ });

# apps/api/src/tests/benchmark.test.js
+ test('Benchmark API', async () => {
+   const app = createApp();
+   const server = app.listen(0);
+   await new Promise((resolve) => server.once('listening', resolve));
+   const { port } = server.address();
+
+   const autocannonInstance = autocannon({
+     url: `http://localhost:${port}/api`,
+     connections: 10,
+     pipelining: 10,
+     duration: 60
+   }, (err, results) => {
+     if (err) throw err;
+     assert.strictEqual(results.latency.p99, 500);
+   });
+ });

# apps/api/.env.benchmark
+ BENCHMARK_HOST=http://localhost:3000

# apps/api/benchmarks/results/results.json
# (output file for benchmark results)

# apps/api/benchmarks/results/results.md
# (output file for benchmark results in markdown format)

# CI configuration (e.g. GitHub Actions)
# .github/workflows/benchmark.yml
+ name: Benchmark
+ on: [push]
+ jobs:
+   benchmark:
+     runs-on: ubuntu-latest
+     steps:
+       - name: Checkout code
+         uses: actions/checkout@v2
+       - name: Install dependencies
+         run: npm install
+       - name: Run benchmark
+         run: npm run benchmark
+       - name: Check results
+         run: |
+           if [ $(jq '.latency.p99' results.json) -gt 500 ]; then
+             echo "Benchmark failed: p99 latency exceeded threshold"
+             exit 1
+           fi
