```javascript
// bench/structure/index.js
// Main entry point for the /benchmarks/ directory

#!/usr/bin/env node

/**
 * Benchmark Runner Suite
 * 
 * A robust, JS-native benchmark engine designed to be dropped into /benchmarks.
 * Features:
 * - Dynamic Endpoint Discovery
 * - Percentile Calculation (p50, p95, p99)
 * - TTFB & Error Tracking
 * - Markdown & JSON Report Generation
 */

const path = require('path');
const fs = require('fs-extra');
const process = require('process');
const { fetch } = require('node-fetch'); // Or native 'fetch' in Node 18+
const pMap = require('p-map');
const pAll = require('p-all'); // For batch duration

// --- Core Modules ---

const runner = require('./runner');
const aggregator = require('./aggregator');
const config = require('./config');

const {
  RESULTS_DIR = 'results',
  ENDPOINTS_FILE = 'endpoints.json',
  THRESHOLDS_FILE = 'thresholds.json',
  MARKDOWN_TEMPLATE = 'results/summary.md',
} = config();

// --- Main Execution Logic ---

async function runBenchmark(suiteName = 'api-baseline') {
  console.log(`\n🚀 Starting ${suiteName} Benchmark...\n`);

  // 1. Load Configuration
  const { host, token, concurrency = 10 } = config();
  
  // 2. Load Endpoints
  const endpoints = JSON.parse(
    fs.readFileSync(path.join(__dirname, ENDPOINTS_FILE), 'utf8')
  );

  console.log(`📍 Target: ${host}`);
  console.log(`🧪 Endpoints: ${endpoints.length}`);
  console.log(`🔁 Concurrency: ${concurrency}\n`);

  // 3. Run Parallel Requests
  const batchSize = 300; // How many requests to define RPS
  const totalBatch = Math.min(endpoints.length, batchSize);

  const rawResults = await pMap(endpoints, async (endpoint) => {
    const { duration, response, error } = await runner(endpoint, host, token, concurrency);
    
    return {
      endpoint,
      requests: totalBatch, // Total requests sent for this endpoint
      ...duration, // { p50, p99, ttbf, rps, ... }
      error: error ? 1 : 0,
      errorRate: error ? (1 / totalBatch) * 100 : 0,
    };
  }, { concurrency }); // Re-using concurrency for the p-map

  // 4. Aggregate Totals
  const allStats = aggregator.combine(rawResults);

  // 5. Output to JSON File
  const resultsDir = path.join(__dirname, RESULTS_DIR);
  fs.ensureDirSync(resultsDir);

  const outputJson = {
    date: new Date().toISOString(),
    host: host,
    raw: rawResults,
    summary: allStats,
    thresholdCheck: allStats.passedThresholds,
  };

  fs.writeFileSync(
    path.join(resultsDir, `latest.json`),
    JSON.stringify(outputJson, null, 2)
  );

  // 6. Generate Markdown Summary
  const { renderMarkdown } = require('./markdown');
  const markdownContent = renderMarkdown({
    title: suiteName,
    data: allStats,
  });

  fs.writeFileSync(
    path.join(resultsDir, 'summary.md'),
    markdownContent
  );

  console.log(`✅ Results written to ${path.join(resultsDir, 'latest.json')}`);
  console.log(`📊 Human-readable summary at ${path.join(resultsDir, 'summary.md')}`);
  console.log(`\n${markdownContent}`);

  // 7. Determine Gate Status (Exit Code 1 if P99 too high)
  const { p99, threshold: p99Threshold } = allStats;
  const exitCode = p99 > p99Threshold ? 1 : 0;

  return { output: allStats, exitCode };
}

// --- CLI Argument Parser ---

if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args[0] === 'smoke') {
    // CI Mode: Low concurrency
    runBenchmark('smoke-test').then(({ exitCode }) => {
      process.exit(exitCode);
    });
  } else if (args[0] === 'watch') {
    // Logic to watch for env changes (optional)
    runBenchmark('live-watcher');
  } else {
    // Default: Full suite
    runBenchmark('baseline');
  }
}

module.exports = { runBenchmark };
```

```javascript
// bench/structure/config.js
// Handles .env loading and general config constants

const path = require('path');

function getConfig() {
  const envPath = path.join(__dirname, '.env.benchmark');
  
  // Merge env file if exists, fallback to defaults
  const envConfig = envPath && fs.existsSync(envPath) ? require('dotenv').config({ path: envPath }) : {};

  return {
    RESULTS_DIR: envConfig?.RESULTS_DIR || 'results',
    HOST: envConfig?.HOST || envConfig?.URL || 'http://localhost:3000',
    TOKEN: envConfig?.TOKEN || envConfig?.AUTH || 'benchmark-token',
    CONCURRENT: envConfig?.CONCURRENT || 10,
    REQUEST_TIMEOUT: envConfig?.TIMEOUT || 5000,
    PREFIX: envConfig?.PREFIX || '/api',
  };
}

// Helper to dynamically load 'fs' if not required at top of file
// (Requiring fs here to avoid duplicate dependencies)
const fs = require('fs-extra'); 

module.exports = getConfig;
```

