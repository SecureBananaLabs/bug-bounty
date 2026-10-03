// Benchmark suite for all /api/* endpoints using autocannon.
// Usage: node benchmarks/benchmark.js [--ci]
const autocannon = require('autocannon');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const TOKEN = process.env.BENCHMARK_TOKEN || '';
const CI_MODE = process.argv.includes('--ci');

const CONCURRENCY = CI_MODE
  ? parseInt(process.env.CI_CONCURRENCY || '2')
  : parseInt(process.env.CONCURRENCY || '10');
const DURATION = CI_MODE
  ? parseInt(process.env.CI_DURATION || '10')
  : parseInt(process.env.DURATION || '30');
const CONNECTIONS = parseInt(process.env.CONNECTIONS || '10');

// Endpoint definitions
const ENDPOINTS = [
  // Auth (public POST)
  { name: 'POST /api/auth/register', method: 'POST', path: '/api/auth/register',
    body: JSON.stringify({ email: 'bench@test.com', password: 'Bench123!', name: 'Bench' }),
    headers: { 'content-type': 'application/json' } },
  { name: 'POST /api/auth/login', method: 'POST', path: '/api/auth/login',
    body: JSON.stringify({ email: 'bench@test.com', password: 'Bench123!' }),
    headers: { 'content-type': 'application/json' } },
  // Jobs (public GET)
  { name: 'GET /api/jobs', method: 'GET', path: '/api/jobs' },
  { name: 'POST /api/jobs', method: 'POST', path: '/api/jobs',
    body: JSON.stringify({ title: 'Bench Job', description: 'Load test', budget: 500, currency: 'usd' }),
    headers: { 'content-type': 'application/json' } },
  // Proposals
  { name: 'GET /api/proposals', method: 'GET', path: '/api/proposals' },
  { name: 'POST /api/proposals', method: 'POST', path: '/api/proposals',
    body: JSON.stringify({ jobId: 1, coverLetter: 'Bench proposal', bid: 300 }),
    headers: { 'content-type': 'application/json' } },
  // Payments
  { name: 'POST /api/payments', method: 'POST', path: '/api/payments',
    body: JSON.stringify({ amount: 1000, currency: 'usd' }),
    headers: { 'content-type': 'application/json' } },
  // Reviews
  { name: 'GET /api/reviews', method: 'GET', path: '/api/reviews' },
  { name: 'POST /api/reviews', method: 'POST', path: '/api/reviews',
    body: JSON.stringify({ revieweeId: 1, rating: 5, comment: 'Great!' }),
    headers: { 'content-type': 'application/json' } },
  // Messages
  { name: 'GET /api/messages', method: 'GET', path: '/api/messages' },
  { name: 'POST /api/messages', method: 'POST', path: '/api/messages',
    body: JSON.stringify({ recipientId: 1, content: 'Hello' }),
    headers: { 'content-type': 'application/json' } },
  // Notifications
  { name: 'GET /api/notifications', method: 'GET', path: '/api/notifications' },
  // Search
  { name: 'GET /api/search?q=dev', method: 'GET', path: '/api/search?q=dev' },
  // Users
  { name: 'GET /api/users', method: 'GET', path: '/api/users' },
  // Admin (auth protected)
  { name: 'GET /api/admin/metrics', method: 'GET', path: '/api/admin/metrics',
    headers: TOKEN ? { authorization: `Bearer ${TOKEN}` } : {} },
  // Health / root
  { name: 'GET / (root)', method: 'GET', path: '/' },
];

