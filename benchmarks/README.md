# API Benchmarks

This directory contains a reproducible benchmark suite for the platform API.

## Commands

```sh
npm run benchmark
npm run benchmark:smoke
```

By default the runner starts the local Express app in-process and benchmarks it over loopback. Set `BENCHMARK_TARGET_URL` in `.env.benchmark` to target a running local or staging server instead.

## Configuration

Copy `.env.benchmark.example` to `.env.benchmark` and adjust values as needed.

- `BENCHMARK_TARGET_URL`: optional target host, for example `http://127.0.0.1:4000`.
- `BENCHMARK_AUTH_TOKEN`: optional bearer token for protected routes.
- `BENCHMARK_REQUESTS_PER_ENDPOINT`: request count per endpoint.
- `BENCHMARK_CONCURRENCY`: concurrent workers per endpoint.
- `BENCHMARK_TIMEOUT_MS`: per-request timeout.
- `BENCHMARK_RESULT_BASENAME`: report filename prefix in `benchmarks/results/`.

## Output

Each run writes:

- `benchmarks/results/<name>.json`
- `benchmarks/results/<name>.md`

The report captures p50, p95, p99 latency, p95 time to first byte, sustained and peak requests per second, status counts, and error rate per endpoint.

## Regression Gate

`benchmarks/thresholds.json` stores reviewable p99/error-rate thresholds. The CI smoke workflow runs `npm run benchmark:smoke` and fails when any endpoint exceeds those thresholds.
