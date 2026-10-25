import http from 'node:http';
import https from 'node:https';
import { readFile } from 'node:fs/promises';
import { performance } from 'node:perf_hooks';

export function positiveInteger(value, fallback, maximum) {
  const n = value === undefined || value === '' ? fallback : Number(value);
  if (!Number.isSafeInteger(n) || n < 1 || n > maximum) throw new Error(`Expected integer 1..${maximum}, got ${value}`);
  return n;
}
export function targetUrl(value, allowRemote) {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash || url.pathname !== '/') {
    throw new Error('Target must be an HTTP(S) origin without credentials, path, query or fragment');
  }
  if (!['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) && !allowRemote) throw new Error('Remote staging target requires BENCHMARK_ALLOW_REMOTE=true');
  return url;
}
export function percentile(values, fraction) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.max(0, Math.ceil(fraction * sorted.length) - 1)];
}
const normalize = path => path.replace(/\/$/, '');
export async function discoverEndpoints(root) {
  const app = await readFile(new URL('apps/api/src/app.js', root), 'utf8');
  const mounts = new Map([...app.matchAll(/app\.use\("(\/api\/[^"\n]+)",\s*(\w+)\)/g)].map(m => [m[2], m[1]]));
  if (!mounts.size) throw new Error('No API mounts discovered; update the inventory reader for changed route syntax');
  const imports = new Map([...app.matchAll(/import\s*\{\s*(\w+)\s*\}\s*from\s*"(\.\/routes\/[^"\n]+)"/g)].map(m => [m[1], m[2]]));
  const keys = [];
  for (const [name, prefix] of mounts) {
    if (!imports.has(name)) throw new Error(`Cannot resolve API router ${name}`);
    const source = await readFile(new URL('apps/api/src/' + imports.get(name).slice(2), root), 'utf8');
    const routes = [...source.matchAll(/\.((?:get|post|put|patch|delete|head|options))\("([^"\n]+)"/g)];
    if (!routes.length) throw new Error(`No routes discovered for ${name}; inspect changed route syntax`);
    keys.push(...routes.map(m => `${m[1].toUpperCase()} ${normalize(prefix + m[2])}`));
  }
  keys.push(...[...app.matchAll(/app\.(get|post|put|patch|delete|head|options)\("(\/api[^"\n]*)"/g)].map(m => `${m[1].toUpperCase()} ${normalize(m[2])}`));
  return keys.sort();
}
export function assertCoverage(endpoints, discovered) {
  const actual = endpoints.map(e => `${e.method} ${e.path}`).sort();
  if (new Set(actual).size !== actual.length || JSON.stringify(actual) !== JSON.stringify(discovered)) {
    throw new Error(`Endpoint manifest differs from API routes. Manifest: ${actual.join(', ')}; API: ${discovered.join(', ')}`);
  }
}
export function payload(endpoint) {
  if (endpoint.uploadBytes) {
    const boundary = 'benchmark-boundary-30';
    return { body: Buffer.concat([Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="benchmark.txt"\r\nContent-Type: text/plain\r\n\r\n`), Buffer.alloc(endpoint.uploadBytes, 'x'), Buffer.from(`\r\n--${boundary}--\r\n`)]), type: `multipart/form-data; boundary=${boundary}` };
  }
  return { body: endpoint.body === undefined ? undefined : Buffer.from(JSON.stringify(endpoint.body)), type: 'application/json' };
}
export function requestOnce(target, endpoint, { agent, token, timeoutMs }) {
  const url = new URL(endpoint.requestPath ?? endpoint.path, target);
  const { body, type } = payload(endpoint);
  const headers = { accept: 'application/json' };
  if (body) Object.assign(headers, { 'content-type': type, 'content-length': body.length });
  if (endpoint.requiresAuth) headers.authorization = `Bearer ${token}`;
  const start = performance.now();
  return new Promise(resolve => {
    let finished = false;
    const finish = result => {
      if (finished) return;
      finished = true;
      clearTimeout(deadline);
      resolve({ latencyMs: performance.now() - start, ...result });
    };
    const transport = url.protocol === 'https:' ? https : http;
    const req = transport.request(url, { method: endpoint.method, headers, agent }, res => {
      // Response event occurs when the first response headers are parsed.
      const ttfbMs = performance.now() - start;
      let bytes = 0;
      res.on('data', chunk => { bytes += chunk.length; });
      res.on('end', () => finish({ ttfbMs, status: res.statusCode, bytes, failed: res.statusCode !== endpoint.expectedStatus }));
      res.on('error', () => finish({ ttfbMs, status: res.statusCode, bytes, failed: true, networkError: true }));
    });
    const deadline = setTimeout(() => req.destroy(new Error('benchmark timeout')), timeoutMs);
    req.on('error', () => finish({ ttfbMs: null, status: null, bytes: 0, failed: true, networkError: true }));
    req.end(body);
  });
}
export async function measure(target, endpoint, options) {
  const transport = target.protocol === 'https:' ? https : http;
  const agent = new transport.Agent({ keepAlive: true, maxSockets: options.concurrency });
  const samples = [];
  let issued = 0;
  const start = performance.now();
  try {
    await Promise.all(Array.from({ length: options.concurrency }, async () => {
      while (issued < options.requests && performance.now() - start < 15000) {
        issued++;
        const sample = await requestOnce(target, endpoint, { ...options, agent });
        samples.push({ ...sample, completedMs: performance.now() - start });
      }
    }));
  } finally { agent.destroy(); }
  const durationMs = performance.now() - start;
  const buckets = new Map();
  for (const sample of samples) {
    const bucket = Math.floor(sample.completedMs / 1000);
    buckets.set(bucket, (buckets.get(bucket) ?? 0) + 1);
  }
  const latencies = samples.map(s => s.latencyMs);
  const ttfb = samples.filter(s => s.ttfbMs !== null).map(s => s.ttfbMs);
  const fullSeconds = Math.floor(durationMs / 1000);
  const peakRps = fullSeconds ? Math.max(...Array.from({ length: fullSeconds }, (_, second) => buckets.get(second) ?? 0)) : samples.length * 1000 / durationMs;
  const statuses = {};
  for (const sample of samples) statuses[sample.status ?? 'network_error'] = (statuses[sample.status ?? 'network_error'] ?? 0) + 1;
  return {
    endpoint: `${endpoint.method} ${endpoint.path}`, expectedStatus: endpoint.expectedStatus,
    requests: samples.length, requested: options.requests, incomplete: samples.length !== options.requests, durationMs, concurrency: options.concurrency,
    requestBodyBytes: payload(endpoint).body?.length ?? 0,
    p50Ms: percentile(latencies, .5), p95Ms: percentile(latencies, .95), p99Ms: percentile(latencies, .99),
    sustainedRps: samples.length * 1000 / durationMs,
    peakRps,
    errorRatePercent: 100 * samples.filter(s => s.failed).length / samples.length,
    ttfbP50Ms: percentile(ttfb, .5), ttfbP95Ms: percentile(ttfb, .95), ttfbP99Ms: percentile(ttfb, .99),
    statuses, responseBytes: samples.reduce((sum, s) => sum + s.bytes, 0)
  };
}
export function violations(result, thresholds, smoke) {
  const limit = { ...thresholds.default, ...(smoke ? thresholds.smoke : {}), ...thresholds.endpoints?.[result.endpoint] };
  if (![limit.p99Ms, limit.maxErrorRatePercent].every(Number.isFinite) || limit.p99Ms <= 0 || limit.maxErrorRatePercent < 0) throw new Error(`Invalid threshold for ${result.endpoint}`);
  const failures = [];
  if (result.incomplete) failures.push(`route time budget exhausted: ${result.requests}/${result.requested} requests completed`);
  if (result.p99Ms > limit.p99Ms) failures.push(`p99 ${result.p99Ms.toFixed(2)}ms > ${limit.p99Ms}ms`);
  if (result.errorRatePercent > limit.maxErrorRatePercent) failures.push(`error rate ${result.errorRatePercent.toFixed(2)}% > ${limit.maxErrorRatePercent}%`);
  return failures;
}
export function markdown(report) {
  const n = value => value === null ? 'n/a' : value.toFixed(2);
  return `# API benchmark\n\nRecorded ${report.recordedAt}; commit ${report.commit}; ${report.mode}; ${report.targetKind}.\n\n${report.runtimeDescription}\n\n${JSON.stringify(report.environment)}\n\nRequest count/route: ${report.options.requests}; concurrency: ${report.options.concurrency}. ${report.notes}\n\n| Endpoint | p50 ms | p95 ms | p99 ms | RPS sustained | RPS peak | Errors % | TTFB p50 / p95 / p99 ms |\n|---|---:|---:|---:|---:|---:|---:|---|\n` + report.results.map(r => `| ${r.endpoint} | ${n(r.p50Ms)} | ${n(r.p95Ms)} | ${n(r.p99Ms)} | ${n(r.sustainedRps)} | ${n(r.peakRps)} | ${n(r.errorRatePercent)} | ${n(r.ttfbP50Ms)} / ${n(r.ttfbP95Ms)} / ${n(r.ttfbP99Ms)} |`).join('\n') + `\n\nGate: ${report.failures.length ? 'FAIL\n' + report.failures.join('\n') : 'PASS'}\n`;
}