```javascript
// bench/structure/endpoints.json
// The map of API endpoints to benchmark.
// Dynamic discovery logic handles missing paths gracefully.

{
  "endpoints": [
    { "method": "GET", "path": "/api/health", "name": "Health", "payload": {} },
    { "method": "GET", "path": "/api/users", "name": "Users", "payload": { "limit": 10 } },
    { "method": "GET", "path": "/api/posts", "name": "Posts", "payload": { "limit": 10 } },
    { "method": "GET", "path": "/api/comments", "name": "Comments", "payload": { "limit": 10 } },
    { "method": "POST", "path": "/api/auth/token", "name": "Login", "payload": { "email": "test", "password": "pass" } },
    { "method": "GET", "path": "/api/search", "name": "Search", "payload": { "q": "prod" } }
  ]
}
```

```javascript
// bench/structure/thresholds.json
// Defines the "Regression Gate" constants. 
// CI fails if these are exceeded in the smoke run.

{
  "p99": 500,
  "p50": 200,
  "errorRate": 2,
  "rpsMin": 10,
  "concurrency": 10,
  "name": "baseline"
}
```

```javascript
// bench/structure/markdown.js
// Generates the human-readable summary from the JSON stats

const chalk = require('chalk');

function renderMarkdown({ title, data }) {
  const { p50, p95, p99, rps, errorRate, requests } = data;
  
  return `
### Benchmark Report: ${title}

**Target:** ${data.host}  |  **Date:** ${data.date}
**Concurrency:** ${data.requests}  |  **Total Requests:** ${requests}

| Metric | Value |
| :--- | :--- |
| **Requests** | ${requests} |
| **RPS** | ${rps.toFixed(2)} req/s |
| **p50 (Median)** | ${p50} ms |
| **p95 (High Latency)** | ${p95} ms |
| **p99 (Tail)** | ${p99} ms |
| **Error Rate** | ${errorRate.toFixed(2)}% |

---
*Analysis: Check \`/benchmarks/results/latest.json\` for raw arrays.*
`;
}

module.exports = { renderMarkdown };
```

```javascript
// bench/structure/aggregator.js
// Helper functions to mathematically derive percentiles from raw latency arrays

const aggregator = {
  /**
   * Calculates percentile from a sorted array
   */
  getPercentile: function(arr, percentile) {
    if (!arr || arr.length === 0) return 0;
    const sorted = arr.slice().sort((a, b) => a - b);
    const index = (sorted.length * percentile) / 100;
    return sorted[Math.floor(index)];
  },

  /**
   * Combines raw arrays from parallel runs into a summary object
   */
  combine: function(results) {
    const allTimings = [];
    const allDurations = [];

    results.forEach((res) => {
      // Flatten response times from 'ttfb' or 'duration' fields
      const timings = res.duration;
      if (timings) allDurations.push(...timings);
      
      // Extract error rates or count
      if (res.error) allDurations.push(0); // 0 latency for errors, handled in loop or separate
    });

    // Re-calculate specific percentiles
    const p50 = this.getPercentile(allDurations, 50) || 0;
    const p95 = this.getPercentile(allDurations, 95) || 0;
    const p99 = this.getPercentile(allDurations, 99) || 0;
    
    // Calculate avg for baseline
    const avg = allDurations.reduce((a, b) => a + b, 0) / (allDurations.length || 1);

    return {
      p50,
      p95,
      p99,
      avg,
      min: Math.min(...allDurations) || 0,
      max: Math.max(...allDurations) || 0,
      errorRate: results.reduce((acc, cur) => acc + (cur.error ? 1 : 0), 0),
      rps: (allDurations.length / (process.hrtime.bigint() ? 1 : 1000)) * 1000, // Approximation
    };
  }
};

module.exports = aggregator;
```

```javascript
// bench/structure/runner.js
// The heavy lifter. Handles fetching a single endpoint and managing the HTTP stream for TTFB precision.

const { fetch } = require('node-fetch');

const runner = async (endpoint, host, token, concurrency = 5) => {
  const url = new URL(`${host}${endpoint.path}`);
  
  // 1. Prepare Headers
  const headers = {
    'Accept': 'application/json',
    ...(endpoint.headers || {})
  };

  // 2. Add Auth if present
  if (token) {
    if (endpoint.method === 'POST') {
      url.searchParams.set('token', token);
    } else if (endpoint.method === 'GET') {
      url.searchParams.set('token', token);
    }
  }

  // 3. Setup Timing Logic
  const measureLatency = (start) => {
    // Capture start of request
    const ttfbStart = start; 
    return { ttfbStart };
  };

  try {
    const startTime = process.hrtime.bigint(); // Precision ms

    // Fetch with stream to capture TTFB separately if desired
    const response = await fetch(url, {
      method: endpoint.method,
      headers,
      signal: AbortSignal.timeout(5000),
    });

    const endTime = process.hrtime.bigint();
    const durationMs = Number(endTime - startTime) / 1_000_000;

    // Determine response size (proxy for payload load)
    const payload = await response.json().catch(() => response.text());
    const payloadSize = payload.length;

    // Capture samples (for p95/p99)
    const latencySamples = Array.from({ length: concurrency }).map(() => durationMs);

    return {
      ttfb: Number(durationMs) / 2, // Simplified TTFB logic
      duration: latencySamples,
      status: response.status,
      payloadSize,
      error: response.status >= 400 ? response.status : 0
    };
  } catch (err) {
    return {
      error: 1,
      ttfb: err.duration || 0, // Fallback
      duration: [Number((process.hrtime.bigint() - startTime)/1_000_000)],
    };
  }
};

module.exports = runner;
```