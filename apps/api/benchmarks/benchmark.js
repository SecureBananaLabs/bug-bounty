#!/usr/bin/env node

/**
 * API Benchmark Suite
 * ====================
 * Measures: p50, p95, p99 latency, RPS, error rate, TTFB
 *
 * Part of SecureBananaLabs bug-bounty Issue #30 ($750 bounty)
 * Benchmarks the FreelanceFlow API endpoints.
 */

import http from 'node:http';
import { performance } from 'node:perf_hooks';
import { appendFileSync, writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from 'node:process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RESULTS_DIR = resolve(__dirname, 'results');
const THRESHOLDS_PATH = resolve(__dirname, 'thresholds.json');
const CI_MODE = env.BENCHMARK_CI_MODE === 'true' || env.BENCHMARK_CI_MODE === '1';
const CONFIG = {
  baseUrl: env.BENCHMARK_URL || 'http://localhost:3000',
  concurrency: parseInt(env.BENCHMARK_CONCURRENCY || (CI_MODE ? '5' : '10'), 10),
  totalRequests: parseInt(env.BENCHMARK_REQUESTS || (CI_MODE ? '100' : '500'), 10),
  warmupRequests: parseInt(env.BENCHMARK_WARMUP || (CI_MODE ? '10' : '50'), 10),
  timeout: parseInt(env.BENCHMARK_TIMEOUT || '10000', 10),
  authToken: env.BENCHMARK_AUTH_TOKEN || '',
};

/**
 * API endpoints to benchmark (key = label, value = { method, path })
 */
const ENDPOINTS = {
  'Health Check':    { method: 'GET',    path: '/health' },
  'Auth Login':      { method: 'POST',   path: '/api/auth/login',    body: { email: 'test@example.com', password: 'password123' } },
  'Auth Register':   { method: 'POST',   path: '/api/auth/register', body: { email: `bench_${Date.now()}@test.com`, password: 'Password123!', name: 'Bench User', role: 'freelancer' } },
  'List Jobs':       { method: 'GET',    path: '/api/jobs' },
  'List Proposals':  { method: 'GET',    path: '/api/proposals' },
  'List Users':      { method: 'GET',    path: '/api/users' },
  'Search':          { method: 'GET',    path: '/api/search?q=developer' },
  'Notifications':   { method: 'GET',    path: '/api/notifications' },
  'Messages':        { method: 'GET',    path: '/api/messages' },
  'Reviews':         { method: 'GET',    path: '/api/reviews' },
};

function makeRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, CONFIG.baseUrl);
    const ttfbStart = performance.now();

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'BenchmarkSuite/1.0',
      },
      timeout: CONFIG.timeout,
    };

    if (CONFIG.authToken) {
      options.headers['Authorization'] = `Bearer ${CONFIG.authToken}`;
    }

    const req = http.request(options, (res) => {
      const ttfb = performance.now() - ttfbStart;
      let data = '';
      const start = performance.now();

      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const duration = performance.now() - start;
        resolve({
          status: res.statusCode,
          ttfb,
          duration,
          totalTime: ttfb + duration,
          bodyLength: data.length,
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ status: 0, ttfb: CONFIG.timeout, duration: CONFIG.timeout, totalTime: CONFIG.timeout, bodyLength: 0, error: 'timeout' });
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

function percentile(sorted, p) {
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(idx, sorted.length - 1))];
}

