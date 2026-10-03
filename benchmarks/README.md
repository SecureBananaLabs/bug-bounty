# API Benchmark Suite

This benchmark suite covers `/health` and every mounted `/api/*` route in the API app. It records p50, p95, p99 latency, time to first byte, sustained and peak requests per second, error rate, and status-code counts.

## Setup

1. Copy `benchmarks/.env.benchmark.example` to `.env.benchmark` and adjust values if needed.
2. Run `npm run benchmark` from the repository root.

By default the runner starts the local Express app on an ephemeral loopback port. Set `BENCHMARK_TARGET_URL` to benchmark an already running local or staging API instead.

## Commands

```bash
npm run benchmark
npm run benchmark:smoke
```

`benchmark:smoke` uses low concurrency and checks `benchmarks/thresholds.json`, making it suitable for CI. Full runs write JSON and Markdown reports to `benchmarks/results/`.

## Auth

The suite signs a benchmark JWT with the app's `JWT_SECRET` for protected endpoints. To benchmark an external target with a specific token, set `BENCHMARK_ADMIN_TOKEN` in `.env.benchmark`.

Benchmark requests include `x-benchmark-run: 1`, and the local runner sets `NODE_ENV=benchmark` when it starts the in-process API. The API only skips the global rate limiter when both conditions are present, which keeps rate-limit behavior from contaminating benchmark latency and error-rate measurements without allowing normal environments to bypass the limiter.
