# API Benchmarks

This suite benchmarks every mounted Express route under `/api/` and writes JSON plus Markdown reports to `benchmarks/results`.

## Commands

```sh
npm run benchmark:coverage
npm run benchmark:smoke
npm run benchmark
```

`npm run benchmark` starts the API in-process unless `BENCHMARK_BASE_URL` is set. The smoke command uses the same runner with a shorter duration for CI.

## Configuration

Copy `.env.benchmark.example` when local overrides are needed. Useful settings:

- `BENCHMARK_BASE_URL`: benchmark a deployed API instead of the local in-process app.
- `BENCHMARK_AUTH_TOKEN`: token for protected routes. When omitted for local runs, the runner signs a benchmark token with `JWT_SECRET`.
- `BENCHMARK_DURATION_MS`, `BENCHMARK_CONCURRENCY`, `BENCHMARK_WARMUP_REQUESTS`: load profile controls.
- `BENCHMARK_DISABLE_RATE_LIMIT`: disables the API rate limiter during local benchmark runs to prevent artificial `429` responses.

## Metrics

Each endpoint report includes p50, p95, and p99 latency; p99 TTFB; peak and sustained RPS; error rate; request counts; and status-code distribution.

Thresholds live in `benchmarks/thresholds.json`. The runner exits non-zero when any endpoint exceeds p99 latency, p99 TTFB, error-rate, or sustained-RPS thresholds.
