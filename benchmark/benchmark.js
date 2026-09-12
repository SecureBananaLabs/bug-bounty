#!/usr/bin/env node

/**
 * API Benchmark Suite — Benchmark APIs with p50, p95, p99, RPS, error rate, TTFB
 *
 * Usage:
 *   1. Start the API server: npm run dev -w apps/api
 *   2. Run: node benchmark/benchmark.js
 *
 * Requirements: Node.js 18+ (no external dependencies needed)
 */

import http from 'node:http';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const CONCURRENCY = parseInt(process.env.CONCURRENCY || '10', 10);
const REQUESTS_PER_ENDPOINT = parseInt(process.env.REQUESTS || '100', 10);
const TIMEOUT_MS = 10_000;

// ============================================
// Endpoint definitions
// ============================================
const ENDPOINTS = [
  { method: 'GET',  path: '/health',                label: 'Health Check' },
  { method: 'POST', path: '/api/auth/register',     label: 'Auth Register',   body: { email: 'bench@test.com', password: 'Bench123!', role: 'freelancer' } },
  { method: 'POST', path: '/api/auth/login',        label: 'Auth Login',      body: { email: 'bench@test.com', password: 'Bench123!' } },
  { method: 'GET',  path: '/api/jobs',              label: 'List Jobs' },
  { method: 'GET',  path: '/api/jobs/1',            label: 'Get Job' },
  { method: 'GET',  path: '/api/users',             label: 'List Users' },
  { method: 'GET',  path: '/api/proposals',         label: 'List Proposals' },
  { method: 'GET',  path: '/api/payments',          label: 'List Payments' },
  { method: 'GET',  path: '/api/reviews',           label: 'List Reviews' },
  { method: 'GET',  path: '/api/messages',          label: 'List Messages' },
  { method: 'GET',  path: '/api/notifications',     label: 'List Notifications' },
  { method: 'GET',  path: '/api/search',            label: 'Search' },
  { method: 'GET',  path: '/api/admin/health',      label: 'Admin Health' },
];

// ============================================
// Benchmark engine
// ============================================
function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: { 'Content-Type': 'application/json' },
      timeout: TIMEOUT_MS,
    };

    const start = process.hrtime.bigint();

    const req = http.request(options, (res) => {
      const ttfbStart = process.hrtime.bigint();
      let data = '';
      res.on('data', (chunk) => { data += chunk.toString(); });
      res.on('end', () => {
        const end = process.hrtime.bigint();
        const ttfb = Number(ttfbStart - start) / 1e6; // ms
        const total = Number(end - start) / 1e6;       // ms
        const status = res.statusCode;
        const size = Buffer.byteLength(data);

        resolve({
          status,
          total,
          ttfb,
          size,
          ok: status >= 200 && status < 500,
        });
      });
    });

    req.on('error', (err) => {
      resolve({ status: 0, total: TIMEOUT_MS, ttfb: TIMEOUT_MS, size: 0, ok: false, error: err.message });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ status: 0, total: TIMEOUT_MS, ttfb: TIMEOUT_MS, size: 0, ok: false, error: 'timeout' });
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
}