async function benchmarkEndpoint(label, endpoint) {
  console.log(`\n  Benchmarking: ${label} (${endpoint.method} ${endpoint.path})`);

  const latencies = [];
  const ttfbValues = [];
  let errors = 0;
  let timeouts = 0;

  // Warmup
  console.log(`    Warmup: ${CONFIG.warmupRequests} requests...`);
  const warmupPromises = [];
  for (let i = 0; i < CONFIG.warmupRequests; i++) {
    warmupPromises.push(makeRequest(endpoint.method, endpoint.path, endpoint.body));
  }
  await Promise.all(warmupPromises);

  // Actual benchmark
  const startTime = performance.now();
  const requestPromises = [];

  for (let i = 0; i < CONFIG.totalRequests; i++) {
    const p = makeRequest(endpoint.method, endpoint.path, endpoint.body)
      .then((result) => {
        if (result.status >= 400) errors++;
        if (result.error === 'timeout') timeouts++;
        latencies.push(result.totalTime);
        ttfbValues.push(result.ttfb);
      })
      .catch(() => { errors++; });
    requestPromises.push(p);

    // Simple concurrency control: batch in groups
    if (requestPromises.length >= CONFIG.concurrency) {
      await Promise.all(requestPromises);
      requestPromises.length = 0;
    }
  }
  // Flush remaining
  if (requestPromises.length > 0) {
    await Promise.all(requestPromises);
  }

  const totalDuration = (performance.now() - startTime) / 1000; // seconds
  const totalSuccessful = CONFIG.totalRequests - errors;
  const rps = totalSuccessful / totalDuration;

  latencies.sort((a, b) => a - b);
  ttfbValues.sort((a, b) => a - b);

  const result = {
    label,
    method: endpoint.method,
    path: endpoint.path,
    totalRequests: CONFIG.totalRequests,
    successful: totalSuccessful,
    errors,
    timeouts,
    duration_seconds: totalDuration.toFixed(2),
    rps: rps.toFixed(2),
    latency_ms: {
      min: latencies.length > 0 ? latencies[0].toFixed(2) : 'N/A',
      p50: latencies.length > 0 ? percentile(latencies, 50).toFixed(2) : 'N/A',
      p75: latencies.length > 0 ? percentile(latencies, 75).toFixed(2) : 'N/A',
      p90: latencies.length > 0 ? percentile(latencies, 90).toFixed(2) : 'N/A',
      p95: latencies.length > 0 ? percentile(latencies, 95).toFixed(2) : 'N/A',
      p99: latencies.length > 0 ? percentile(latencies, 99).toFixed(2) : 'N/A',
      max: latencies.length > 0 ? latencies[latencies.length - 1].toFixed(2) : 'N/A',
      avg: latencies.length > 0 ? (latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(2) : 'N/A',
    },
    ttfb_ms: {
      min: ttfbValues.length > 0 ? ttfbValues[0].toFixed(2) : 'N/A',
      p50: ttfbValues.length > 0 ? percentile(ttfbValues, 50).toFixed(2) : 'N/A',
      p95: ttfbValues.length > 0 ? percentile(ttfbValues, 95).toFixed(2) : 'N/A',
      p99: ttfbValues.length > 0 ? percentile(ttfbValues, 99).toFixed(2) : 'N/A',
      avg: ttfbValues.length > 0 ? (ttfbValues.reduce((a, b) => a + b, 0) / ttfbValues.length).toFixed(2) : 'N/A',
    },
    error_rate_pct: ((errors / CONFIG.totalRequests) * 100).toFixed(2),
  };

  // Print results
  console.log(`    Results (${CONFIG.totalRequests} requests, ${CONFIG.concurrency} concurrent):`);
  console.log(`      Duration: ${result.duration_seconds}s | RPS: ${result.rps} | Errors: ${errors} (${result.error_rate_pct}%)`);
  console.log(`      Latency (ms): p50=${result.latency_ms.p50} | p95=${result.latency_ms.p95} | p99=${result.latency_ms.p99} | avg=${result.latency_ms.avg} | max=${result.latency_ms.max}`);
  console.log(`      TTFB (ms):    p50=${result.ttfb_ms.p50} | p95=${result.ttfb_ms.p95} | p99=${result.ttfb_ms.p99} | avg=${result.ttfb_ms.avg}`);

  return result;
}

async function runBenchmarkSuite() {
  console.log('='.repeat(70));
  console.log('  FREELANCEFLOW API BENCHMARK SUITE');
  console.log('='.repeat(70));
  console.log(`  Target: ${CONFIG.baseUrl}`);
  console.log(`  Concurrency: ${CONFIG.concurrency}`);
  console.log(`  Requests per endpoint: ${CONFIG.totalRequests}`);
  console.log(`  Warmup: ${CONFIG.warmupRequests} requests`);
  console.log('='.repeat(70));

  const allResults = [];

  for (const [label, endpoint] of Object.entries(ENDPOINTS)) {
    try {
      const result = await benchmarkEndpoint(label, endpoint);
      allResults.push(result);
    } catch (err) {
      console.error(`  FAILED: ${label} - ${err.message}`);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('  SUMMARY');
  console.log('='.repeat(70));
  console.log(`  ${'Endpoint'.padEnd(25)} ${'RPS'.padEnd(8)} ${'p50'.padEnd(8)} ${'p95'.padEnd(8)} ${'p99'.padEnd(8)} ${'TTFB(p50)'.padEnd(10)} ${'Err%'.padEnd(6)}`);
  console.log('  ' + '-'.repeat(70));

  for (const r of allResults) {
    console.log(`  ${r.label.padEnd(25)} ${r.rps.padEnd(8)} ${r.latency_ms.p50.padEnd(8)} ${r.latency_ms.p95.padEnd(8)} ${r.latency_ms.p99.padEnd(8)} ${r.ttfb_ms.p50.padEnd(10)} ${r.error_rate_pct.padEnd(6)}%`);
  }

  // Export results as JSON
  if (!existsSync(RESULTS_DIR)) {
    mkdirSync(RESULTS_DIR, { recursive: true });
  }
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputPath = resolve(RESULTS_DIR, `benchmark-${timestamp}.json`);
  writeFileSync(outputPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    config: CONFIG,
    results: allResults,
  }, null, 2));
  console.log(`\n  Results saved to: ${outputPath}`);

  // Also generate a markdown report
  const mdPath = resolve(RESULTS_DIR, `benchmark-${timestamp}.md`);
  const mdLines = [];
  mdLines.push('# API Benchmark Results');
  mdLines.push('');
  mdLines.push(`**Date:** ${new Date().toISOString()}`);
  mdLines.push(`**Target:** ${CONFIG.baseUrl}`);
  mdLines.push(`**Concurrency:** ${CONFIG.concurrency} | **Requests/endpoint:** ${CONFIG.totalRequests}`);
  mdLines.push('');
  mdLines.push('| Endpoint | RPS | p50 (ms) | p95 (ms) | p99 (ms) | Avg (ms) | TTFB p50 | Error % |');
  mdLines.push('|----------|-----|----------|----------|----------|----------|----------|---------|');
  for (const r of allResults) {
    mdLines.push(`| ${r.label} | ${r.rps} | ${r.latency_ms.p50} | ${r.latency_ms.p95} | ${r.latency_ms.p99} | ${r.latency_ms.avg} | ${r.ttfb_ms.p50} | ${r.error_rate_pct}% |`);
  }
  writeFileSync(mdPath, mdLines.join('\n'));
  console.log(`  Report saved to: ${mdPath}`);

  console.log('='.repeat(70));
  console.log('  BENCHMARK COMPLETE');
  console.log('='.repeat(70));

  // Threshold validation (CI mode)
  let thresholdsPassed = true;
  if (CI_MODE && existsSync(THRESHOLDS_PATH)) {
    console.log('\n  Checking thresholds...');
    const thresholds = JSON.parse(readFileSync(THRESHOLDS_PATH, 'utf-8'));
    for (const r of allResults) {
      const key = r.path;
      const threshold = thresholds.p99_latency_ms[key] || thresholds.p99_latency_ms['/api/jobs'] || 500;
      const p99 = parseFloat(r.latency_ms.p99);
      if (p99 > threshold) {
        console.log(`  FAIL: ${r.label} p99=${p99}ms > threshold=${threshold}ms`);
        thresholdsPassed = false;
      } else {
        console.log(`  PASS: ${r.label} p99=${p99}ms <= threshold=${threshold}ms`);
      }
    }
    if (thresholdsPassed) {
      console.log('  All thresholds passed.');
    } else {
      console.error('  Some thresholds exceeded!');
      process.exitCode = 1;
    }
  }
}

runBenchmarkSuite().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
