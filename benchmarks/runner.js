const autocannon = require('autocannon');
const fs = require('fs');
const path = require('path');

// Load env configurations
let host = 'http://localhost:5000';
let token = 'test_token';

try {
  const envPath = path.join(__dirname, '.env.benchmark');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const hostMatch = envContent.match(/BENCHMARK_HOST=(.+)/);
    const tokenMatch = envContent.match(/BENCHMARK_TOKEN=(.+)/);
    if (hostMatch) host = hostMatch[1].trim();
    if (tokenMatch) token = tokenMatch[1].trim();
  }
} catch (e) {
  console.log('⚠️ Could not load .env.benchmark, using default configurations.');
}

console.log('🏁 Starting SecureBananaLabs API Benchmark Suite');
console.log(`🌐 Target Host: ${host}`);
console.log('--------------------------------------------------\n');

const endpoints = [
  { name: 'POST /api/auth/register', path: '/api/auth/register', method: 'POST', body: JSON.stringify({ email: 'bench@test.com', password: 'Password123!', name: 'Benchmarker' }), headers: { 'Content-Type': 'application/json' } },
  { name: 'POST /api/auth/login', path: '/api/auth/login', method: 'POST', body: JSON.stringify({ email: 'bench@test.com', password: 'Password123!' }), headers: { 'Content-Type': 'application/json' } },
  { name: 'GET /api/jobs', path: '/api/jobs', method: 'GET' },
  { name: 'GET /api/jobs/:id', path: '/api/jobs/1', method: 'GET' },
  { name: 'POST /api/jobs', path: '/api/jobs', method: 'POST', body: JSON.stringify({ title: 'Benchmarking task', description: 'Measure Express server performance', budget: 500 }), headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } },
  { name: 'GET /api/proposals', path: '/api/proposals', method: 'GET', headers: { 'Authorization': `Bearer ${token}` } },
  { name: 'POST /api/proposals', path: '/api/proposals', method: 'POST', body: JSON.stringify({ jobId: 1, bidAmount: 450, coverLetter: 'Automated performance benchmark proposal' }), headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } },
  { name: 'GET /api/payments', path: '/api/payments', method: 'GET', headers: { 'Authorization': `Bearer ${token}` } },
  { name: 'POST /api/payments', path: '/api/payments', method: 'POST', body: JSON.stringify({ jobId: 1, amount: 450 }), headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } },
  { name: 'GET /api/messages', path: '/api/messages', method: 'GET', headers: { 'Authorization': `Bearer ${token}` } },
  { name: 'POST /api/messages', path: '/api/messages', method: 'POST', body: JSON.stringify({ receiverId: 2, content: 'Ping under heavy load benchmark' }), headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } },
  { name: 'GET /api/reviews', path: '/api/reviews', method: 'GET' },
  { name: 'GET /api/notifications', path: '/api/notifications', method: 'GET', headers: { 'Authorization': `Bearer ${token}` } },
  { name: 'GET /api/users/profile', path: '/api/users/profile', method: 'GET', headers: { 'Authorization': `Bearer ${token}` } }
];

async function runBenchmark(endpoint) {
  return new Promise((resolve) => {
    console.log(`🚀 Benchmarking [${endpoint.name}]...`);
    autocannon({
      url: `${host}${endpoint.path}`,
      connections: 10,
      duration: 5,
      method: endpoint.method,
      body: endpoint.body,
      headers: endpoint.headers
    }, (err, result) => {
      if (err) {
        console.error(`❌ Error benchmarking ${endpoint.name}:`, err);
        resolve({ name: endpoint.name, error: true });
        return;
      }
      console.log(`   ✨ RPS: ${result.requests.average.toFixed(1)} | p50: ${result.latency.p50}ms | p95: ${result.latency.p95}ms | p99: ${result.latency.p99}ms | Errors: ${result.errors}\n`);
      resolve({
        name: endpoint.name,
        rps: result.requests.average,
        p50: result.latency.p50,
        p95: result.latency.p95,
        p99: result.latency.p99,
        errors: result.errors,
        ttfb: result.latency.average,
        error: false
      });
    });
  });
}

async function runAll() {
  const reports = [];
  for (const endpoint of endpoints) {
    const rep = await runBenchmark(endpoint);
    reports.push(rep);
  }

  console.log('\n================================================================================');
  console.log('📊 BENCHMARK METRICS SUMMARY CARD');
  console.log('================================================================================');
  console.log(`${'Endpoint Name'.padEnd(30)} | ${'Avg RPS'.padEnd(8)} | ${'p50 (ms)'.padEnd(8)} | ${'p95 (ms)'.padEnd(8)} | ${'p99 (ms)'.padEnd(8)} | ${'Errors'.padEnd(6)}`);
  console.log('-'.repeat(80));
  
  reports.forEach(r => {
    if (r.error) {
      console.log(`${r.name.padEnd(30)} | ERROR`);
    } else {
      console.log(`${r.name.padEnd(30)} | ${r.rps.toFixed(1).padEnd(8)} | ${r.p50.toString().padEnd(8)} | ${r.p95.toString().padEnd(8)} | ${r.p99.toString().padEnd(8)} | ${r.errors.toString().padEnd(6)}`);
    }
  });
  console.log('================================================================================\n');
}

runAll();
