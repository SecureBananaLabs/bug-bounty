import http from 'node:http';
import { performance } from 'node:perf_hooks';
import { setTimeout as delay } from 'node:timers/promises';

export function loopbackTarget(value) {
  const url = new URL(value);
  if (url.protocol !== 'http:' || !['127.0.0.1', '[::1]'].includes(url.hostname)
    || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('Only an HTTP loopback origin is allowed');
  }
  return url;
}

// The socket data event observes the first response byte. The response end event
// observes the complete body. An absolute deadline covers headers AND body.
export async function requestOnce({ url, scenario, context, timeoutMs, agent = false }) {
  const target = loopbackTarget(url);
  if (!scenario.path.startsWith('/') || scenario.path.startsWith('//') || scenario.path.includes('\\')) {
    throw new Error('Invalid request path');
  }
  const { headers = {}, body } = scenario.build(context);
  const payload = body === undefined ? undefined : Buffer.from(body);
  const started = performance.now();
  return new Promise((resolve) => {
    let settled = false;
    let socket;
    let firstByte;
    let statusCode = null;
    let failure = 'network';
    let deadline;
    const onData = () => { firstByte ??= performance.now() - started; };
    const finish = (ok, error, ended = performance.now()) => {
      if (settled) return;
      settled = true;
      clearTimeout(deadline);
      socket?.removeListener('data', onData);
      resolve({ ok, statusCode, durationMs: ended - started, ttfbMs: firstByte ?? null, error });
    };
    const req = http.request({
      hostname: target.hostname.replace(/^\[|\]$/g, ''), port: target.port,
      method: scenario.method, path: scenario.path, agent,
      headers: { ...headers, ...(payload ? { 'content-length': payload.length } : {}) }
    }, (res) => {
      statusCode = res.statusCode;
      const chunks = [];
      let bytes = 0;
      res.on('data', (chunk) => {
        bytes += chunk.length;
        if (bytes > 2 * 1024 * 1024) {
          failure = 'response-too-large';
          req.destroy();
          finish(false, failure);
        } else chunks.push(chunk);
      });
      res.on('aborted', () => finish(false, failure));
      res.on('error', () => finish(false, failure));
      res.on('end', () => {
        const ended = performance.now();
        if (statusCode !== scenario.expectedStatus) return finish(false, 'http-status', ended);
        let parsed;
        try { parsed = JSON.parse(Buffer.concat(chunks).toString('utf8')); }
        catch { return finish(false, 'invalid-json', ended); }
        let valid = false;
        try {
          valid = scenario.envelope === false
            ? scenario.validate(parsed) === true
            : parsed?.success === true && scenario.validate(parsed.data) === true;
        } catch { /* A validator failure is a failed request, never a green run. */ }
        finish(valid, valid ? null : 'semantic', ended);
      });
    });
    req.once('socket', (value) => {
      socket = value;
      socket.prependOnceListener('data', onData);
    });
    req.on('error', () => finish(false, failure));
    deadline = setTimeout(() => {
      failure = 'timeout';
      req.destroy();
      finish(false, failure);
    }, timeoutMs);
    req.end(payload);
  });
}

export function validateLoad({ requests, concurrency, rate, timeoutMs }) {
  if (!Number.isInteger(requests) || requests < 1 || requests > 1000
    || !Number.isInteger(concurrency) || concurrency < 1 || concurrency > 32
    || !Number.isFinite(rate) || rate < 0 || rate > 2000
    || !Number.isInteger(timeoutMs) || timeoutMs < 10 || timeoutMs > 10000) {
    throw new Error('Invalid load configuration (requests 1..1000, concurrency 1..32, rate 0..2000, timeout 10..10000 ms)');
  }
  // Node clamps an overflowing timer to 1 ms, which would silently defeat pacing.
  if (rate > 0 && (requests - 1) * 1000 / rate > 2_147_483_647) {
    throw new Error('Invalid pacing schedule: the last request must be scheduled within 2147483647 ms');
  }
}

export async function runLoad(options) {
  validateLoad(options);
  loopbackTarget(options.url);
  const { requests, concurrency, rate } = options;
  const agent = new http.Agent({ keepAlive: true, maxSockets: concurrency, maxFreeSockets: concurrency });
  const samples = [];
  const started = performance.now();
  let issued = 0;
  try {
    await Promise.all(Array.from({ length: Math.min(concurrency, requests) }, async () => {
      while (issued < requests) {
        const sequence = issued++;
        if (rate > 0) {
          const wait = started + sequence * 1000 / rate - performance.now();
          if (wait > 0) await delay(wait);
        }
        const sample = await requestOnce({ ...options, agent, context: { ...options.context, sequence } });
        samples.push({ ...sample, completedAtMs: performance.now() - started });
      }
    }));
    return summarize(samples, performance.now() - started);
  } finally { agent.destroy(); }
}

