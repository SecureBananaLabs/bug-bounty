# API Benchmarks

This directory contains a reproducible benchmark suite for the FreelanceFlow API.

## Commands

```sh
npm run benchmark
npm run benchmark:smoke
```

By default the runner starts the local Express app on an ephemeral loopback port. Set `BENCHMARK_TARGET_URL` to benchmark an already-running local or staging server.

## Configuration

Copy `benchmarks/.env.benchmark.example` when you need a stable target or custom request volume.

Supported variables:

- `BENCHMARK_TARGET_URL`: target API origin. If omitted, the runner starts the app locally.
- `BENCHMARK_REQUESTS`: requests per endpoint. Defaults to `5`, or `2` in smoke mode.
- `BENCHMARK_CONCURRENCY`: concurrent requests per endpoint. Defaults to `2`, or `1` in smoke mode.
- `JWT_SECRET`: signing key for the benchmark admin token when using the local app.

## Output

Each run writes:

- `benchmarks/results/latest.json`
- `benchmarks/results/latest.md`
- timestamped JSON and Markdown files for historical comparison

Metrics captured per endpoint include p50, p95, p99 latency, p95 TTFB, sustained and peak requests per second, status distribution, and error rate.

## Thresholds

`benchmarks/thresholds.json` stores reviewable smoke-test limits. `npm run benchmark:smoke` exits with a non-zero status when an endpoint exceeds its p99 or error-rate threshold.
