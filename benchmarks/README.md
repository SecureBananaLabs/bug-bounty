# API Benchmarks

This directory contains the reproducible API benchmark suite for every route mounted under `/api/`.
It uses `autocannon` for load generation and captures p50/p95/p99 latency, RPS, status distribution, error rate, and a companion TTFB sample per endpoint.

## Configure

Copy `.env.benchmark.example` and set values for the target environment:

- `BENCHMARK_TARGET_URL`: optional target host. If unset, the runner starts the Express API locally on a random loopback port.
- `BENCHMARK_AUTH_TOKEN`: required when targeting an existing local or staging server. The token should be a dedicated benchmark token with the least privileges needed for protected routes.
- `BENCHMARK_CONCURRENCY`: parallel requests per endpoint.
- `BENCHMARK_REQUESTS_PER_ENDPOINT`: total requests per endpoint.
- `BENCHMARK_OUTPUT_PREFIX`: result filename prefix under `benchmarks/results/`.

## Run

```bash
npm run benchmark:coverage
npm run benchmark
npm run benchmark:smoke
```

`npm run benchmark` writes JSON and Markdown output into `benchmarks/results/`.
`npm run benchmark:smoke` runs a low-concurrency regression gate and fails when an endpoint exceeds `benchmarks/thresholds.json`.

## Demo

The short benchmark demo for the pull request is available at [`demos/api-benchmark-demo.gif`](../demos/api-benchmark-demo.gif).

## Metrics

Each endpoint captures:

- benchmark tool metadata
- p50, p95, and p99 latency in milliseconds
- p50, p95, and p99 time to first byte in milliseconds
- sustained and peak requests per second
- status distribution and error rate

## Pull Request Summary

Include the generated Markdown summary from `benchmarks/results/` in the pull request description.