async function runBenchmark(endpoint) {
  const opts = {
    url: BASE_URL,
    method: endpoint.method,
    path: endpoint.path,
    connections: CONNECTIONS,
    duration: DURATION,
    amount: undefined, // use duration instead
    body: endpoint.body || undefined,
    headers: endpoint.headers || { 'content-type': 'application/json' },
  };

  return new Promise((resolve, reject) => {
    const instance = autocannon(opts, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
    autocannon.track(instance, { renderProgressBar: !CI_MODE });
  });
}

function formatResult(endpoint, result) {
  const latencies = result.latency;
  const errors = result.errors || 0;
  const total = result.requests?.total || 0;
  const errorRate = total > 0 ? ((errors / total) * 100).toFixed(2) : '0.00';

  return {
    endpoint: endpoint.name,
    method: endpoint.method,
    path: endpoint.path,
    requests_per_second: result.requests?.average?.toFixed(1) || '0',
    latency_p50_ms: latencies?.p50?.toFixed(2) || '0',
    latency_p95_ms: latencies?.p95?.toFixed(2) || '0',
    latency_p99_ms: latencies?.p99?.toFixed(2) || '0',
    ttfb_ms: latencies?.average?.toFixed(2) || '0',
    error_rate_percent: parseFloat(errorRate),
    total_requests: total,
    total_errors: errors,
    duration_seconds: result.duration,
  };
}

function loadThresholds() {
  const p = path.join(__dirname, 'thresholds.json');
  if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
  return { p99_latency_ms: 500, error_rate_percent: 5 };
}

function checkThresholds(results, thresholds) {
  const failures = [];
  for (const r of results) {
    if (r.latency_p99_ms > thresholds.p99_latency_ms) {
      failures.push(`${r.endpoint}: p99 ${r.latency_p99_ms}ms > threshold ${thresholds.p99_latency_ms}ms`);
    }
    if (r.error_rate_percent > thresholds.error_rate_percent) {
      failures.push(`${r.endpoint}: error rate ${r.error_rate_percent}% > threshold ${thresholds.error_rate_percent}%`);
    }
  }
  return failures;
}

function generateMarkdown(results) {
  const lines = [
    `# API Benchmark Results`,
    ``,
    `**Target**: ${BASE_URL}`,
    `**Mode**: ${CI_MODE ? 'CI (smoke)' : 'Full'}`,
    `**Concurrency**: ${CONCURRENCY}`,
    `**Duration**: ${DURATION}s`,
    `**Connections**: ${CONNECTIONS}`,
    ``,
    `| Endpoint | RPS | p50 (ms) | p95 (ms) | p99 (ms) | Errors (%) |`,
    `|----------|-----|----------|----------|----------|------------|`,
  ];

  for (const r of results) {
    lines.push(`| ${r.endpoint} | ${r.requests_per_second} | ${r.latency_p50_ms} | ${r.latency_p95_ms} | ${r.latency_p99_ms} | ${r.error_rate_percent} |`);
  }

  return lines.join('\n');
}

async function main() {
  console.log(`\n🚀 API Benchmark Suite`);
  console.log(`Target: ${BASE_URL}`);
  console.log(`Mode: ${CI_MODE ? 'CI (smoke)' : 'Full'}`);
  console.log(`Concurrency: ${CONCURRENCY}, Duration: ${DURATION}s\n`);

  const results = [];
  const thresholds = loadThresholds();

  for (let i = 0; i < ENDPOINTS.length; i++) {
    const ep = ENDPOINTS[i];
    console.log(`[${i + 1}/${ENDPOINTS.length}] ${ep.name}...`);
    try {
      const raw = await runBenchmark(ep);
      const formatted = formatResult(ep, raw);
      results.push(formatted);
      console.log(`  ✓ RPS: ${formatted.requests_per_second}, p99: ${formatted.latency_p99_ms}ms`);
    } catch (err) {
      console.log(`  ✗ Error: ${err.message}`);
      results.push({
        endpoint: ep.name,
        method: ep.method,
        path: ep.path,
        requests_per_second: '0',
        latency_p50_ms: '0',
        latency_p95_ms: '0',
        latency_p99_ms: '0',
        ttfb_ms: '0',
        error_rate_percent: 100,
        total_requests: 0,
        total_errors: 0,
        duration_seconds: 0,
        error: err.message,
      });
    }
  }

  // Save results
  const resultsDir = path.join(__dirname, 'results');
  if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const jsonPath = path.join(resultsDir, `benchmark-${ts}.json`);
  const mdPath = path.join(resultsDir, `benchmark-${ts}.md`);

  fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2));
  fs.writeFileSync(mdPath, generateMarkdown(results));

  console.log(`\n📊 Results saved:`);
  console.log(`  JSON: ${jsonPath}`);
  console.log(`  MD:   ${mdPath}`);

  // Check thresholds
  const failures = checkThresholds(results, thresholds);
  if (failures.length > 0) {
    console.log(`\n⚠️  Threshold violations:`);
    failures.forEach(f => console.log(`  - ${f}`));
    if (CI_MODE) process.exit(1);
  } else {
    console.log(`\n✅ All thresholds passed`);
  }
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
