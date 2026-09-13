import autocannon from 'autocannon';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BASE_URL = process.env.BENCHMARK_URL || 'http://localhost:4000';
const DURATION = parseInt(process.env.BENCHMARK_DURATION || '10');
const CONNECTIONS = parseInt(process.env.BENCHMARK_CONNECTIONS || '10');
const endpoints = [
  { name: 'health', method: 'GET', path: '/health' },
  { name: 'register', method: 'POST', path: '/api/auth/register', body: JSON.stringify({email:'b@t.com',password:'Test1234!',name:'T'}), headers:{'Content-Type':'application/json'} },
  { name: 'login', method: 'POST', path: '/api/auth/login', body: JSON.stringify({email:'b@t.com',password:'Test1234!'}), headers:{'Content-Type':'application/json'} },
  { name: 'list_jobs', method: 'GET', path: '/api/jobs' },
  { name: 'search', method: 'GET', path: '/api/search?q=test' }
];
async function bench(ep) {
  return new Promise((res, rej) => {
    const inst = autocannon({ url: BASE_URL+ep.path, method: ep.method, body: ep.body, headers: ep.headers||{}, duration: DURATION, connections: CONNECTIONS });
    inst.on('done', r => res({
      endpoint: ep.name,
      path: ep.path,
      method: ep.method,
      duration: DURATION,
      connections: CONNECTIONS,
      latency: {
        avg: r.latency.average,
        p50: r.latency.p50,
        p95: r.latency.p975 || r.latency.p99,
        p99: r.latency.p99,
        max: r.latency.max
      },
      requests: {
        avg: r.requests.average,
        total: r.requests.total
      },
      throughput: {
        avg: r.throughput.average,
        total: r.throughput.total
      },
      errors: r.errors,
      timeouts: r.timeouts,
      non2xx: r.non2xx,
      ttfb: r.throughput.average > 0 ? (1000 / r.requests.average) : 0
    }));
    inst.on('error', rej);
  });
}
async function main() {
  console.log('\nFreelanceFlow Benchmark');
  console.log('Target: ' + BASE_URL);
  console.log('Duration: ' + DURATION + 's | Connections: ' + CONNECTIONS + '\n');
  const results = [];
  for (const ep of endpoints) {
    process.stdout.write('Testing ' + ep.name + '... ');
    try {
      const r = await bench(ep);
      results.push(r);
      console.log('OK p99=' + r.latency.p99 + 'ms RPS=' + r.requests.avg.toFixed(1));
    } catch(e) {
      console.log('ERR ' + e.message);
    }
  }
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const outDir = path.join(__dirname, 'results');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, {recursive:true});
  fs.writeFileSync(path.join(outDir, 'benchmark-'+ts+'.json'), JSON.stringify({timestamp:new Date().toISOString(),baseUrl:BASE_URL,results},null,2));
  const th = JSON.parse(fs.readFileSync(path.join(__dirname,'thresholds.json'),'utf-8'));
  let fail = false;
  for (const r of results) {
    if (r.latency.p99 > th.p99_ms) { console.log('WARN '+r.endpoint+': p99 '+r.latency.p99+'ms > '+th.p99_ms+'ms'); fail=true; }
    if (r.errors > 0) { console.log('WARN '+r.endpoint+': '+r.errors+' errors'); fail=true; }
  }
  if (fail) { console.log('\nThresholds exceeded!'); process.exit(1); }
  else console.log('\nAll thresholds passed!');
}
main().catch(console.error);
