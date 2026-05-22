# API Benchmark Suite

This benchmark suite covers every mounted API route in the Express app, plus `/health`.

## Setup

1. Copy `.env.benchmark.example` if you need a remote target.
2. Run `npm run benchmark` for the full local suite.
3. Run `npm run benchmark:smoke` for the low-cost CI regression gate.

When `BENCHMARK_BASE_URL` is empty, the runner starts the local Express app on a random port. When it is set, the runner targets that host instead.

## Output

Each run writes:

- `benchmarks/results/api-benchmark-results.json`
- `benchmarks/results/api-benchmark-summary.md`

Metrics captured per endpoint:

- p50, p95, and p99 latency
- p50, p95, and p99 time to first byte
- sustained and peak requests per second
- error rate
- status code distribution

## Configuration

- `BENCHMARK_BASE_URL`: optional remote API origin, for example `https://staging.example.com`
- `BENCHMARK_ITERATIONS`: requests per endpoint in full mode
- `BENCHMARK_CONCURRENCY`: concurrent workers per endpoint
- `BENCHMARK_OUTPUT_DIR`: result directory
- `BENCHMARK_JWT_SECRET`: token secret for benchmark-only protected routes
- `BENCHMARK_LANGUAGE`: metadata field for generated reports
