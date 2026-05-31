# API Benchmarks

This directory contains the reproducible benchmark suite for every route mounted under `/api/`.

## Usage

```sh
npm run benchmark
```

By default the runner starts the local Express app on a random port and tests that instance. To benchmark an already running local or staging server, copy `benchmarks/.env.benchmark.example` to `.env.benchmark` and set:

```sh
BENCHMARK_TARGET_URL=http://127.0.0.1:4000
```

The suite writes timestamped JSON and markdown reports to `benchmarks/results/`, then updates:

- `benchmarks/results/latest.json`
- `benchmarks/results/latest.md`

## Smoke Gate

CI runs:

```sh
npm run benchmark -- --smoke
```

Smoke mode uses lower concurrency and shorter duration, then checks each endpoint against `benchmarks/thresholds.json`. The gate fails when p99 latency or error rate exceeds the configured threshold.

The default request cap keeps the full local run below the API's global 200-request rate limit while still recording latency, TTFB, sustained RPS, peak RPS, status mix, and error rate for every route. Increase `BENCHMARK_MAX_REQUESTS_PER_ENDPOINT` when running against a staging target configured for load testing.

## Auth

Protected endpoints use `BENCHMARK_TOKEN` when provided. If no token is provided, the runner creates a dedicated admin benchmark user through `/api/auth/register` and uses the returned access token.

## Metrics

Each endpoint report includes:

- p50, p95, and p99 latency in milliseconds
- p50, p95, and p99 time to first byte in milliseconds
- sustained and peak requests per second
- status-code distribution
- error rate percentage
