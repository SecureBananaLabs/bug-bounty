#!/usr/bin/env node
/**
 * API Benchmark Suite for SecureBananaLabs/bug-bounty
 * Uses autocannon for HTTP benchmarking.
 * 
 * Usage:
 *   TARGET_URL=http://localhost:3000 node run.js
 *   node run.js --ci          # CI mode (low concurrency, fail on threshold)
 *   node run.js --help        # Show options
 */

const autocannon = require('autocannon');
const fs = require('fs');
const path = require('path');

// === Config ===
const TARGET = process.env.TARGET_URL || 'http://localhost:3000';
const CONCURRENCY = parseInt(process.env.CONCURRENCY) || 10;
const DURATION = parseInt(process.env.DURATION_SECONDS) || 30;
const TOKEN = process.env.BENCHMARK_TOKEN || '';
const IS_CI = process.argv.includes('--ci');
const RESULTS_DIR = path.join(__dirname, '..', 'results');

const ENDPOINTS = [
  { name: 'GET /', method: 'GET', path: '/' },
  { name: 'GET /api/health', method: 'GET', path: '/api/health' },
];

// Auth-protected endpoints (use token if available)
if (TOKEN) {
  ENDPOINTS.push(
    { name: 'GET /api/data', method: 'GET', path: '/api/data', headers: { Authorization: `Bearer ${TOKEN}` } },
    { name: 'POST /api/data', method: 'POST', path: '/api/data', headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ test: true }) },
  );
}

async function runBenchmark(endpoint) {
  const opts = {
    url: `${TARGET}${endpoint.path}`,
    method: endpoint.method,
    connections: IS_CI ? 5 : CONCURRENCY,
    duration: IS_CI ? 10 : DURATION,
    headers: endpoint.headers || {},
    body: endpoint.body,
    timeout: 30,
    bailout: IS_CI ? 3 : undefined, // stop early if 3 errors in CI
  };

  return new Promise((resolve, reject) => {
    autocannon(opts, (err, result) => {
      if (err) return reject(err);
      resolve({
        endpoint: endpoint.name,
        method: endpoint.method,
        path: endpoint.path,
        timestamp: new Date().toISOString(),
        latency: {
          p50: result.latency.p50,
          p95: result.latency.p95,
          p99: result.latency.p99,
          average: result.latency.average,
          max: result.latency.max,
          min: result.latency.min,
        },
        requests: {
          total: result.requests.total,
          sent: result.requests.sent,
          average: result.requests.average,
          max: result.requests.max,
          throughput: result.throughput,
        },
        errors: result.errors,
        timeouts: result.timeouts,
        duration: result.duration,
        non2xx: result.non2xx,
        '1xx': result['1xx'],
        '2xx': result['2xx'],
        '3xx': result['3xx'],
        '4xx': result['4xx'],
        '5xx': result['5xx'],
        statusCodes: result.statusCodes,
      });
    });
  });
}

function checkThresholds(results) {
  const thresholds = JSON.parse(fs.readFileSync(path.join(__dirname, 'thresholds.json'), 'utf8'));
  const failures = [];

  for (const r of results) {
    // Check endpoint-specific thresholds
    const epThreshold = thresholds.endpoints[r.path];
    if (epThreshold && r.latency.p99 > epThreshold.p99_max_ms) {
      failures.push(`${r.path}: p99 ${r.latency.p99}ms > threshold ${epThreshold.p99_max_ms}ms`);
    }

    // Check global thresholds
    if (r.latency.p99 > thresholds.global.p99_max_ms) {
      failures.push(`GLOBAL ${r.path}: p99 ${r.latency.p99}ms > max ${thresholds.global.p99_max_ms}ms`);
    }

    const errorRate = r.errors / r.requests.total * 100;
    if (errorRate > thresholds.global.error_rate_max_pct) {
      failures.push(`${r.path}: error rate ${errorRate.toFixed(2)}% > max ${thresholds.global.error_rate_max_pct}%`);
    }
  }
  return failures;
}

function generateMarkdown(results, failures) {
  let md = `# API Benchmark Results\n\n`;
  md += `**Target:** ${TARGET}\n`;
  md += `**Date:** ${new Date().toISOString()}\n`;
  md += `**Concurrency:** ${IS_CI ? 5 : CONCURRENCY}\n`;
  md += `**Duration:** ${IS_CI ? 10 : DURATION}s\n\n`;
  md += `## Endpoint Results\n\n`;
  md += `| Endpoint | p50 (ms) | p95 (ms) | p99 (ms) | Avg (ms) | Req/s | Errors | Status |\n`;
  md += `|----------|---------|---------|---------|---------|-------|--------|--------|\n`;

  for (const r of results) {
    const passed = !failures.some(f => f.includes(r.path));
    md += `| ${r.endpoint} | ${r.latency.p50.toFixed(1)} | ${r.latency.p95.toFixed(1)} | ${r.latency.p99.toFixed(1)} | ${r.latency.average.toFixed(1)} | ${r.requests.average.toFixed(0)} | ${r.errors} | ${passed ? '✅' : '❌'} |\n`;
  }

  if (failures.length > 0) {
    md += `\n## Threshold Failures\n\n`;
    for (const f of failures) {
      md += `- ❌ ${f}\n`;
    }
    md += `\n`;
  }

  md += `\n## Environment\n\n`;
  md += `- **Node.js:** ${process.version}\n`;
  md += `- **Platform:** ${process.platform}\n`;

  return md;
}

async function main() {
  console.log(`🚀 Benchmark Suite - ${TARGET}`);
  console.log(`   Concurrency: ${IS_CI ? 5 : CONCURRENCY}, Duration: ${IS_CI ? 10 : DURATION}s\n`);

  // Create results directory
  if (!fs.existsSync(RESULTS_DIR)) {
    fs.mkdirSync(RESULTS_DIR, { recursive: true });
  }

  const results = [];
  for (const ep of ENDPOINTS) {
    process.stdout.write(`   Testing ${ep.name}... `);
    try {
      const result = await runBenchmark(ep);
      results.push(result);
      console.log(`p50=${result.latency.p50.toFixed(1)}ms  p99=${result.latency.p99.toFixed(1)}ms  req/s=${result.requests.average.toFixed(0)}`);
    } catch (err) {
      console.log(`FAILED: ${err.message}`);
    }
  }

  // Check thresholds
  const failures = checkThresholds(results);

  // Generate outputs
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const jsonPath = path.join(RESULTS_DIR, `benchmark-${timestamp}.json`);
  const mdPath = path.join(RESULTS_DIR, `benchmark-${timestamp}.md`);

  fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2));
  fs.writeFileSync(mdPath, generateMarkdown(results, failures));

  console.log(`\n📊 Results written to:`);
  console.log(`   JSON: ${jsonPath}`);
  console.log(`   MD:   ${mdPath}`);

  // Exit with error code in CI mode if thresholds fail
  if (IS_CI && failures.length > 0) {
    console.error(`\n❌ ${failures.length} threshold failure(s) detected!`);
    failures.forEach(f => console.error(`   - ${f}`));
    process.exit(1);
  }

  console.log(`\n✅ Benchmark complete.`);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
