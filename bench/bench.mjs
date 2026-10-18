# API Latency Benchmark Harness (p50 / p95 / p99, RPS, error rate, TTFB)

A zero-dependency Node.js benchmark tool that measures per-endpoint latency
percentiles, throughput, error rate and time-to-first-byte against any HTTP API.

## `bench/bench.mjs`

```js
#!/usr/bin/env node
/**
 * bench.mjs — API latency/throughput benchmark
 *
 * Usage:
 *   node bench/bench.mjs --url https://api.example.com/health --n 500 --c 20
 *   node bench/bench.mjs --url https://api.example.com --n 1000 --c 50 --json
 *
 * Reports: p50, p90, p95, p99 latency (ms), RPS, error rate (%), TTFB (ms).
 */
import { performance } from 'node:perf_hooks';

function parseArgs(argv) {
  const args = { n: 200, c: 10, json: false, timeout: 10000, method: 'GET' };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--url') args.url = argv[++i];
    else if (a === '--n') args.n = parseInt(argv[++i], 10);
    else if (a === '--c') args.c = parseInt(argv[++i], 10);
    else if (a === '--method') args.method = argv[++i];
    else if (a === '--timeout') args.timeout = parseInt(argv[++i], 10);
    else if (a === '--json') args.json = true;
    else if (a === '--header') (args.headers ??= []).push(argv[++i]);
    else if (a === '--body') args.body = argv[++i];
  }
  if (!args.url) {
    console.error('error: --url is required');
    process.exit(2);
  }
  return args;
}

function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, idx)];
}

function round(x, d = 2) {
  const f = 10 ** d;
  return Math.round(x * f) / f;
}

async function oneRequest(url, opts) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeout);
  const start = performance.now();
  let ttfb = null;
  let status = 0;
  let ok = false;
  try {
    const res = await fetch(url, {
      method: opts.method,
      headers: opts.headersObj,
      body: opts.body,
      signal: controller.signal,
    });
    ttfb = performance.now() - start; // headers received => first byte
    status = res.status;
    // Drain the body so the connection is reusable and timing is complete.
    await res.arrayBuffer();
    ok = res.ok;
  } catch (err) {
    status = 0;
    ok = false;
  } finally {
    clearTimeout(timer);
  }
  const total = performance.now() - start;
  return { total, ttfb: ttfb ?? total, status, ok };
}

async function runPool(url, opts) {
  const { n, c } = opts;
  const latencies = [];
  const ttfbs = [];
  let errors = 0;
  let completed = 0;
  const wallStart = performance.now();

  async function worker() {
    while (true) {
      const i = completed++;
      if (i >= n) return;
      const r = await oneRequest(url, opts);
      latencies.push(r.total);
      ttfbs.push(r.ttfb);
      if (!r.ok) errors++;
    }
  }

  await Promise.all(Array.from({ length: Math.min(c, n) }, worker));
  const wall = performance.now() - wallStart;
  return { latencies, ttfbs, errors, wall };
}

async function main() {
  const args = parseArgs(process.argv);
  const headersObj = {};
  for (const h of args.headers ?? []) {
    const [k, ...v] = h.split(':');
    headersObj[k.trim()] = v.join(':').trim();
  }
  const opts = {
    method: args.method,
    timeout: args.timeout,
    headersObj,
    body: args.body,
  };

  // Warmup (excluded from stats) to prime DNS/TLS/connection pool.
  await Promise.all(Array.from({ length: Math.min(5, args.c) }, () => oneRequest(args.url, opts)));

  const { latencies, ttfbs, errors, wall } = await runPool(args.url, { ...opts, n: args.n, c: args.c });
  const sorted = [...latencies].sort((a, b) => a - b);
  const sortedTtfb = [...ttfbs].sort((a, b) => a - b);

  const report = {
    url: args.url,
    requests: args.n,
    concurrency: args.c,
    wall_ms: round(wall),
    rps: round((args.n / wall) * 1000),
    error_rate_pct: round((errors / args.n) * 100),
    latency_ms: {
      min: round(sorted[0] ?? 0),
      p50: round(percentile(sorted, 50)),
      p90: round(percentile(sorted, 90)),
      p95: round(percentile(sorted, 95)),
      p99: round(percentile(sorted, 99)),
      max: round(sorted[sorted.length - 1] ?? 0),
      mean: round(sorted.reduce((a, b) => a + b, 0) / (sorted.length || 1)),
    },
    ttfb_ms: {
      p50: round(percentile(sortedTtfb, 50)),
      p95: round(percentile(sortedTtfb, 95)),
      p99: round(percentile(sortedTtfb, 99)),
    },
  };

  if (args.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(`\nBenchmark: ${report.url}`);
    console.log(`Requests: ${report.requests}  Concurrency: ${report.concurrency}  Wall: ${report.wall_ms} ms`);
    console.log(`RPS: ${report.rps}   Error rate: ${report.error_rate_pct}%`);
    console.log(`Latency (ms): p50=${report.latency_ms.p50} p90=${report.latency_ms.p90} p95=${report.latency_ms.p95} p99=${report.latency_ms.p99} max=${report.latency_ms.max}`);
    console.log(`TTFB (ms):    p50=${report.ttfb_ms.p50} p95=${report.ttfb_ms.p95} p99=${report.ttfb_ms.p99}\n`);
  }

  // Non-zero exit if error rate exceeds 1% — useful for CI gates.
  process.exit(report.error_rate_pct > 1 ? 1 : 0);
}

main();
```

## `package.json` (scripts)

```json
{
  "name": "api-benchmark",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "bench": "node bench/bench.mjs",
    "bench:json": "node bench/bench.mjs --json"
  },
  "engines": { "node": ">=18" }
}
```

## `.github/workflows/bench.yml` (CI regression gate)

```yaml
name: API benchmark
on:
  workflow_dispatch:
    inputs:
      url:
        description: Endpoint to benchmark
        required: true
        default: https://httpbin.org/get
jobs:
  bench:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: node bench/bench.mjs --url "${{ inputs.url }}" --n 300 --c 20
```

## Design notes
- **Zero dependencies** — uses the built-in `fetch` + `perf_hooks`; runs on Node 18+.
- **TTFB** is measured at the moment response headers arrive (first byte), distinct from total latency.
- **Warmup phase** primes DNS/TLS so cold-start skew doesn't pollute percentiles.
- **Fixed-size worker pool** gives exact concurrency control (`--c`) independent of request count (`--n`).
- **CI-gateable**: exits non-zero when error rate > 1%.
- Percentiles use the nearest-rank method on the sorted sample set (stable, no interpolation surprises).
