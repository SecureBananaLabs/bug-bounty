# API Benchmark Suite

This benchmark suite covers the FreelanceFlow API surface mounted in `apps/api/src/app.js`.

## Commands

```bash
npm run benchmark:smoke
npm run benchmark
```

When `BENCHMARK_TARGET_URL` is not set, the runner starts the Express app on a random local port, generates a benchmark admin JWT for `/api/admin/metrics`, and disables rate limiting with `BENCHMARK_DISABLE_RATE_LIMIT=true` so the run measures route handlers instead of middleware throttling.

To test a deployed or manually-started server:

```bash
cp .env.benchmark.example .env.benchmark
BENCHMARK_TARGET_URL=http://127.0.0.1:4000 BENCHMARK_AUTH_TOKEN=<token> npm run benchmark
```

## Output

Every run writes:

- `benchmarks/results/latest.json`
- `benchmarks/results/latest.md`
- timestamped JSON and Markdown copies for audit history

Each endpoint record includes request count, p50/p95/p99 latency, p95 TTFB, sustained and peak requests per second, status distribution, error rate, and unexpected-status rate.

## Regression Gate

Thresholds live in `benchmarks/thresholds.json`. The GitHub Actions smoke benchmark runs at low concurrency and fails when an endpoint exceeds its p99 latency, error-rate, or unexpected-status threshold.
