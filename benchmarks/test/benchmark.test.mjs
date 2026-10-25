import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { once } from 'node:events';
import { readFile } from 'node:fs/promises';
import { percentile, targetUrl, measure, violations, assertCoverage, discoverEndpoints, payload } from '../lib.mjs';
const limits = { default: { p99Ms: 100, maxErrorRatePercent: 0 } };
test('percentiles use nearest rank and empty samples are explicit', () => {
  assert.equal(percentile([20, 1, 10, 5], .5), 5);
  assert.equal(percentile([20, 1, 10, 5], .99), 20);
  assert.equal(percentile([], .99), null);
});
test('manifest exactly covers current API routes and cannot silently drop a route', async () => {
  const endpoints = JSON.parse(await readFile(new URL('../endpoints.json', import.meta.url)));
  const discovered = await discoverEndpoints(new URL('../../', import.meta.url));
  assert.equal(discovered.length, 20);
  assertCoverage(endpoints, discovered);
  assert.throws(() => assertCoverage(endpoints.slice(1), discovered));
  assert.throws(() => assertCoverage([...endpoints, endpoints[0]], discovered));
  assert.equal(payload(endpoints.find(e => e.uploadBytes)).body.includes(Buffer.from('filename="benchmark.txt"')), true);
});
test('targets reject accidental remote loads and credentials', () => {
  assert.equal(targetUrl('http://127.0.0.1:1234', false).port, '1234');
  assert.throws(() => targetUrl('https://example.org', false));
  assert.throws(() => targetUrl('https://a:secret@example.org', true));
  assert.throws(() => targetUrl('file:///tmp/test', true));
  assert.throws(() => targetUrl('http://localhost/path', false));
});
test('real HTTP workload measures body latency and headers, and fails on drift/errors/timeouts', async t => {
  const server = http.createServer((req, res) => {
    if (req.url === '/timeout') return;
    res.writeHead(req.url === '/error' ? 500 : 200);
    res.flushHeaders();
    setTimeout(() => res.end('body'), 25);
  });
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  t.after(() => { server.closeAllConnections(); server.close(); });
  const target = new URL(`http://127.0.0.1:${server.address().port}`);
  const options = { requests: 8, concurrency: 2, timeoutMs: 500 };
  const endpoint = { method: 'GET', path: '/', expectedStatus: 200 };
  const success = await measure(target, endpoint, options);
  assert.equal(success.requests, 8); assert.equal(success.errorRatePercent, 0);
  assert.ok(success.p50Ms >= 20); assert.ok(success.ttfbP50Ms < success.p50Ms);
  assert.ok(success.sustainedRps > 0); assert.ok(success.peakRps >= success.sustainedRps * .9);
  assert.deepEqual(violations(success, limits, false), []);
  assert.equal(violations(success, { default: { p99Ms: 1, maxErrorRatePercent: 0 } }, false).length, 1);
  const failure = await measure(target, { ...endpoint, path: '/error' }, options);
  assert.equal(failure.errorRatePercent, 100); assert.equal(failure.statuses[500], 8);
  assert.equal(violations(failure, limits, false).length, 1);
  const timeout = await measure(target, { ...endpoint, path: '/timeout' }, { ...options, requests: 2, timeoutMs: 30 });
  assert.equal(timeout.errorRatePercent, 100); assert.equal(timeout.statuses.network_error, 2);
  assert.equal(timeout.ttfbP50Ms, null);
});


test('ordinary API retains the default 200-request limit', async t => {
  const { createApp } = await import('../../apps/api/src/app.js');
  const server = createApp().listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => { server.closeAllConnections(); server.close(); });
  const result = await measure(new URL(`http://127.0.0.1:${server.address().port}`),
    { method: 'GET', path: '/health', expectedStatus: 200 },
    { requests: 201, concurrency: 4, timeoutMs: 1000 });
  assert.equal(result.statuses[200], 200);
  assert.equal(result.statuses[429], 1);
});
