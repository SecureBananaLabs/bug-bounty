import { URL } from 'node:url';

const BASE_URL = process.env.API_URL || 'http://127.0.0.1:3000';
const CONCURRENCY = parseInt(process.env.CONCURRENCY || '10');
const DURATION_SEC = parseInt(process.env.DURATION_SEC || '10');
const WARMUP_SEC = parseInt(process.env.WARMUP_SEC || '2');

// All API endpoints to benchmark
const ENDPOINTS = [
  { method: 'GET', path: '/health', name: 'health' },
  { method: 'POST', path: '/api/auth/login', name: 'auth-login', body: { email: 'test@test.com', password: 'test' } },
  { method: 'GET', path: '/api/jobs', name: 'jobs-list' },
  { method: 'GET', path: '/api/users', name: 'users-list' },
  { method: 'GET', path: '/api/search', name: 'search' },
  { method: 'GET', path: '/api/proposals', name: 'proposals-list' },
  { method: 'GET', path: '/api/reviews', name: 'reviews-list' },
  { method: 'GET', path: '/api/messages', name: 'messages-list' },
  { method: 'GET', path: '/api/notifications', name: 'notifications-list' },
];

async function makeRequest(method, path, body = null) {
  const start = performance.now();
  try {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    options.signal = controller.signal;
    
    const res = await fetch(url.toString(), options);
    clearTimeout(timeout);
    const elapsed = performance.now() - start;
    if (!res.ok) {
      return { status: res.status, elapsed, error: `HTTP ${res.status}` };
    }
    return { status: res.status, elapsed, error: null };
  } catch (err) {
    const elapsed = performance.now() - start;
    return { status: 0, elapsed, error: err.message };
  }
}

async function runBenchmark(endpoint) {
  const results = [];
  const errors = [];
  let totalRequests = 0;
  
  const startTime = Date.now();
  const endTime = startTime + (DURATION_SEC * 1000);
  
  // Run concurrent requests
  const workers = Array(CONCURRENCY).fill().map(async () => {
    while (Date.now() < endTime) {
      const result = await makeRequest(endpoint.method, endpoint.path, endpoint.body);
      totalRequests++;
      if (result.error) {
        errors.push(result.error);
      } else {
        results.push(result.elapsed);
      }
    }
  });
  
  await Promise.all(workers);
  
  // Calculate statistics
  results.sort((a, b) => a - b);
  const count = results.length;
  
  if (count === 0) {
    return {
      endpoint: endpoint.name,
      path: endpoint.path,
      method: endpoint.method,
      totalRequests,
      successfulRequests: 0,
      errors: errors.length,
      errorRate: 1.0,
      rps: 0,
      p50: 0, p95: 0, p99: 0,
      avg: 0, min: 0, max: 0,
    };
  }
  
  const sum = results.reduce((a, b) => a + b, 0);
  const actualDuration = (Date.now() - startTime) / 1000;
  
  return {
    endpoint: endpoint.name,
    path: endpoint.path,
    method: endpoint.method,
    totalRequests,
    successfulRequests: count,
    errors: errors.length,
    errorRate: errors.length / totalRequests,
    rps: Math.round(count / actualDuration),
    p50: results[Math.floor(count * 0.5)],
    p95: results[Math.floor(count * 0.95)],
    p99: results[Math.floor(count * 0.99)],
    avg: sum / count,
    min: results[0],
    max: results[count - 1],
    ttfb: results[0], // Time to first byte approximation
  };
}

