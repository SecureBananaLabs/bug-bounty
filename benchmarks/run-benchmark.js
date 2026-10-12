'use strict';

/**
 * Benchmarks runner for the platform API.
 *
 * Usage:
 *   node benchmarks/run-benchmark.js            # full suite (local Express on :4010)
 *   BENCHMARK_TARGET_URL=https://... node benchmarks/run-benchmark.js
 *   BENCHMARK_SMOKE_MODE=true node benchmarks/run-benchmark.js
 *
 * Starts the Express app in-process by default, drives every mounted
 * /api/* endpoint with autocannon, writes JSON + Markdown results and
 * enforces thresholds in smoke mode.
 */
const autocannon = require('autocannon');
const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const RESULTS_DIR = path.join(__dirname, 'results');
const manifest = require('./manifest.js');
const { getAuthToken } = require('./lib/auth.js');
const thresholds = require('./thresholds.json');

// ---- config from env ----
const env = { ...require('./lib/auth.js').loadEnvBenchmark(ROOT), ...process.env };
const TARGET = env.BENCHMARK_TARGET_URL || 'http://127.0.0.1:4010';
const SMOKE = String(env.BENCHMARK_SMOKE_MODE || 'false').toLowerCase() === 'true';
const DURATION = SMOKE ? thresholds.smoke_duration_s : (Number(env.BENCHMARK_DURATION) || thresholds.full_duration_s);
const CONNECTIONS = SMOKE ? thresholds.smoke_connections : (Number(env.BENCHMARK_CONNECTIONS) || thresholds.full_connections);

async function startLocalApp() {
  // Spawn the real server as a child process (matches `npm start`) so any
  // route crash doesn't take the benchmark harness down with it.
  const { spawn } = require('child_process');
  const serverProc = spawn(process.execPath, ['apps/api/src/server.js'], {
    cwd: ROOT,
    env: { ...process.env, PORT: '4010', BENCHMARK_DISABLE_LIMITER: 'true' },
    stdio: 'ignore',
  });
  // wait for the port to accept connections
  const t0 = Date.now();
  for (;;) {
    if (!serverProc || serverProc.exitCode != null) throw new Error('server exited during startup');
    try {
      const probe = await fetch('http://127.0.0.1:4010/health');
      if (probe.ok) break;
    } catch (_) { /* not up yet */ }
    if (Date.now() - t0 > 15000) throw new Error('local server did not become ready');
    await new Promise((r) => setTimeout(r, 300));
  }
  return serverProc;
}

