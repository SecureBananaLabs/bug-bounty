const autocannon = require('autocannon');
const { PassThrough } = require('stream');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const ENDPOINTS = [
  { method: 'GET', path: '/api/health', body: null },
  { method: 'POST', path: '/api/auth/login', body: { email: 'test@test.com', password: 'test123' } },
  { method: 'POST', path: '/api/auth/register', body: { name: 'Benchmark', email: 'bench@test.com', password: 'pass123', role: 'client' } },
  { method: 'GET', path: '/api/jobs', body: null },
  { method: 'GET', path: '/api/jobs?page=1&limit=10', body: null },
  { method: 'GET', path: '/api/freelancers', body: null },
  { method: 'GET', path: '/api/freelancers/search?q=developer', body: null },
  { method: 'GET', path: '/api/reviews', body: null },
  { method: 'GET', path: '/api/search?q=test', body: null },
  { method: 'GET', path: '/api/messages', body: null },
  { method: 'GET', path: '/api/notifications', body: null },
];

function createPayload(method, path, body) {
  const payload = { url: BASE_URL + path, connections: 10, pipelining: 1, duration: 10, method };
  if (body) payload.body = JSON.stringify(body);
  payload.headers = { 'Content-Type': 'application/json' };
  return payload;
}

async function runBenchmark(endpoint) {
  return new Promise((resolve, reject) => {
    const instance = autocannon(createPayload(endpoint.method, endpoint.path, endpoint.body), (err, result) => {
      if (err) return reject(err);
      resolve({
        endpoint: endpoint.method + ' ' + endpoint.path,
        latency: { p50: result.latency.p50, p95: result.latency.p95, p99: result.latency.p99 },
        requests: { sent: result.requests.sent, total: result.requests.total, avg: result.requests.average },
        throughput: result.throughput.average,
        errors: result.errors,
        timeouts: result.timeouts,
        statusCodes: result.statusCodeStats,
      });
    });
    autocannon.track(instance, { renderProgressBar: false, renderResultsTable: false });
  });
}

async function main() {
  console.log('Starting API benchmarks...\n');
  const results = [];
  for (const ep of ENDPOINTS) {
    console.log('Benchmarking ' + ep.method + ' ' + ep.path + '...');
    try {
      const r = await runBenchmark(ep);
      results.push(r);
      console.log('  p50=' + r.latency.p50.toFixed(1) + 'ms p95=' + r.latency.p95.toFixed(1) + 'ms p99=' + r.latency.p99.toFixed(1) + 'ms RPS=' + (r.requests.avg || 0).toFixed(0));
    } catch (e) {
      console.log('  FAILED: ' + e.message);
    }
  }

  const report = { timestamp: new Date().toISOString(), baseUrl: BASE_URL, results };
  require('fs').writeFileSync('./benchmark-report.json', JSON.stringify(report, null, 2));
  console.log('\nReport saved to benchmark-report.json');
}

main().catch(console.error);