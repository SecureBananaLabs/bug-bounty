# API Benchmarks

This directory contains the reproducible API benchmark suite for FreelanceFlow.

## Run

```bash
npm run benchmark
```

For a low-concurrency regression gate:

```bash
npm run benchmark:smoke
```

By default the runner starts the local Express app from `apps/api/src/app.js` and targets `http://127.0.0.1:4000`.
Set `BENCHMARK_START_SERVER=0` when benchmarking an already-running local or staging server.

## Configuration

Copy `.env.benchmark.example` and adjust values as needed:

- `BENCHMARK_TARGET_URL`: target server URL.
- `BENCHMARK_REQUESTS`: requests per endpoint.
- `BENCHMARK_CONCURRENCY`: concurrent workers per endpoint.
- `BENCHMARK_WARMUP_REQUESTS`: warmup requests before measurement.
- `BENCHMARK_AUTH_TOKEN`: optional dedicated benchmark token for protected endpoints.
- `BENCHMARK_RESULTS_DIR`: output folder for JSON and markdown reports.

If `BENCHMARK_AUTH_TOKEN` is not provided, the runner creates a local admin token through `/api/auth/register` before benchmarking protected routes.

## Coverage

`endpoints.json` covers every current route mounted under `/api/`:

- `/api/auth/*`
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

Each run writes:

- `benchmarks/results/latest.json`
- `benchmarks/results/latest.md`

Thresholds live in `benchmarks/thresholds.json`. The smoke command exits non-zero if p99 latency or error rate exceeds the configured gate.
