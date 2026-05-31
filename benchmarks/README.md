# API Benchmarks

This benchmark suite exercises every mounted `/api/*` route and records p50, p95, p99 latency, p95 time to first byte, sustained RPS, peak RPS, and error rate.

## Commands

```bash
npm run benchmark
npm run benchmark:smoke
```

`npm run benchmark` starts the local Express API automatically when `BENCHMARK_TARGET_URL` is not set. To run against an existing local or staging server, copy `.env.benchmark.example` to `.env.benchmark` and set `BENCHMARK_TARGET_URL`.

## Outputs

Each run writes:

- `benchmarks/results/<name>.json`
- `benchmarks/results/<name>.md`

The smoke command uses the `smoke` output name and enables threshold failure behavior for CI. Thresholds are stored in `benchmarks/thresholds.json`.

## Route Coverage

The suite covers auth, users, jobs, proposals, payments, reviews, messages, notifications, uploads, search, and authenticated admin metrics. POST routes use synthetic payloads that match the current controller and validator expectations.
