# API Benchmarks

This directory contains a reproducible benchmark suite for the Express API.

## Commands

- `npm run benchmark:coverage` verifies that every mounted `/api/*` route, plus `/health`, is represented in the benchmark manifest.
- `npm run benchmark:smoke` runs a low-concurrency gate suitable for CI.
- `npm run benchmark` runs the fuller local suite and writes JSON plus Markdown results to `benchmarks/results/`.

By default the runner starts the local Express app on a random loopback port and benchmarks that process. To benchmark another target, copy `.env.benchmark.example` to `.env.benchmark` and set `BENCHMARK_TARGET_URL`.

Protected routes use a dedicated benchmark admin token when the local app is started by the runner. For external targets, set `BENCHMARK_AUTH_TOKEN` to a token created for benchmark-only use.

## Metrics

Each endpoint records:

- p50, p95, and p99 total latency
- p50, p95, and p99 time to first byte
- sustained and peak requests per second
- status-code distribution
- error rate
- bytes received

Thresholds for the CI smoke gate live in `benchmarks/thresholds.json`.

The PR demo artifact is `demos/api-benchmark-demo.mp4`.