function buildBody(route) {
  if (route.multipart) {
    const rand = Date.now();
    const boundary = `----AlitaBench${rand}`;
    const content = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="' + route.payload.field + '"; filename="' + route.payload.filename + '"',
      'Content-Type: text/plain',
      '',
      route.payload.content,
      `--${boundary}--`,
      '',
    ].join('\r\n');
    return { body: Buffer.from(content), headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` } };
  }
  return { body: route.payload ? JSON.stringify(route.payload) : undefined,
           headers: route.payload ? { 'Content-Type': 'application/json' } : {} };
}

// True time-to-first-byte: raw http request, clock stops at first incoming byte.
function measureTTFB(route, token, samples = 20) {
  const { body, headers } = buildBody(route);
  const finalHeaders = route.auth ? { ...headers, Authorization: `Bearer ${token}` } : headers;
  const http = require('http');
  const times = [];
  let done = 0;
  return new Promise((resolve) => {
    for (let i = 0; i < samples; i++) {
      const t0 = process.hrtime.bigint();
      const req = http.request(TARGET + route.path, { method: route.method, headers: finalHeaders }, (res) => {
        const dt = Number(process.hrtime.bigint() - t0) / 1e6;
        times.push(dt);
        res.resume();
        if (++done === samples) {
          times.sort((a, b) => a - b);
          resolve(times.length ? +(times.reduce((a, b) => a + b, 0) / times.length).toFixed(2) : null);
        }
      });
      req.on('error', () => { if (++done === samples) resolve(null); });
      if (body) req.write(body);
      req.end();
    }
  });
}

function runOne(route, token) {
  const { body, headers } = buildBody(route);
  const finalHeaders = route.auth ? { ...headers, Authorization: `Bearer ${token}` } : headers;
  return new Promise((resolve, reject) => {
    const instance = autocannon({
      url: TARGET + route.path,
      method: route.method,
      headers: finalHeaders,
      body,
      connections: CONNECTIONS,
      duration: DURATION,
      timeout: 30,
      title: route.name,
    }, (err, result) => (err ? reject(err) : resolve(result)));
    autocannon.track(instance, { renderProgressBar: false, renderLatencyTable: false });
  });
}

function fmt(n, d = 2) { return typeof n === 'number' ? n.toFixed(d) : String(n); }

function summarize(route, r) {
  const lat = r.latency || {};
  const p95 = lat.p97_5 != null ? +lat.p97_5.toFixed(2) : (lat.p95 != null ? +lat.p95.toFixed(2) : null);
  const totalReq = r.requests && r.requests.total ? r.requests.total : (r.requestsSent || 0);
  const errors = ((r.errors || 0) + (r.timeouts || 0) + (r.non2xx || 0)) || 0;
  const errorRate = totalReq ? (errors / totalReq) * 100 : 0;
  return {
    endpoint: route.name,
    method: route.method,
    path: route.path,
    statusCodeDist: (r.statusCodeStats && Object.keys(r.statusCodeStats).length) ? r.statusCodeStats : undefined,
    p50_ms: lat.p50 != null ? +lat.p50.toFixed(2) : null,
    p95_ms: p95,
    p99_ms: lat.p99 != null ? +lat.p99.toFixed(2) : null,
    avg_ms: lat.average != null ? +lat.average.toFixed(2) : null,
    rps_peak: r.requests && r.requests.max ? +r.requests.max.toFixed(2) : null,
    rps_sustained: r.requests && r.requests.average != null ? +r.requests.average.toFixed(2) : null,
    ttfb_avg_ms: r._ttfbAvgMs != null ? +r._ttfbAvgMs.toFixed(2) : null,
    error_rate_pct: +errorRate.toFixed(2),
    total_requests: totalReq,
  };
}

async function main() {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
  const token = await getAuthToken({ projectRoot: ROOT, localSecret: process.env.JWT_SECRET || 'benchmark-secret' });

  let server = null;
  if (TARGET.startsWith('http://127.0.0.1') || TARGET.startsWith('http://localhost')) {
    try { server = await startLocalApp(); }
    catch (e) { console.error('[bench] could not start local app; ensure deps installed (npm install) and try again.\n', e.message); process.exit(1); }
  }

  const results = [];
  for (const route of manifest) {
    try {
      const r = await runOne(route, token);
      r._ttfbAvgMs = await measureTTFB(route, token);
      results.push(summarize(route, r));
      const s = results.at(-1);
      console.log(`[bench] ${route.name} -> p99=${fmt(s.p99_ms)}ms rps=${fmt(s.rps_sustained)} err=${fmt(s.error_rate_pct)}%`);
    } catch (e) {
      results.push({ endpoint: route.name, error: e.message });
      console.error(`[bench] ${route.name} FAILED: ${e.message}`);
    }
  }

  if (server) server.kill('SIGTERM');

  // ---- JSON output ----
  const meta = {
    generated_at: new Date().toISOString(),
    mode: SMOKE ? 'smoke' : 'full',
    target: TARGET,
    connections: CONNECTIONS,
    duration_s: DURATION,
    environment: {
      cpu: os.cpus().length + ' cores (' + os.cpus()[0].model + ')',
      ram_gb: Math.round(os.totalmem() / 1024 ** 3),
      platform: os.platform() + ' ' + os.release(),
      arch: os.arch(),
      node: process.version,
    },
  };
  const jsonOut = { meta, endpoints: results };
  fs.writeFileSync(path.join(RESULTS_DIR, 'benchmark.json'), JSON.stringify(jsonOut, null, 2));

  // ---- Markdown output ----
  const lines = [];
  lines.push('# API Benchmark Report');
  lines.push('');
  lines.push(`Generated: ${meta.generated_at}  ·  Mode: **${meta.mode}**  ·  Target: \`${TARGET}\``);
  lines.push('');
  lines.push('## Environment');
  lines.push('');
  lines.push(`- CPU: ${meta.environment.cpu}`);
  lines.push(`- RAM: ${meta.environment.ram_gb} GB`);
  lines.push(`- OS: ${meta.environment.platform} (${meta.environment.arch})`);
  lines.push(`- Node.js: ${meta.environment.node}`);
  lines.push(`- Connections: ${CONNECTIONS} · Duration: ${DURATION}s per endpoint`);
  lines.push('');
  lines.push('## Per-Endpoint Results');
  lines.push('');
  lines.push('| Endpoint | p50 (ms) | p95 (ms) | p99 (ms) | RPS (sustained) | Error % | TTFB avg (ms) |');
  lines.push('|---|---|---|---|---|---|---|');
  for (const r of results) {
    if (r.error) {
      lines.push(`| ${r.endpoint} | — | — | — | — | — | **${r.error}** |`);
      continue;
    }
    lines.push(`| ${r.endpoint} | ${fmt(r.p50_ms, 1)} | ${fmt(r.p95_ms, 1)} | ${fmt(r.p99_ms, 1)} | ${fmt(r.rps_sustained, 1)} | ${fmt(r.error_rate_pct, 2)}% | ${fmt(r.ttfb_avg_ms, 1)} |`);
  }
  lines.push('');
  lines.push('## Regression Gate (smoke mode)');
  lines.push('');
  const violations = [];
  for (const r of results.filter(x => !x.error)) {
    const th = (thresholds.p99_latency_ms || {})[r.endpoint];
    if (th != null && r.p99_ms != null && r.p99_ms > th) violations.push(`${r.endpoint}: p99 ${fmt(r.p99_ms, 1)}ms > threshold ${th}ms`);
    if (r.error_rate_pct > thresholds.max_error_rate_pct) violations.push(`${r.endpoint}: error rate ${fmt(r.error_rate_pct, 2)}% > ${thresholds.max_error_rate_pct}%`);
  }
  if (SMOKE) {
    if (violations.length) { lines.push('**FAILED** — ' + violations.join('; ')); }
    else lines.push('**PASSED** — all endpoints within threshold.');
  } else {
    lines.push('Smoke gate disabled in full mode. Run `npm run benchmark:smoke` for CI gating.');
  }
  fs.writeFileSync(path.join(RESULTS_DIR, 'benchmark.md'), lines.join('\n'));

  if (SMOKE && violations.length) {
    console.error('[bench] SMOKE FAILED:\n' + violations.join('\n'));
    process.exit(1);
  }
  console.log(`[bench] done. Results in ${RESULTS_DIR}`);
}

main().catch((e) => { console.error(e); process.exit(1); });