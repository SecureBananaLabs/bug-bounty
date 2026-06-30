# API Benchmark Suite

This suite measures every mounted `/api/*` route in the Express API with synthetic but schema-shaped payloads.

## Run

```bash
npm run benchmark
```

For a low-concurrency CI check:

```bash
npm run benchmark:smoke
```

By default the runner starts the local API in-process with `NODE_ENV=benchmark`. To target a running local or staging server, copy `.env.benchmark.example` to `.env.benchmark` and set `BENCHMARK_TARGET_URL`.

## Outputs

Each run writes both machine-readable JSON and a Markdown summary to `benchmarks/results/`.

Captured per endpoint:

- p50, p95, and p99 total latency
- p50, p95, and p99 time to first byte
- sustained requests per second
- peak one-second request rate
- status distribution
- error rate

Thresholds live in `benchmarks/thresholds.json`; smoke mode exits non-zero when p99 or error-rate thresholds are exceeded.
