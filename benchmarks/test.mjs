import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import http from 'node:http';
import { apiLimiter } from '../apps/api/src/middleware/rateLimit.js';
import { createApp } from '../apps/api/src/app.js';
import { cases, key, payload } from './cases.mjs';
import { percentile, request, measure, failures } from './metrics.mjs';

test('fixture inventory exactly matches mounted API methods and paths', () => {
  const app = createApp(); const actual = [];
  for (const layer of app._router.stack) {
    if (!layer.handle.stack) continue;
    const prefix = layer.regexp.source.slice(1).split('\\/?')[0].replaceAll('\\/', '/').slice(1);
    assert.ok(prefix, `unrecognised API mount: ${layer.regexp}`);
    for (const route of layer.handle.stack.filter(x=>x.route).map(x=>x.route)) {
      for (const method of Object.keys(route.methods)) {
        const path = route.path === '/' ? '' : route.path;
        actual.push(`${method.toUpperCase()} /${prefix}${path}`.replace(':provider', 'github'));
      }
    }
  }
  assert.deepEqual(cases.map(c=>key(c).split('?')[0]).sort(), actual.sort());
  assert.equal(new Set(cases.map(key)).size, cases.length);
  assert.ok(payload(cases.find(c=>c.upload)).data.length >= 16000);
});

test('nearest-rank percentiles and gate reject slow, erroneous, empty runs', () => {
  assert.equal(percentile([3,1,2,100],.95),100);
  assert.equal(percentile([3,1,2,100],.50),2);
  assert.equal(percentile([], .99),null);
  const good = { endpoint:'GET /test', requests:10, latencyMs:{p99:5}, errorRatePercent:0 };
  const thresholds = { default:{p99Ms:10,errorRatePercent:0} };
  assert.deepEqual(failures([good],thresholds),[]);
  for (const change of [{latencyMs:{p99:11}}, {errorRatePercent:1}, {requests:0}, {latencyMs:{p99:null}}]) {
    assert.deepEqual(failures([{...good,...change}],thresholds),['GET /test']);
  }
  assert.deepEqual(failures([good],{...thresholds,endpoints:{'GET /test':{p99Ms:1,errorRatePercent:0}}}),['GET /test']);
});

test('TTFB precedes body completion; timeout is a transport error', async t => {
  const server = http.createServer((req,res)=> {
    if(req.url==='/hang') return;
    res.writeHead(200); res.flushHeaders(); setTimeout(()=>res.end('done'),60);
  }).listen(0,'127.0.0.1'); await once(server,'listening');
  t.after(()=>{server.closeAllConnections();server.close();});
  const base = `http://127.0.0.1:${server.address().port}`;
  const sample = await request(new URL(base),{ method:'GET' });
  assert.equal(sample.status,200); assert.ok(sample.latency - sample.ttfb > 40);
  const timeout = await request(new URL(base+'/hang'),{method:'GET',timeout:30});
  assert.equal(timeout.status,0); assert.equal(timeout.ttfb,null);
  const result = await measure(new URL(base),{method:'GET'}, {duration:.1,concurrency:2,expected:201});
  assert.ok(result.requests >= 2); assert.equal(result.errorRatePercent,100);
  assert.ok(result.sustainedRps > 0); assert.equal(result.peakRps,null);
});

test('production limiter stays enabled; benchmark opt-out retains authentication', async t => {
  const production = createApp();
  assert.ok(production._router.stack.some(l=>l.handle===apiLimiter));
  const local = createApp({ enableRateLimit:false });
  assert.ok(!local._router.stack.some(l=>l.handle===apiLimiter));
  const server = local.listen(0,'127.0.0.1'); await once(server,'listening');
  t.after(()=>{server.closeAllConnections();server.close();});
  const res = await fetch(`http://127.0.0.1:${server.address().port}/api/admin/metrics`);
  assert.equal(res.status,401);
});
