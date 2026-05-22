import autocannon from 'autocannon';
import fs from 'fs';
import path from 'path';

const url = process.env.API_URL || 'http://localhost:3000/api';
const token = process.env.BENCHMARK_TEST_TOKEN || 'fake-token';

const endpoints = [
  { path: '/admin/metrics', method: 'GET', auth: true },
  { path: '/auth/register', method: 'POST', body: JSON.stringify({ email: 'test@example.com', password: 'password123' }) },
  { path: '/auth/login', method: 'POST', body: JSON.stringify({ email: 'test@example.com', password: 'password123' }) },
  { path: '/auth/refresh', method: 'POST' },
  { path: '/jobs', method: 'GET' },
  { path: '/jobs', method: 'POST', body: JSON.stringify({ title: 'Job', description: 'Desc' }), auth: true },
  { path: '/messages', method: 'GET', auth: true },
  { path: '/messages', method: 'POST', body: JSON.stringify({ text: 'Hello' }), auth: true },
  { path: '/notifications', method: 'GET', auth: true },
  { path: '/notifications', method: 'POST', body: JSON.stringify({ type: 'alert' }), auth: true },
  { path: '/payment', method: 'POST', body: JSON.stringify({ amount: 1000, currency: 'usd' }), auth: true },
  { path: '/proposals', method: 'GET', auth: true },
  { path: '/proposals', method: 'POST', body: JSON.stringify({ jobId: '1', coverLetter: 'Hello' }), auth: true },
  { path: '/reviews', method: 'GET' },
  { path: '/reviews', method: 'POST', body: JSON.stringify({ rating: 5 }), auth: true },
  { path: '/search', method: 'GET' },
  { path: '/users', method: 'GET' },
  { path: '/users', method: 'POST', body: JSON.stringify({ name: 'User' }) },
];

const resultsDir = path.join(process.cwd(), 'benchmarks', 'results');
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true });
}

let thresholds = {};
try {
  thresholds = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'benchmarks', 'thresholds.json'), 'utf8'));
} catch (e) {
  // ignore
}

async function runBenchmarks() {
  const allResults = [];
  let markdown = `# Benchmark Results\n\n| Endpoint | Method | RPS | p50 (ms) | p95 (ms) | p99 (ms) | TTFB (ms) | Errors | Pass |\n|---|---|---|---|---|---|---|---|---|\n`;

  let hasFailed = false;

  for (const ep of endpoints) {
    const fullUrl = `${url}${ep.path}`;
    const headers = {
      'content-type': 'application/json'
    };
    if (ep.auth) {
      headers['authorization'] = `Bearer ${token}`;
    }

    console.log(`Benchmarking ${ep.method} ${fullUrl}...`);
    const result = await autocannon({
      url: fullUrl,
      method: ep.method,
      headers,
      body: ep.body,
      connections: 10,
      duration: 5
    });

    const p50 = result.latency.p50;
    const p95 = result.latency.p95;
    const p99 = result.latency.p99;
    const rps = result.requests.average;
    const errors = result.errors + result.timeouts + result.non2xx;
    // Autocannon latency includes TTFB approximately.
    const ttfb = result.latency.min; 

    let passed = '✅';
    if (thresholds.p99_latency_ms && p99 > thresholds.p99_latency_ms) {
      passed = '❌';
      hasFailed = true;
    }

    markdown += `| ${ep.path} | ${ep.method} | ${rps.toFixed(2)} | ${p50} | ${p95} | ${p99} | ${ttfb} | ${errors} | ${passed} |\n`;
    allResults.push({ path: ep.path, method: ep.method, result });
  }

  fs.writeFileSync(path.join(resultsDir, 'results.json'), JSON.stringify(allResults, null, 2));
  fs.writeFileSync(path.join(resultsDir, 'summary.md'), markdown);
  console.log('\\n' + markdown);

  if (hasFailed) {
    console.error('Some endpoints exceeded the p99 threshold!');
    process.exit(1);
  } else {
    console.log('All endpoints passed the threshold checks.');
  }
}

runBenchmarks().catch(console.error);