function formatMs(ms) {
  if (ms < 1) return `${(ms * 1000).toFixed(1)}μs`;
  if (ms < 1000) return `${ms.toFixed(2)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function bold(text) { return `\x1b[1m${text}\x1b[0m`; }
function green(text) { return `\x1b[32m${text}\x1b[0m`; }
function yellow(text) { return `\x1b[33m${text}\x1b[0m`; }
function red(text) { return `\x1b[31m${text}\x1b[0m`; }
function cyan(text) { return `\x1b[36m${text}\x1b[0m`; }

// ============================================
// Main
// ============================================
async function runBenchmark() {
  console.log('\n' + '='.repeat(80));
  console.log(bold(cyan('  🚀 API BENCHMARK SUITE')));
  console.log('='.repeat(80));
  console.log(`  Target:        ${BASE_URL}`);
  console.log(`  Concurrency:   ${CONCURRENCY}`);
  console.log(`  Requests/EP:   ${REQUESTS_PER_ENDPOINT}`);
  console.log(`  Total reqs:    ${REQUESTS_PER_ENDPOINT * ENDPOINTS.length}`);
  console.log(`  Timeout:       ${TIMEOUT_MS}ms`);
  console.log('='.repeat(80));

  const startTime = Date.now();
  const allResults = [];

  for (const ep of ENDPOINTS) {
    console.log(`\n${bold(`📡 ${ep.label}`)} (${ep.method} ${ep.path})`);

    const promises = [];
    for (let i = 0; i < REQUESTS_PER_ENDPOINT; i++) {
      promises.push(makeRequest(ep.method, ep.path, ep.body));
    }

    // Process in batches for concurrency control
    const results = [];
    for (let i = 0; i < promises.length; i += CONCURRENCY) {
      const batch = promises.slice(i, i + CONCURRENCY);
      const batchResults = await Promise.all(batch);
      results.push(...batchResults);
    }

    // Analysis
    const success = results.filter(r => r.status >= 200 && r.status < 300);
    const failures = results.filter(r => r.status >= 400 || r.status === 0);
    const errors = results.filter(r => r.status === 0);
    const latencies = results.map(r => r.total).sort((a, b) => a - b);
    const ttfbValues = results.map(r => r.ttfb).sort((a, b) => a - b);

    const p50 = percentile(latencies, 50);
    const p95 = percentile(latencies, 95);
    const p99 = percentile(latencies, 99);
    const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    const minLatency = latencies[0];
    const maxLatency = latencies[latencies.length - 1];
    const ttfb50 = percentile(ttfbValues, 50);
    const rps = REQUESTS_PER_ENDPOINT / (latencies.reduce((a, b) => a + b, 0) / 1000 / results.length);

    const endpointResult = {
      label: ep.label,
      path: `${ep.method} ${ep.path}`,
      requests: results.length,
      success: success.length,
      failures: failures.length,
      errors: errors.length,
      successRate: ((success.length / results.length) * 100).toFixed(1),
      p50: formatMs(p50),
      p95: formatMs(p95),
      p99: formatMs(p99),
      avgMs: avgLatency.toFixed(2) + 'ms',
      minMs: formatMs(minLatency),
      maxMs: formatMs(maxLatency),
      ttfb50: formatMs(ttfb50),
      rps: rps.toFixed(0),
      statusCodes: {},
    };

    // Collect status codes
    for (const r of results) {
      const code = r.status.toString();
      endpointResult.statusCodes[code] = (endpointResult.statusCodes[code] || 0) + 1;
    }

    allResults.push(endpointResult);

    // Print inline result
    const statusColor = endpointResult.successRate >= 90 ? green : (endpointResult.successRate >= 70 ? yellow : red);
    console.log(`    ${statusColor(`✓ ${endpointResult.successRate}% success`)}\x1b[0m` +
                `  |  p50: ${cyan(endpointResult.p50)}\x1b[0m` +
                `  |  p95: ${yellow(endpointResult.p95)}\x1b[0m` +
                `  |  p99: ${red(endpointResult.p99)}\x1b[0m` +
                `  |  RPS: ${cyan(endpointResult.rps)}\x1b[0m` +
                `  |  TTFB(50): ${endpointResult.ttfb50}`);
    console.log(`    Statuses: ${JSON.stringify(endpointResult.statusCodes)}`);
  }

  // ============================================
  // Summary Report
  // ============================================
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('\n' + '='.repeat(80));
  console.log(bold(green('  📊 BENCHMARK SUMMARY')));
  console.log('='.repeat(80));

  console.log(`  ${bold('Date:')}       ${new Date().toISOString()}`);
  console.log(`  ${bold('Duration:')}    ${elapsed}s`);
  console.log(`  ${bold('Env:')}        ${process.env.NODE_ENV || 'N/A'}`);
  console.log(`  ${bold('Node:')}       ${process.version}`);
  console.log(`  ${bold('Platform:')}   ${process.platform} ${process.arch}`);
  console.log();

  // Table header
  const header = `${'Endpoint'.padEnd(22)} ${'Success'.padEnd(8)} ${'p50'.padEnd(10)} ${'p95'.padEnd(10)} ${'p99'.padEnd(10)} ${'RPS'.padEnd(8)} ${'TTFB50'.padEnd(10)}`;
  console.log(bold(header));
  console.log('─'.repeat(80));

  for (const r of allResults) {
    const name = r.label.substring(0, 20).padEnd(22);
    const success = `${r.successRate}%`.padEnd(8);
    const line = `${name} ${success} ${r.p50.padEnd(10)} ${r.p95.padEnd(10)} ${r.p99.padEnd(10)} ${r.rps.padEnd(8)} ${r.ttfb50.padEnd(10)}`;
    const color = parseFloat(r.successRate) >= 90 ? '' : yellow;
    console.log(color + line + '\x1b[0m');
  }

  // ============================================
  // Recommendations
  // ============================================
  console.log('\n' + '='.repeat(80));
  console.log(bold(cyan('  💡 BOTTLENECK ANALYSIS & RECOMMENDATIONS')));
  console.log('='.repeat(80));

  // Find slowest endpoints
  const sortedByP99 = [...allResults].sort((a, b) => {
    const aMs = parseFloat(a.p99);
    const bMs = parseFloat(b.p99);
    return bMs - aMs;
  });

  const slowest = sortedByP99.slice(0, 3);
  if (slowest.length > 0) {
    console.log(`\n  ${bold('🐢 Top 3 Slowest Endpoints (p99):')}`);
    for (const s of slowest) {
      console.log(`    - ${s.path}  →  p99: ${red(s.p99)}\x1b[0m`);
    }
  }

  // Find failure-prone endpoints
  const failing = allResults.filter(r => parseFloat(r.successRate) < 100);
  if (failing.length > 0) {
    console.log(`\n  ${bold('⚠️  Endpoints with Failed Requests:')}`);
    for (const f of failing) {
      console.log(`    - ${f.path}  →  ${f.failures} failures (${100 - parseFloat(f.successRate)}% error rate)`);
    }
  }

  console.log(`\n  ${bold('📝 To re-run:')}  npm run benchmark`);
  console.log();
  console.log('  Run on every deployment to detect regressions.');
  console.log('='.repeat(80));
  console.log();
}

runBenchmark().catch(console.error);