function percentiles(values) {
  if (!values.length) return { p50: null, p95: null, p99: null };
  const sorted = [...values].sort((a, b) => a - b);
  const at = (p) => sorted[Math.max(0, Math.ceil(sorted.length * p) - 1)];
  return { p50: at(0.5), p95: at(0.95), p99: at(0.99) };
}

export function summarize(samples, elapsedMs) {
  const successes = samples.filter((sample) => sample.ok).length;
  const firstBytes = samples.map((sample) => sample.ttfbMs).filter(Number.isFinite);
  const statusCounts = {};
  const errorCounts = {};
  const buckets = {};
  for (const sample of samples) {
    const status = sample.statusCode ?? 'no-response';
    statusCounts[status] = (statusCounts[status] ?? 0) + 1;
    if (!sample.ok) errorCounts[sample.error ?? 'unknown'] = (errorCounts[sample.error ?? 'unknown'] ?? 0) + 1;
    const bucket = Math.floor(sample.completedAtMs / 1000);
    buckets[bucket] = (buckets[bucket] ?? 0) + 1;
  }
  const sustained = elapsedMs > 0 ? samples.length * 1000 / elapsedMs : 0;
  const completeWindows = Math.floor(elapsedMs / 1000);
  // A partial final window is excluded to avoid inflating peak with a tiny divisor.
  const peak = completeWindows
    ? Math.max(0, ...Object.entries(buckets).filter(([index]) => Number(index) < completeWindows).map(([, count]) => count))
    : sustained;
  return {
    samples: samples.length, successes, errorCount: samples.length - successes,
    errorRatePct: samples.length ? (samples.length - successes) * 100 / samples.length : null,
    elapsedMs, latencyMs: percentiles(samples.map((sample) => sample.durationMs)),
    ttfbMs: { ...percentiles(firstBytes), samples: firstBytes.length },
    rps: { sustained, peak, peakWindowMs: completeWindows ? 1000 : elapsedMs, successful: elapsedMs > 0 ? successes * 1000 / elapsedMs : 0 },
    statusCounts, errorCounts
  };
}

export function validateCoverage(routes, scenarios, thresholds) {
  const keys = scenarios.map((scenario) => `${scenario.method} ${scenario.route}`);
  const ids = scenarios.map((scenario) => scenario.id);
  if (new Set(keys).size !== keys.length || new Set(ids).size !== ids.length) throw new Error('duplicate benchmark scenario');
  const actual = routes.map((route) => `${route.method} ${route.route}`);
  if (new Set(actual).size !== actual.length) throw new Error('duplicate API route');
  const missing = actual.filter((key) => !keys.includes(key));
  const extra = keys.filter((key) => !actual.includes(key));
  if (missing.length || extra.length) throw new Error(`API coverage mismatch: missing [${missing}], extra [${extra}]`);
  if (!thresholds || typeof thresholds !== 'object' || Array.isArray(thresholds)
    || Object.keys(thresholds).length !== ids.length || Object.keys(thresholds).some((id) => !ids.includes(id))) {
    throw new Error('A threshold is required for exactly every endpoint');
  }
  for (const id of ids) {
    const entry = thresholds[id];
    if (!entry || !Number.isFinite(entry.p99Ms) || entry.p99Ms <= 0
      || !Number.isFinite(entry.maxErrorRatePct) || entry.maxErrorRatePct < 0 || entry.maxErrorRatePct > 100
      || !Number.isInteger(entry.minSamples) || entry.minSamples < 1 || entry.minSamples > 1000) {
      throw new Error(`Invalid threshold for ${id}`);
    }
  }
}

export function evaluateEndpoint(result, threshold, expectedSamples) {
  const reasons = [];
  if (!threshold) return { passed: false, reasons: ['missing threshold'] };
  if (!result || !Number.isInteger(result.samples) || result.samples < 1
    || result.samples !== expectedSamples || result.samples < threshold.minSamples) reasons.push('missing or insufficient samples');
  for (const metric of ['p50', 'p95', 'p99']) {
    if (!Number.isFinite(result?.latencyMs?.[metric]) || result.latencyMs[metric] < 0) reasons.push(`invalid latency ${metric}`);
    if (!Number.isFinite(result?.ttfbMs?.[metric]) || result.ttfbMs[metric] < 0) reasons.push(`invalid TTFB ${metric}`);
  }
  if (!Number.isFinite(result?.rps?.sustained) || result.rps.sustained <= 0
    || !Number.isFinite(result?.rps?.peak) || result.rps.peak < 0) reasons.push('invalid RPS');
  if (!Number.isFinite(result?.errorRatePct) || result.errorRatePct > threshold.maxErrorRatePct) reasons.push('error rate exceeds threshold');
  if (result?.latencyMs?.p99 > threshold.p99Ms) reasons.push(`p99 exceeds ${threshold.p99Ms} ms`);
  return { passed: reasons.length === 0, reasons };
}
