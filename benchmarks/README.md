# API Benchmarks

This benchmark suite covers every route mounted under `/api/` in the Express app. It can start a local API server automatically or run against a configured staging target.

## Commands

```bash
npm run benchmark
npm run benchmark:smoke
```

`npm run benchmark` writes JSON and Markdown reports to `benchmarks/results/`.

`npm run benchmark:smoke` runs a low-concurrency regression gate and fails when an endpoint exceeds `benchmarks/thresholds.json`.

## Configuration

Copy `.env.benchmark.example` to `.env.benchmark` when you want to run against a specific target:

```bash
BENCHMARK_TARGET_URL=http://localhost:4000
BENCHMARK_AUTH_TOKEN=optional-token-for-protected-routes
BENCHMARK_REQUESTS_PER_ENDPOINT=6
BENCHMARK_CONCURRENCY=2
BENCHMARK_TIMEOUT_MS=5000
```

When `BENCHMARK_TARGET_URL` is empty, the runner starts the local Express app on a random loopback port. For the local mode it creates a benchmark-only admin JWT for `/api/admin/metrics`.

## Metrics

Each endpoint report includes:

- p50, p95, and p99 total latency in milliseconds
- p50, p95, and p99 time to first byte in milliseconds
- sustained and peak requests per second
- error rate percentage
- status code counts
