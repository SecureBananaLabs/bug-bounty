# API Benchmarks

This directory contains the reproducible API benchmark for every route mounted under `/api/*`, plus the public `/health` probe.

## Commands

Run the full local benchmark:

```sh
npm run benchmark
```

Run the CI smoke benchmark:

```sh
npm run benchmark:smoke
```

Both commands write:

- `benchmarks/results/latest.json`
- `benchmarks/results/latest.md`

## Configuration

Copy `.env.benchmark.example` to `.env.benchmark` when you need to override defaults.

By default the runner starts the local Express app in-process on a random port. Set `BENCHMARK_TARGET_URL` to benchmark a deployed API instead.

Protected routes need dedicated benchmark tokens when running against a deployed target:

```sh
BENCHMARK_TARGET_URL=https://api.example.com
BENCHMARK_ADMIN_TOKEN=<dedicated benchmark admin jwt>
```

For local loopback runs, the benchmark generates short-lived JWTs with a `benchmark: true` claim using the app's configured `JWT_SECRET`.

## Coverage

The endpoint matrix lives in `benchmarks/endpoints.mjs` and currently covers:

- `/api/auth/register`
- `/api/auth/login`
- `/api/auth/oauth/:provider/callback`
- `/api/auth/refresh`
- `/api/users`
- `/api/jobs`
- `/api/proposals`
- `/api/payments`
- `/api/reviews`
- `/api/messages`
- `/api/notifications`
- `/api/uploads`
- `/api/search`
- `/api/admin/metrics`

Each endpoint includes a realistic request scenario and payload where the route accepts a request body.

## Metrics

The runner records:

- p50, p95 and p99 full-response latency
- p50, p95 and p99 time to first byte
- sustained and peak requests per second
- error rate
- status-code distribution

Thresholds for CI live in `benchmarks/thresholds.json`.
