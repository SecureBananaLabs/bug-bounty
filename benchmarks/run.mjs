import autocannon from 'autocannon';
import jwt from 'jsonwebtoken';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import os from 'os';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');

// --- Configuration from env ---
const BASE_URL = process.env.BENCHMARK_BASE_URL || 'http://localhost:4000';
const DURATION = parseInt(process.env.BENCHMARK_DURATION || '10', 10);
const CONNECTIONS = parseInt(process.env.BENCHMARK_CONNECTIONS || '10', 10);
const PIPELINING = parseInt(process.env.BENCHMARK_PIPELINING || '1', 10);
const SMOKE = process.env.BENCHMARK_SMOKE === 'true';
const JWT_SECRET = process.env.JWT_SECRET || 'development-secret';
const API_PORT = parseInt(process.env.BENCHMARK_API_PORT || '4000', 10);

// Smoke mode uses lower settings
const duration = SMOKE ? 3 : DURATION;
const connections = SMOKE ? 2 : CONNECTIONS;

const RESULTS_DIR = path.join(__dirname, 'results');
const THRESHOLDS_PATH = path.join(__dirname, 'thresholds.json');

// Generate a valid JWT for auth-protected routes
function generateTestToken() {
  return jwt.sign(
    { userId: 'bench-user', role: 'admin', email: 'bench@test.com' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
}

// --- Endpoint definitions ---
// Each endpoint: { name, method, path, body, headers, flags }
function getEndpoints(token) {
  const authHeader = { authorization: `Bearer ${token}` };

  return [
    // Health
    { name: 'GET /health', method: 'GET', path: '/health' },

    // Auth routes
    {
      name: 'POST /api/auth/register',
      method: 'POST',
      path: '/api/auth/register',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email: `bench-${Date.now()}@test.com`,
        password: 'BenchTest123!',
        role: 'freelancer'
      })
    },
    {
      name: 'POST /api/auth/login',
      method: 'POST',
      path: '/api/auth/login',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email: 'bench@test.com',
        password: 'BenchTest123!'
      })
    },
    {
      name: 'GET /api/auth/oauth/github/callback',
      method: 'GET',
      path: '/api/auth/oauth/github/callback?code=test_code&state=test_state'
    },
    {
      name: 'POST /api/auth/refresh',
      method: 'POST',
      path: '/api/auth/refresh',
      headers: { 'content-type': 'application/json' }
    },

    // User routes
    { name: 'GET /api/users', method: 'GET', path: '/api/users' },
    {
      name: 'POST /api/users',
      method: 'POST',
      path: '/api/users',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'Bench User',
        email: `bench-user-${Date.now()}@test.com`,
        role: 'freelancer'
      })
    },

    // Job routes
    { name: 'GET /api/jobs', method: 'GET', path: '/api/jobs' },
    {
      name: 'POST /api/jobs',
      method: 'POST',
      path: '/api/jobs',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        title: 'Benchmark Test Job',
        description: 'This job was created by the benchmark suite for performance testing.',
        budgetMin: 100,
        budgetMax: 500,
        categoryId: 'cat_dev',
        skills: ['nodejs', 'benchmark']
      })
    },

    // Proposal routes
    { name: 'GET /api/proposals', method: 'GET', path: '/api/proposals' },
    {
      name: 'POST /api/proposals',
      method: 'POST',
      path: '/api/proposals',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        jobId: 'job_bench_001',
        coverLetter: 'I am a benchmark-generated proposal for performance testing.',
        bidAmount: 350,
        estimatedDays: 7
      })
    },

    // Message routes
    { name: 'GET /api/messages', method: 'GET', path: '/api/messages' },
    {
      name: 'POST /api/messages',
      method: 'POST',
      path: '/api/messages',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        fromUserId: 'usr_bench_001',
        toUserId: 'usr_bench_002',
        content: 'Benchmark test message content for performance measurement.',
        jobId: 'job_bench_001'
      })
    },

    // Review routes
    { name: 'GET /api/reviews', method: 'GET', path: '/api/reviews' },
    {
      name: 'POST /api/reviews',
      method: 'POST',
      path: '/api/reviews',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        jobId: 'job_bench_001',
        reviewerId: 'usr_bench_001',
        revieweeId: 'usr_bench_002',
        rating: 5,
        comment: 'Benchmark test review - excellent performance!'
      })
    },

    // Payment routes
    {
      name: 'POST /api/payments',
      method: 'POST',
      path: '/api/payments',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        amount: 50000,
        currency: 'usd',
        jobId: 'job_bench_001'
      })
    },

    // Search routes
    {
      name: 'GET /api/search',
      method: 'GET',
      path: '/api/search?q=benchmark+test+query'
    },

    // Upload routes (multipart file)
    {
      name: 'POST /api/uploads',
      method: 'POST',
      path: '/api/uploads',
      headers: { 'content-type': 'multipart/form-data' },
      body: buildMultipartBody({ file: { name: 'benchmark-test.txt', data: 'Benchmark file content for upload testing.' } }),
      setupClient: false
    },

    // Notification routes
    { name: 'GET /api/notifications', method: 'GET', path: '/api/notifications' },
    {
      name: 'POST /api/notifications',
      method: 'POST',
      path: '/api/notifications',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        userId: 'usr_bench_001',
        type: 'info',
        title: 'Benchmark Notification',
        message: 'This notification was created by the benchmark suite.'
      })
    },

    // Admin routes (auth-protected)
    {
      name: 'GET /api/admin/metrics',
      method: 'GET',
      path: '/api/admin/metrics',
      headers: { ...authHeader }
    }
  ];
}