function formatReport(allResults) {
  const lines = [];
  lines.push('# API Benchmark Report');
  lines.push(`\nGenerated: ${new Date().toISOString()}`);
  lines.push(`Base URL: ${BASE_URL}`);
  lines.push(`Concurrency: ${CONCURRENCY}`);
  lines.push(`Duration: ${DURATION_SEC}s per endpoint`);
  lines.push(`\n## Summary\n`);
  lines.push('| Endpoint | Method | RPS | p50 (ms) | p95 (ms) | p99 (ms) | Avg (ms) | Error Rate |');
  lines.push('|----------|--------|-----|-----------|-----------|-----------|----------|------------|');
  
  for (const r of allResults) {
    const errRate = (r.errorRate * 100).toFixed(1);
    lines.push(`| ${r.endpoint} | ${r.method} | ${r.rps} | ${r.p50.toFixed(1)} | ${r.p95.toFixed(1)} | ${r.p99.toFixed(1)} | ${r.avg.toFixed(1)} | ${errRate}% |`);
  }
  
  lines.push('\n## Detailed Results\n');
  for (const r of allResults) {
    lines.push(`### ${r.endpoint} (${r.method} ${r.path})\n`);
    lines.push(`- **Throughput**: ${r.rps} req/s`);
    lines.push(`- **Total Requests**: ${r.totalRequests}`);
    lines.push(`- **Successful**: ${r.successfulRequests || r.totalRequests}`);
    lines.push(`- **Errors**: ${r.errors} (${(r.errorRate * 100).toFixed(1)}%)`);
    lines.push(`- **Latency p50**: ${r.p50.toFixed(2)} ms`);
    lines.push(`- **Latency p95**: ${r.p95.toFixed(2)} ms`);
    lines.push(`- **Latency p99**: ${r.p99.toFixed(2)} ms`);
    lines.push(`- **Latency Avg**: ${r.avg.toFixed(2)} ms`);
    lines.push(`- **Latency Min**: ${r.min.toFixed(2)} ms`);
    lines.push(`- **Latency Max**: ${r.max.toFixed(2)} ms`);
    lines.push('');
  }
  
  // Identify bottlenecks
  lines.push('## Bottleneck Analysis\n');
  const sorted = [...allResults].sort((a, b) => b.p95 - a.p95);
  lines.push('Endpoints sorted by p95 latency (highest first):\n');
  for (let i = 0; i < sorted.length; i++) {
    const r = sorted[i];
    let severity;
    if (r.errorRate > 0.5) {
      severity = '🔴 CRITICAL';
    } else if (r.p95 > 1000 || r.errorRate > 0.1) {
      severity = '🟡 WARNING';
    } else {
      severity = '🟢 OK';
    }
    lines.push(`${i+1}. **${r.endpoint}** - p95: ${r.p95.toFixed(1)}ms, error rate: ${(r.errorRate * 100).toFixed(1)}% ${severity}`);
  }
  
  return lines.join('\n');
}

async function main() {
  console.error(`Benchmarking ${BASE_URL}...`);
  console.error(`Endpoints: ${ENDPOINTS.length}, Concurrency: ${CONCURRENCY}, Duration: ${DURATION_SEC}s, Warmup: ${WARMUP_SEC}s\n`);

  // Warmup phase: send requests for WARMUP_SEC seconds before measuring
  if (WARMUP_SEC > 0) {
    console.error(`Warming up for ${WARMUP_SEC}s...`);
    const warmupEnd = Date.now() + (WARMUP_SEC * 1000);
    const warmupWorkers = Array(CONCURRENCY).fill().map(async () => {
      while (Date.now() < warmupEnd) {
        for (const ep of ENDPOINTS) {
          if (Date.now() >= warmupEnd) break;
          await makeRequest(ep.method, ep.path, ep.body).catch(() => {});
        }
      }
    });
    await Promise.all(warmupWorkers);
    console.error('Warmup complete.\n');
  }

  const allResults = [];

  for (const endpoint of ENDPOINTS) {
    console.error(`Benchmarking ${endpoint.method} ${endpoint.path}...`);
    const result = await runBenchmark(endpoint);
    allResults.push(result);
    console.error(`  RPS: ${result.rps}, p50: ${result.p50.toFixed(1)}ms, p95: ${result.p95.toFixed(1)}ms, Errors: ${result.errors}`);
  }
  
  const report = formatReport(allResults);
  
  // Output report to stdout
  console.log(report);
  
  // Also save to file (relative to cwd for portability)
  const fs = await import('node:fs');
  const outputDir = process.env.BENCHMARK_OUTPUT_DIR || process.cwd();
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(`${outputDir}/benchmark-report.md`, report);
  fs.writeFileSync(`${outputDir}/benchmark-results.json`, JSON.stringify(allResults, null, 2));
  
  console.error('\n✅ Report saved to benchmark-report.md and benchmark-results.json');
}

main().catch(err => {
  console.error('Benchmark error:', err);
  process.exit(1);
});
