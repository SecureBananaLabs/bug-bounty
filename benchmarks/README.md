# API Benchmarks

This suite benchmarks `/health` plus every mounted `/api/*` route in the Express API.

## Setup

Copy the template and adjust values when benchmarking a staging target:

```sh
cp benchmarks/env.benchmark.example .env.benchmark
```

If `BENCHMARK_TARGET_URL` is empty, the runner starts the local Express app on an ephemeral loopback port and sets `BENCHMARK_MODE=true` so the suite measures endpoints instead of the global rate limiter.

## Commands

```sh
npm run benchmark
npm run benchmark:smoke
npm run benchmark:test
```

The full benchmark uses `autocannon` with synthetic marketplace payloads. Reports are written to `benchmarks/results/` as timestamped JSON and Markdown files, plus `latest.json` and `latest.md`.

## Metrics

Each endpoint captures:

- p50, p95, and p99 latency
- p50, p95, and p99 time to first byte
- sustained and peak requests per second
- status code distribution
- error count and error rate

Thresholds live in `benchmarks/thresholds.json` and are used by the CI smoke benchmark.