// --- Multipart body builder ---
function buildMultipartBody(fields) {
  const boundary = '----BenchmarkBoundary' + Date.now();
  let body = '';
  for (const [name, file] of Object.entries(fields)) {
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="${name}"; filename="${file.name}"\r\n`;
    body += `Content-Type: text/plain\r\n\r\n`;
    body += file.data + '\r\n';
  }
  body += `--${boundary}--\r\n`;
  return body;
}

// --- Run autocannon for a single endpoint ---
function runAutocannon(config) {
  return new Promise((resolve, reject) => {
    const instance = autocannon({
      url: BASE_URL + config.path,
      method: config.method,
      headers: config.headers || {},
      body: config.body || undefined,
      duration,
      connections,
      pipelining: PIPELINING,
      timeout: 30
    });

    instance.on('done', (result) => {
      resolve(result);
    });

    instance.on('error', (err) => {
      reject(err);
    });

    // Track progress
    autocannon.track(instance, { renderProgressBar: false });
  });
}

// --- Load thresholds ---
function loadThresholds() {
  try {
    if (fs.existsSync(THRESHOLDS_PATH)) {
      return JSON.parse(fs.readFileSync(THRESHOLDS_PATH, 'utf-8'));
    }
  } catch (e) {
    console.warn('⚠ Could not load thresholds.json, using empty defaults');
  }
  return {};
}

// --- Main ---
async function main() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║     API Benchmark Suite                 ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log(`\nMode:       ${SMOKE ? 'SMOKE (low concurrency)' : 'FULL'}`);
  console.log(`Base URL:   ${BASE_URL}`);
  console.log(`Duration:   ${duration}s`);
  console.log(`Connections: ${connections}`);
  console.log(`Pipelining:  ${PIPELINING}\n`);

  // Generate auth token
  const testToken = generateTestToken();
  console.log('🔑 Generated test JWT for auth-protected routes\n');

  // Get all endpoints
  const endpoints = getEndpoints(testToken);
  console.log(`📋 Testing ${endpoints.length} endpoints:\n`);
  endpoints.forEach((ep, i) => {
    console.log(`  ${i + 1}. ${ep.name}`);
  });
  console.log('');

  // Ensure results directory
  fs.mkdirSync(RESULTS_DIR, { recursive: true });

  // Load thresholds
  const thresholds = loadThresholds();
  const thresholdViolations = [];

  // Run benchmarks sequentially
  const results = [];
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  for (let i = 0; i < endpoints.length; i++) {
    const ep = endpoints[i];
    console.log(`\n[${i + 1}/${endpoints.length}] Benchmarking: ${ep.name} ...`);

    try {
      const result = await runAutocannon(ep);

      // Extract metrics
      const metrics = {
        endpoint: ep.name,
        method: ep.method,
        path: ep.path,
        timestamp: new Date().toISOString(),
        duration_sec: result.duration,
        connections: result.connections,
        requests_total: result.requests.total,
        latency: {
          p50_ms: result.latency.p50,
          p97_5_ms: result.latency.p97_5,
          p99_ms: result.latency.p99,
          avg_ms: result.latency.average,
          min_ms: result.latency.min,
          max_ms: result.latency.max
        },
        rps: result.requests.average,
        errors: {
          total: result.errors,
          rate_pct: result.requests.total > 0
            ? ((result.errors / result.requests.total) * 100).toFixed(2)
            : '0.00'
        },
        throughput_bytes: result.throughput.average,
        status_2xx: result['2xx'] || 0,
        status_3xx: result['3xx'] || 0,
        status_4xx: result['4xx'] || 0,
        status_5xx: result['5xx'] || 0,
        non2xx: result.non2xx || 0
      };

      results.push(metrics);

      // Write per-endpoint JSON
      const jsonFile = path.join(RESULTS_DIR, `${ep.name.replace(/[\/\s]/g, '_')}_${timestamp}.json`);
      fs.writeFileSync(jsonFile, JSON.stringify(metrics, null, 2));

      // Check threshold
      const threshold = thresholds[ep.name];
      if (threshold && threshold.p99_ms) {
        if (metrics.latency.p99_ms > threshold.p99_ms) {
          const violation = `${ep.name}: p99=${metrics.latency.p99_ms}ms > threshold=${threshold.p99_ms}ms ⚠`;
          thresholdViolations.push(violation);
          console.log(`  ⚠ THRESHOLD VIOLATION: ${violation}`);
        }
      }

      // Print summary for this endpoint
      console.log(`  ✅ ${ep.name}`);
      console.log(`     RPS: ${metrics.rps.toFixed(1)} | p50: ${metrics.latency.p50_ms}ms | p97_5: ${metrics.latency.p97_5_ms}ms | p99: ${metrics.latency.p99_ms}ms | Errors: ${metrics.errors.rate_pct}%`);

    } catch (err) {
      console.error(`  ❌ ${ep.name} FAILED: ${err.message}`);
      results.push({
        endpoint: ep.name,
        method: ep.method,
        path: ep.path,
        timestamp: new Date().toISOString(),
        error: err.message
      });
    }

    // Small delay between benchmarks
    if (i < endpoints.length - 1) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  // --- Generate markdown summary ---
  console.log('\n📊 Generating summary report...\n');
  const summaryMd = generateMarkdownSummary(results, thresholdViolations, {
    duration, connections, pipelining: PIPELINING, smoke: SMOKE
  });
  const summaryPath = path.join(RESULTS_DIR, 'summary.md');
  fs.writeFileSync(summaryPath, summaryMd);

  // Write aggregate JSON
  const aggregatePath = path.join(RESULTS_DIR, `aggregate_${timestamp}.json`);
  fs.writeFileSync(aggregatePath, JSON.stringify(results, null, 2));

  console.log(`\n📁 Results written to: ${RESULTS_DIR}/`);
  console.log(`   - summary.md`);
  console.log(`   - aggregate_${timestamp}.json`);
  console.log(`   - (per-endpoint JSON files)`);

  // Print threshold violations
  if (thresholdViolations.length > 0) {
    console.log('\n⚠️  THRESHOLD VIOLATIONS DETECTED:');
    thresholdViolations.forEach(v => console.log(`   ${v}`));
    console.log('');
  } else {
    console.log('\n✅ All endpoints within p99 thresholds.\n');
  }

  // Exit with appropriate code
  if (thresholdViolations.length > 0 && !SMOKE) {
    console.log('⚠ Threshold violations found. Check results/summary.md for details.');
    process.exitCode = 1;
  }

  return results;
}

// --- Markdown summary generator ---
function generateMarkdownSummary(results, violations, config) {
  const now = new Date().toISOString();
  const hostname = os.hostname();
  const cpus = os.cpus().length;
  const totalMem = Math.round(os.totalmem() / (1024 * 1024 * 1024));

  let md = `# API Benchmark Summary

**Generated:** ${now}
**Mode:** ${config.smoke ? 'Smoke (low concurrency)' : 'Full'}
**Duration:** ${config.duration}s per endpoint
**Connections:** ${config.connections}
**Pipelining:** ${config.pipelining}

## Environment

| Property | Value |
|---|---|
| Hostname | ${hostname} |
| Node.js | ${process.version} |
| OS | ${process.platform} ${process.arch} |
| CPUs | ${cpus} |
| Memory (GB) | ${totalMem} |

## Results Overview

| Endpoint | RPS | p50 (ms) | p97_5 (ms) | p99 (ms) | Errors (%) | Status Codes |
|---|---|---|---|---|---|
`;

  for (const r of results) {
    if (r.error) {
      md += `| ${r.endpoint} | ❌ FAILED | - | - | - | ${r.error} | - |
`;
    } else {
      const codes = [];
      if (r.status_2xx) codes.push(`2xx:${r.status_2xx}`);
      if (r.status_3xx) codes.push(`3xx:${r.status_3xx}`);
      if (r.status_4xx) codes.push(`4xx:${r.status_4xx}`);
      if (r.status_5xx) codes.push(`5xx:${r.status_5xx}`);
      md += `| ${r.endpoint} | ${r.rps.toFixed(1)} | ${r.latency.p50_ms} | ${r.latency.p97_5_ms} | ${r.latency.p99_ms} | ${r.errors.rate_pct} | ${codes.join(', ')} |
`;
    }
  }

  if (violations.length > 0) {
    md += `
## ⚠️ Threshold Violations

`;
    for (const v of violations) {
      md += `- ${v}
`;
    }
  } else {
    md += `
## ✅ Thresholds

All endpoints within p99 thresholds.

`;
  }

  md += `
## Notes

- Benchmarks run sequentially to avoid resource contention
- In-memory data stores mean fresh state for each run
- Auth-protected routes use a pre-generated JWT token
- Upload endpoint uses a small text file as multipart payload
`;

  return md;
}

// --- Start API server and run benchmarks ---
function startApiServer() {
  return new Promise((resolve, reject) => {
    const serverScript = path.join(REPO_ROOT, 'apps', 'api', 'src', 'server.js');
    console.log(`🚀 Starting API server: node ${serverScript}`);

    const env = {
      ...process.env,
      PORT: String(API_PORT),
      JWT_SECRET,
      NODE_ENV: 'development'
    };

    const proc = spawn('node', [serverScript], {
      env,
      cwd: REPO_ROOT,
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: false
    });

    let started = false;
    const timeout = setTimeout(() => {
      if (!started) {
        reject(new Error('API server failed to start within 15s'));
      }
    }, 15000);

    proc.stdout.on('data', (data) => {
      const output = data.toString();
      process.stdout.write(`  [api] ${output}`);
      if (output.includes('API listening') && !started) {
        started = true;
        clearTimeout(timeout);
        // Give it a moment to fully initialize
        setTimeout(() => resolve(proc), 500);
      }
    });

    proc.stderr.on('data', (data) => {
      process.stderr.write(`  [api:err] ${data.toString()}`);
    });

    proc.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });

    proc.on('exit', (code) => {
      if (!started) {
        clearTimeout(timeout);
        reject(new Error(`API server exited with code ${code} before starting`));
      }
    });
  });
}

function stopApiServer(proc) {
  return new Promise((resolve) => {
    if (!proc || proc.killed) {
      resolve();
      return;
    }
    proc.on('exit', () => resolve());
    proc.kill('SIGTERM');
    setTimeout(() => {
      if (!proc.killed) {
        proc.kill('SIGKILL');
      }
      resolve();
    }, 3000);
  });
}

// Wait for server to be ready
async function waitForServer(url, retries = 30, delay = 500) {
  for (let i = 0; i < retries; i++) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(url + '/health', (res) => {
          if (res.statusCode === 200) resolve(true);
          else reject(new Error(`Status ${res.statusCode}`));
        });
        req.on('error', reject);
        req.setTimeout(2000, () => { req.destroy(); reject(new Error('timeout')); });
      });
      console.log('✅ API server is healthy\n');
      return;
    } catch {
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw new Error('API server health check failed');
}

// --- Entrypoint ---
(async () => {
  let serverProc = null;

  try {
    // Check if server is already running
    let serverRunning = false;
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(`${BASE_URL}/health`, (res) => {
          serverRunning = res.statusCode === 200;
          resolve();
        });
        req.on('error', () => resolve());
        req.setTimeout(3000, () => { req.destroy(); resolve(); });
      });
    } catch { /* ignore */ }

    if (!serverRunning) {
      serverProc = await startApiServer();
      await waitForServer(BASE_URL);
    } else {
      console.log('✅ API server already running on', BASE_URL, '\n');
    }

    await main();

  } catch (err) {
    console.error('❌ Benchmark suite failed:', err.message);
    process.exitCode = 1;
  } finally {
    if (serverProc) {
      console.log('\n🛑 Stopping API server...');
      await stopApiServer(serverProc);
      console.log('✅ API server stopped.');
    }
  }
})();
