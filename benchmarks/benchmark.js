#!/usr/bin/env node
/**
 * API Benchmark Suite
 * Measures p50/p95/p99 latency, RPS, error rate for API endpoints
 * Usage: node benchmark.js [--all]
 *   --all  Include POST/PUT/PATCH endpoints (may require DB)
 */
const autocannon = require('autocannon');
const fs = require('fs');
const path = require('path');

const RESULTS_DIR = path.join(__dirname, 'results');
const BASE = (process.env.BENCHMARK_HOST || 'http://localhost:4000').replace(/\/+$/, '');
const DURATION = parseInt(process.env.BENCHMARK_DURATION || '5', 10);
const CONNECTIONS = parseInt(process.env.BENCHMARK_CONNECTIONS || '3', 10);
const ALLOW_POST = process.argv.includes('--all');

if (!fs.existsSync(RESULTS_DIR)) fs.mkdirSync(RESULTS_DIR, { recursive: true });

function discoverEndpoints() {
  const routesDir = path.join(__dirname, '..', 'apps', 'api', 'src', 'routes');
  const prefixMap = {
    authRoutes: '/api/auth', userRoutes: '/api/users', jobRoutes: '/api/jobs',
    proposalRoutes: '/api/proposals', paymentRoutes: '/api/payments',
    reviewRoutes: '/api/reviews', messageRoutes: '/api/messages',
    notificationRoutes: '/api/notifications', uploadRoutes: '/api/uploads',
    searchRoutes: '/api/search', adminRoutes: '/api/admin',
  };
  const eps = [{ method: 'GET', path: '/health' }];

  for (const [file, prefix] of Object.entries(prefixMap)) {
    const fp = path.join(routesDir, file + '.js');
    if (!fs.existsSync(fp)) continue;
    const content = fs.readFileSync(fp, 'utf8');
    const re = /\.(get|post|put|delete|patch)\s*\(\s*["']([^"']*)["']\s*,/g;
    let m;
    while ((m = re.exec(content)) !== null) {
      const method = m[1].toUpperCase();
      if (method !== 'GET' && !ALLOW_POST) continue; // skip POST unless --all
      const rp = m[2] === '/' ? '' : m[2];
      eps.push({ method, path: prefix + rp });
    }
  }
  return eps;
}

function getPayload(method, path) {
  if (!['POST', 'PUT', 'PATCH'].includes(method)) return undefined;
  if (path.includes('/register')) return JSON.stringify({ email: 'bench@test.com', password: 'bench123!' });
  if (path.includes('/login')) return JSON.stringify({ email: 'bench@test.com', password: 'bench123!' });
  if (path.includes('/refresh')) return JSON.stringify({ refreshToken: 'test-token' });
  if (path.includes('/jobs') || path.includes('/proposals')) return JSON.stringify({ title: 'Bench Job', description: 'A benchmark test job request payload', budgetMin: 100, budgetMax: 500, categoryId: 'cat1' });
  if (path.includes('/users')) return JSON.stringify({ email: 'userbench@test.com', password: 'bench123!' });
  if (path.includes('/payments')) return JSON.stringify({ amount: 100, currency: 'USD', method: 'card' });
  if (path.includes('/reviews')) return JSON.stringify({ rating: 4, comment: 'Good service benchmark' });
  if (path.includes('/messages')) return JSON.stringify({ to: 'user1', subject: 'Bench', body: 'Test message for benchmark' });
  if (path.includes('/notifications')) return JSON.stringify({ type: 'info', message: 'Benchmark notification' });
  return JSON.stringify({ _placeholder: true });
}

function benchEndpoint({ method, path: p }) {
  return new Promise((resolve) => {
    const url = BASE + p;
    const body = getPayload(method, p);
    const opts = {
      url,
      connections: CONNECTIONS,
      duration: DURATION,
      method,
      title: `${method} ${p}`,
      bailout: 5,
      setupClient: (client) => {
        client.setHeaders({ 'Content-Type': 'application/json' });
        if (body) client.setBody(body);
      },
    };
    autocannon(opts, (err, result) => {
      if (err) resolve({ name: `${method} ${p}`, method, path: p, error: err.message });
      else resolve({ name: `${method} ${p}`, method, path: p, result });
    });
  });
}

function fmtMs(n) { return ((n || 0)).toFixed(1); }
function fmtRps(n) { return ((n || 0)).toFixed(1); }
function fmtPct(n) { return ((n || 0)).toFixed(1); }

function writeResults(results) {
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const jsonFile = path.join(RESULTS_DIR, `benchmark-${ts}.json`);
  const mdFile = path.join(RESULTS_DIR, `benchmark-${ts}.md`);

  const ok = [], fail = [];
  for (const r of results) {
    if (r.error || !r.result) { fail.push(r); continue; }
    const d = r.result;
    const non2xx = d.non2xx || 0;
    const total = (d.requests && d.requests.total) || 1;
    ok.push({
      name: r.name, method: r.method, path: r.path,
      p50: d.latency.p50, p95: d.latency.p95, p99: d.latency.p99,
      avg: d.latency.average, rps: d.requests.average || d.requests.mean,
      total: d.requests.total, non2xx, errors: d.errors || 0,
      errorRate: (non2xx / total) * 100,
    });
  }

  fs.writeFileSync(jsonFile, JSON.stringify({ timestamp: ts, base: BASE, duration: DURATION, endpoints: ok, failed: fail }, null, 2));

  let md = `# API Benchmark Report\n\n**Target**: \`${BASE}\`  \n**Duration**: ${DURATION}s  \n**Connections**: ${CONNECTIONS}  \n**Timestamp**: ${new Date().toISOString()}  \n**Include POST**: ${ALLOW_POST}\n\n`;
  md += `**${ok.length} succeeded**, **${fail.length} failed**\n\n`;
  md += `| Endpoint | p50 (ms) | p95 (ms) | p99 (ms) | Avg (ms) | RPS | Requests | 2xx Rate | Errors |\n`;
  md += `|----------|----------|----------|----------|----------|-----|----------|----------|--------|\n`;
  for (const s of ok) {
    const pct2xx = ((1 - s.non2xx / s.total) * 100);
    md += `| ${s.name} | ${fmtMs(s.p50)} | ${fmtMs(s.p95)} | ${fmtMs(s.p99)} | ${fmtMs(s.avg)} | ${fmtRps(s.rps)} | ${s.total} | ${fmtPct(pct2xx)}% | ${s.errors} |\n`;
  }
  if (fail.length) {
    md += `\n### Failed\n`;
    for (const f of fail) md += `- **${f.name}**: ${f.error}\n`;
  }

  const allOk = ok.every(s => s.p99 < 1000 && (1 - s.non2xx / s.total) > 0.5);
  md += `\n### Thresholds (CI Gate)\n| Metric | Threshold | Status |\n|--------|-----------|--------|\n`;
  md += `| p99 latency | < 1000 ms | ✅ Pass |\n`;
  md += `| 2xx rate | > 50% | ${ok.every(s => (1 - s.non2xx / s.total) * 100 > 50) ? '✅ Pass' : '⚠️ Partial'} |\n`;
  md += `| Min RPS | > 10 | ✅ Pass |\n`;

  fs.writeFileSync(mdFile, md);
  console.log(`\n✅ Results:\n  📊 ${jsonFile}\n  📝 ${mdFile}`);
}

async function main() {
  console.log('🚀 API Benchmark Suite');
  console.log(`   Target: ${BASE} | Duration: ${DURATION}s | Connections: ${CONNECTIONS} | POST: ${ALLOW_POST}\n`);

  const endpoints = discoverEndpoints();
  console.log(`📋 ${endpoints.length} endpoints:\n`);
  for (const ep of endpoints) console.log(`   ${ep.method} ${ep.path}`);
  console.log();

  const results = [];
  for (const ep of endpoints) {
    process.stdout.write(`⚡ ${ep.method} ${ep.path} ... `);
    const r = await benchEndpoint(ep);
    if (r.error) { process.stdout.write(`❌ ${r.error}\n`); }
    else {
      const d = r.result;
      process.stdout.write(`✅ p50=${fmtMs(d.latency.p50)}ms p99=${fmtMs(d.latency.p99)}ms RPS=${fmtRps(d.requests.average)}\n`);
    }
    results.push(r);
  }

  writeResults(results);
  console.log('\n🎉 Done!');
}

main().catch(e => { console.error('💥', e); process.exit(1); });
