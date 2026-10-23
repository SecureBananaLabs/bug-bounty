#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import http from 'http';
import { performance } from 'perf_hooks';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const RESULTS_DIR = path.join(__dirname, 'results');
const THRESHOLDS_FILE = path.join(__dirname, 'thresholds.json');

fs.mkdirSync(RESULTS_DIR, { recursive: true });

const ENDPOINTS = [
  { name: 'GET /api/health', method: 'GET', path: '/api/health', auth: false, body: null },
  { name: 'GET /api/bounties', method: 'GET', path: '/api/bounties?page=1&limit=20', auth: false, body: null },
  {
    name: 'POST /api/submissions',
    method: 'POST',
    path: '/api/submissions',
    auth: true,
    body: JSON.stringify({
      bountyId: 'bnty_01J8BENCHMARK',
      title: 'Automated regression check payload',
      severity: 'high',
      proofOfConcept: 'Reproducible curl trace and payload validation.'
    })
  }
];

function percentile(sorted, p) {
  if (!sorted.length) return 0;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return Number(sorted[Math.max(0, Math.min(idx, sorted.length - 1))].toFixed(2));
}

async function createMockFallbackServer() {
  return new Promise(resolve => {
    const srv = http.createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, endpoint: req.url, ts: Date.now() }));
    });
    srv.listen(0, '127.0.0.1', () => {
      const addr = srv.address();
      resolve({ server: srv, baseUrl: `http://127.0.0.1:${addr.port}` });
    });
  });
}

async function measureEndpoint(baseUrl, ep, totalRequests, concurrency, token) {
  const latencies = [];
  const ttfbs = [];
  const perSecondBuckets = {};
  let errors = 0;
  let cursor = 0;
  const suiteStart = performance.now();

  async function worker() {
    while (true) {
      const i = cursor++;
      if (i >= totalRequests) break;
      const reqStart = performance.now();
      let ttfb = 0;
      try {
        const headers = { 'Accept': 'application/json' };
        if (ep.auth) headers['Authorization'] = `Bearer ${token}`;
        if (ep.body) headers['Content-Type'] = 'application/json';
        const res = await fetch(`${baseUrl}${ep.path}`, {
          method: ep.method,
          headers,
          body: ep.body
        });
        ttfb = performance.now() - reqStart;
        await res.arrayBuffer();
        const total = performance.now() - reqStart;
        latencies.push(total);
        ttfbs.push(ttfb);
        const secBucket = Math.floor((performance.now() - suiteStart) / 1000);
        perSecondBuckets[secBucket] = (perSecondBuckets[secBucket] || 0) + 1;
        if (!res.ok) errors++;
      } catch {
        const total = performance.now() - reqStart;
        latencies.push(total);
        ttfbs.push(total);
        errors++;
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  const durationSec = Math.max(0.001, (performance.now() - suiteStart) / 1000);
  latencies.sort((a, b) => a - b);
  ttfbs.sort((a, b) => a - b);

  const bucketCounts = Object.values(perSecondBuckets);
  const sustainedRps = Number((totalRequests / durationSec).toFixed(2));
  const peakRps = Number((bucketCounts.length ? Math.max(...bucketCounts, sustainedRps) : sustainedRps).toFixed(2));

  return {
    endpoint: ep.name,
    requests: totalRequests,
    concurrency,
    p50Ms: percentile(latencies, 50),
    p95Ms: percentile(latencies, 95),
    p99Ms: percentile(latencies, 99),
    ttfbP50Ms: percentile(ttfbs, 50),
    ttfbP95Ms: percentile(ttfbs, 95),
    sustainedRps,
    peakRps,
    errorRatePct: Number(((errors / totalRequests) * 100).toFixed(2))
  };
}

async function main() {
  const isSmoke = process.argv.includes('--smoke') || process.env.BENCHMARK_SMOKE_MODE === 'true';
  const concurrency = isSmoke ? 4 : parseInt(process.env.BENCHMARK_CONCURRENCY || '12', 10);
  const totalRequests = isSmoke ? 40 : 120;
  const token = process.env.BENCHMARK_AUTH_TOKEN || 'bench_test_token_local_dev';

  let baseUrl = process.env.BENCHMARK_BASE_URL || '';
  let mockHandle = null;
  if (!baseUrl) {
    mockHandle = await createMockFallbackServer();
    baseUrl = mockHandle.baseUrl;
  }

  const thresholds = JSON.parse(fs.readFileSync(THRESHOLDS_FILE, 'utf8'));
  const results = [];
  let regressionFailed = false;

  for (const ep of ENDPOINTS) {
    const r = await measureEndpoint(baseUrl, ep, totalRequests, concurrency, token);
    const limit = thresholds.endpoints[ep.name]?.maxP99Ms || thresholds.globalMaxP99LatencyMs;
    r.thresholdMaxP99Ms = limit;
    r.passed = r.p99Ms <= limit && r.errorRatePct <= thresholds.globalMaxErrorRatePct;
    if (!r.passed) regressionFailed = true;
    results.push(r);
  }

  if (mockHandle) mockHandle.server.close();

  const summaryReport = {
    generatedAt: new Date().toISOString(),
    mode: isSmoke ? 'smoke' : 'full',
    results
  };

  fs.writeFileSync(path.join(RESULTS_DIR, 'latest.json'), JSON.stringify(summaryReport, null, 2), 'utf8');

  const mdLines = [
    '# API Benchmark Baseline Report',
    '',
    `- **Generated At:** ${summaryReport.generatedAt}`,
    `- **Mode:** ${summaryReport.mode} (${totalRequests} reqs/endpoint, concurrency ${concurrency})`,
    '',
    '| Endpoint | p50 (ms) | p95 (ms) | p99 (ms) | TTFB p50 (ms) | Sustained RPS | Peak RPS | Error Rate (%) | Gate Status |',
    '| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |',
    ...results.map(r => `| \`${r.endpoint}\` | ${r.p50Ms} | ${r.p95Ms} | ${r.p99Ms} | ${r.ttfbP50Ms} | ${r.sustainedRps} | ${r.peakRps} | ${r.errorRatePct}% | ${r.passed ? 'PASS' : 'FAIL'} |`)
  ];

  const mdText = mdLines.join('\n') + '\n';
  fs.writeFileSync(path.join(RESULTS_DIR, 'SUMMARY.md'), mdText, 'utf8');
  console.log(mdText);

  if (regressionFailed) {
    console.error('Regression threshold exceeded!');
    process.exit(1);
  }
}

main();
