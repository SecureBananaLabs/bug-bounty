#!/usr/bin/env node
/**
 * API benchmark suite: p50/p95/p99 latency, RPS, error rate, TTFB.
 * Usage: node benchmarks/run-benchmarks.js [--smoke]
 * Env: BENCHMARK_HOST, BENCHMARK_TOKEN (see .env.benchmark)
 */
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const { URL } = require('url');

const ROOT = path.join(__dirname);
const RESULTS = path.join(ROOT, 'results');
const THRESHOLDS = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'thresholds.json'), 'utf8')
);

function loadEnv() {
  const p = path.join(process.cwd(), '.env.benchmark');
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
}
loadEnv();

const HOST = process.env.BENCHMARK_HOST || 'http://localhost:3000';
const TOKEN = process.env.BENCHMARK_TOKEN || 'benchmark-test-token';
const SMOKE = process.argv.includes('--smoke');
const DURATION = SMOKE ? 5 : 15;
const CONNECTIONS = SMOKE ? 5 : 25;

// Realistic payloads from production-style schemas
const ENDPOINTS = [
  { method: 'GET', path: '/api/health', auth: false },
  { method: 'GET', path: '/api/users/me', auth: true },
  { method: 'GET', path: '/api/items?limit=20', auth: true },
  {
    method: 'POST',
    path: '/api/items',
    auth: true,
    body: JSON.stringify({
      name: 'bench-item',
      description: 'x'.repeat(256),
      tags: ['bench', 'load'],
      meta: { source: 'benchmark', size: 1024 }
    })
  },
  {
    method: 'POST',
    path: '/api/search',
    auth: true,
    body: JSON.stringify({ q: 'benchmark query', filters: { status: 'active' }, page: 1, pageSize: 25 })
  }
];

function requestOnce(ep) {
  return new Promise((resolve) => {
    const u = new URL(ep.path, HOST);
    const lib = u.protocol === 'https:' ? https : http;
    const headers = { 'content-type': 'application/json', accept: 'application/json' };
    if (ep.auth) headers.authorization = `Bearer ${TOKEN}`;
    const body = ep.body || null;
    if (body) headers['content-length'] = Buffer.byteLength(body);
    const start = process.hrtime.bigint();
    let ttfbNs = null;
    const req = lib.request(
      {
        hostname: u.hostname,
        port: u.port || (u.protocol === 'https:' ? 443 : 80),
        path: u.pathname + u.search,
        method: ep.method,
        headers,
        timeout: 10000
      },
      (res) => {
        ttfbNs = process.hrtime.bigint() - start;
        res.on('data', () => {});
        res.on('end', () => {
          const totalMs = Number(process.hrtime.bigint() - start) / 1e6;
          const ttfbMs = Number(ttfbNs) / 1e6;
          resolve({ ok: res.statusCode < 400, status: res.statusCode, latency: totalMs, ttfb: ttfbMs });
        });
      }
    );
    req.on('error', () => resolve({ ok: false, status: 0, latency: 0, ttfb: 0 }));
    req.on('timeout', () => { req.destroy(); resolve({ ok: false, status: 0, latency: 0, ttfb: 0 }); });
    if (body) req.write(body);
    req.end();
  });
}

function percentile(sorted, p) {
  if (!sorted.length) return 0;
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, idx)];
}

async function benchEndpoint(ep) {
  const lat = [];
  const ttfb = [];
  let errors = 0;
  let total = 0;
  const endAt = Date.now() + DURATION * 1000;
  const workers = Array.from({ length: CONNECTIONS }, async () => {
    while (Date.now() < endAt) {
      const r = await requestOnce(ep);
      total += 1;
      if (!r.ok) errors += 1;
      if (r.latency > 0) {
        lat.push(r.latency);
        ttfb.push(r.ttfb);
      }
    }
  });
  await Promise.all(workers);
  lat.sort((a, b) => a - b);
  ttfb.sort((a, b) => a - b);
  const rps = total / DURATION;
  return {
    endpoint: `${ep.method} ${ep.path}`,
    samples: total,
    p50: +percentile(lat, 50).toFixed(2),
    p95: +percentile(lat, 95).toFixed(2),
    p99: +percentile(lat, 99).toFixed(2),
    rps_peak: +rps.toFixed(2),
    rps_sustained: +rps.toFixed(2),
    error_rate: +((errors / Math.max(total, 1)) * 100).toFixed(2),
    ttfb_p50: +percentile(ttfb, 50).toFixed(2),
    ttfb_p99: +percentile(ttfb, 99).toFixed(2)
  };
}

function toMarkdown(results) {
  let md = '# API Benchmark Results\n\n';
  md += `| Endpoint | p50 (ms) | p95 (ms) | p99 (ms) | RPS | Error % | TTFB p99 (ms) |\n`;
  md += `|----------|----------|----------|----------|-----|---------|---------------|\n`;
  for (const r of results) {
    md += `| ${r.endpoint} | ${r.p50} | ${r.p95} | ${r.p99} | ${r.rps_sustained} | ${r.error_rate} | ${r.ttfb_p99} |\n`;
  }
  md += `\n_Generated ${new Date().toISOString()} | duration=${DURATION}s connections=${CONNECTIONS}_\n`;
  return md;
}

(async () => {
  fs.mkdirSync(RESULTS, { recursive: true });
  const results = [];
  for (const ep of ENDPOINTS) {
    process.stderr.write(`Benchmarking ${ep.method} ${ep.path}...\n`);
    results.push(await benchEndpoint(ep));
  }
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const jsonPath = path.join(RESULTS, `bench-${stamp}.json`);
  const mdPath = path.join(RESULTS, `bench-${stamp}.md`);
  fs.writeFileSync(jsonPath, JSON.stringify({ host: HOST, smoke: SMOKE, results }, null, 2));
  fs.writeFileSync(mdPath, toMarkdown(results));
  fs.writeFileSync(path.join(RESULTS, 'latest.json'), JSON.stringify({ host: HOST, smoke: SMOKE, results }, null, 2));
  fs.writeFileSync(path.join(RESULTS, 'latest.md'), toMarkdown(results));
  console.log(toMarkdown(results));

  let failed = false;
  for (const r of results) {
    const key = r.endpoint;
    const limit = THRESHOLDS[key] || THRESHOLDS.default;
    if (limit && r.p99 > limit.p99_ms) {
      console.error(`FAIL ${key}: p99 ${r.p99}ms > ${limit.p99_ms}ms`);
      failed = true;
    }
  }
  if (failed) process.exit(1);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
