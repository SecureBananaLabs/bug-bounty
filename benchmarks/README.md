# API Benchmarks

This benchmark suite exercises every route mounted under `/api/` and captures:

- p50, p95, and p99 latency
- p50, p95, and p99 time to first byte
- peak and sustained requests per second
- status-code distribution
- error rate

## Run Locally

```bash
npm run benchmark
```

By default the command starts the API in-process on a random local port and writes both JSON and Markdown reports to `benchmarks/results/`.

To benchmark an existing local or staging server:

```bash
BENCHMARK_TARGET_URL=http://127.0.0.1:4000 npm run benchmark
```

## Configuration

Create `.env.benchmark` from `.env.benchmark.example` if you want to override the target URL, request count, concurrency, or benchmark token.

The admin benchmark route uses `BENCHMARK_TOKEN` when provided. If no token is configured, the benchmark script creates a short-lived local token with the API's development JWT secret.

## CI Smoke Gate

The GitHub Actions workflow runs:

```bash
npm run benchmark -- --smoke --output-dir=benchmarks/results/ci
```

Smoke mode uses low concurrency and a small request count so CI can catch severe regressions without adding a heavy load test to every pull request.

Thresholds live in `benchmarks/thresholds.json`.
