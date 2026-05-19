import autocannon from 'autocannon';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TARGET = process.env.BENCHMARK_HOST || 'http://localhost:3000';
const DURATION = parseInt(process.env.BENCHMARK_DURATION || '15');
const CONNECTIONS = parseInt(process.env.BENCHMARK_CONNECTIONS || '20');

const ENDPOINTS = [
  { name: 'GET /api', path: '/api', method: 'GET', payload: null },
  { name: 'POST /api/auth/login', path: '/api/auth/login', method: 'POST', payload: { email: 'bench@test.com', password: 'bench123' } },
  { name: 'GET /api/users', path: '/api/users', method: 'GET', payload: null },
  { name: 'POST /api/jobs', path: '/api/jobs', method: 'POST', payload: { title: 'bench job', description: 'benchmark test', budget: 100, category: 'test', location: 'remote' } },
  { name: 'GET /api/search', path: '/api/search?q=test', method: 'GET', payload: null },
  { name: 'POST /api/proposals', path: '/api/proposals', method: 'POST', payload: { jobId: '123', coverLetter: 'bench', rate: 50 } },
  { name: 'GET /api/messages', path: '/api/messages', method: 'GET', payload: null },
  { name: 'POST /api/payments', path: '/api/payments', method: 'POST', payload: { amount: 100, currency: 'USD', method: 'credit' } },
  { name: 'GET /api/reviews', path: '/api/reviews', method: 'GET', payload: null },
  { name: 'GET /api/notifications', path: '/api/notifications', method: 'GET', payload: null },
];

async function runBenchmark(endpoint) {
  const opts = {
    url: `${TARGET}${endpoint.path}`,
    method: endpoint.method,
    connections: CONNECTIONS,
    duration: DURATION,
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer bench-token' },
    ...(endpoint.payload ? { body: JSON.stringify(endpoint.payload) } : {}),
  };

  return new Promise((resolve, reject) => {
    autocannon(opts, (err, result) => {
      if (err) return reject(err);
      resolve({
        endpoint: endpoint.name,
        path: endpoint.path,
        method: endpoint.method,
        latency: {
          p50: result.latency.p50,
          p95: result.latency.p95,
          p99: result.latency.p99,
          average: result.latency.average,
          min: result.latency.min,
          max: result.latency.max,
        },
        requests: {
          total: result.requests.total,
          average: result.requests.average,
          sent: result.requests.sent,
        },
        throughput: {
          average: result.throughput.average,
          total: result.throughput.total,
        },
        errors: result.errors,
        timeouts: result.timeouts,
        duration: result.duration,
        connections: result.connections,
        non2xx: result.non2xx,
        '1xx': result['1xx'],
        '2xx': result['2xx'],
        '3xx': result['3xx'],
        '4xx': result['4xx'],
        '5xx': result['5xx'],
        statusCodes: result.statusCodes,
      });
    });
  });
}

async function main() {
  console.log(`🔬 Benchmark Suite — Target: ${TARGET}`);
  console.log(`   Duration: ${DURATION}s | Connections: ${CONNECTIONS}\n`);

  const results = [];
  for (const ep of ENDPOINTS) {
    process.stdout.write(`  📡 ${ep.name}... `);
    try {
      const r = await runBenchmark(ep);
      results.push(r);
      // Calculate RPS
      const rps = r.requests.total > 0 ? (r.requests.total / r.duration).toFixed(2) : 0;
      const errorRate = r.requests.total > 0 ? ((r.errors / r.requests.total) * 100).toFixed(2) : 0;
      const status = r.non2xx > r.requests.total * 0.1 ? '⚠️' : '✅';
      console.log(`${status} p50=${r.latency.p50.toFixed(1)}ms p95=${r.latency.p95.toFixed(1)}ms p99=${r.latency.p99.toFixed(1)}ms RPS=${rps} err=${errorRate}%`);
    } catch (e) {
      console.log(`❌ ${e.message}`);
      results.push({ endpoint: ep.name, error: e.message });
    }
  }

  // Build report
  const summary = results.filter(r => !r.error).map(r => ({
    endpoint: r.endpoint,
    p50: r.latency.p50.toFixed(1),
    p95: r.latency.p95.toFixed(1),
    p99: r.latency.p99.toFixed(1),
    avg: r.latency.average.toFixed(1),
    rps: (r.requests.total / r.duration).toFixed(2),
    errorRate: ((r.errors / r.requests.total) * 100).toFixed(2),
    totalRequests: r.requests.total,
    non2xx: r.non2xx,
  }));

  const markdown = `# API Benchmark Report
- **Date:** ${new Date().toISOString()}
- **Target:** ${TARGET}
- **Duration:** ${DURATION}s
- **Connections:** ${CONNECTIONS}

## Results

| Endpoint | Method | p50 (ms) | p95 (ms) | p99 (ms) | Avg (ms) | RPS | Error Rate | Non-2xx |
|----------|--------|:--------:|:--------:|:--------:|:--------:|:---:|:----------:|:-------:|
${summary.map(r => `| ${r.endpoint} | ${r.endpoint.split(' ')[0]} | ${r.p50} | ${r.p95} | ${r.p99} | ${r.avg} | ${r.rps} | ${r.errorRate}% | ${r.non2xx} |`).join('\n')}

## Summary
- **Total endpoints tested:** ${ENDPOINTS.length}
- **Successful:** ${summary.length}
- **Failed:** ${ENDPOINTS.length - summary.length}
- **Average p50 latency across all endpoints:** ${(summary.reduce((a, r) => a + parseFloat(r.p50), 0) / summary.length).toFixed(1)}ms
- **Total requests sent:** ${summary.reduce((a, r) => a + r.totalRequests, 0)}
`;

  // Save results
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  fs.writeFileSync(path.join(__dirname, '..', 'benchmarks', 'results', `benchmark-${ts}.json`), JSON.stringify(results, null, 2));
  fs.writeFileSync(path.join(__dirname, '..', 'benchmarks', 'results', `benchmark-${ts}.md`), markdown);
  fs.writeFileSync(path.join(__dirname, '..', 'benchmarks', 'results', 'latest.md'), markdown);

  console.log(`\n📊 Report saved to benchmarks/benchmarks/results/benchmark-${ts}.md`);
  console.log(markdown);
}

main().catch(console.error);
