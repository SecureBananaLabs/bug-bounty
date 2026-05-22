# API Benchmarks

This directory contains a reproducible benchmark suite for the Express API.

## Commands

```bash
npm run benchmark
npm run benchmark:smoke
```

By default the runner starts the API in-process on an ephemeral local port. To test an already-running local or staging server, set `BENCHMARK_TARGET_URL`:

```bash
BENCHMARK_TARGET_URL=http://127.0.0.1:4000 npm run benchmark
```

Copy `.env.benchmark.example` when you need a stable target, request count, concurrency, timeout, or JWT secret.

## Output

The runner writes:

- `benchmarks/results/api-benchmark-latest.json`
- `benchmarks/results/api-benchmark-summary.md`

Each endpoint report includes p50, p95, p99 latency, p99 time to first byte, sustained and approximate peak requests per second, and error rate.

## Regression Gate

`benchmarks/thresholds.json` stores reviewable thresholds. CI runs `npm run benchmark:smoke`, which uses one request per endpoint and low concurrency so the gate catches broken routes without trying to load-test GitHub Actions runners.
