# API Benchmarks

This directory contains the reproducible baseline benchmark suite for the Express API.

## Setup

Copy the benchmark environment template when you need to override the defaults:

```bash
cp benchmarks/.env.benchmark.example benchmarks/.env.benchmark
```

Supported settings:

- `BENCHMARK_BASE_URL`: target API host, default `http://127.0.0.1:4000`
- `BENCHMARK_CONCURRENCY`: concurrent requests per endpoint
- `BENCHMARK_REQUESTS_PER_ENDPOINT`: total requests sent to each endpoint
- `BENCHMARK_TIMEOUT_MS`: per-request timeout
- `BENCHMARK_AUTH_SECRET`: secret used to mint the dedicated benchmark JWT for protected routes
- `BENCHMARK_AUTH_TOKEN`: optional pre-generated bearer token; takes precedence over `BENCHMARK_AUTH_SECRET`
- `BENCHMARK_THRESHOLD_FILE`: p99/error-rate gate configuration

## Run

Start the API:

```bash
npm run dev -w apps/api
```

Run the full benchmark suite:

```bash
npm run benchmark
```

Run the low-concurrency CI smoke benchmark and threshold gate:

```bash
npm run benchmark:smoke
```

## Coverage

`api-scenarios.json` includes every route mounted under `/api/`, including auth, users, jobs, proposals, payments, reviews, messages, notifications, uploads, search, and admin metrics. Protected routes use a dedicated benchmark bearer token so the run does not depend on a human account.

## Output

Each run writes:

- `benchmarks/results/api-benchmark-<timestamp>.json`
- `benchmarks/results/api-benchmark-<timestamp>.md`

The markdown summary includes p50, p95, p99 latency, sustained and peak requests per second, error rate, and TTFB metrics per endpoint.
