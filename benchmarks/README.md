# API Benchmarks

This directory contains a reproducible benchmark suite for the FreelanceFlow API.

## Commands

```sh
npm run benchmark
npm run benchmark:smoke
```

`npm run benchmark` runs the full local suite. If `BENCHMARK_TARGET_URL` is unset, the runner starts the local Express app in-process on a random loopback port. If `BENCHMARK_TARGET_URL` is set, the runner targets that API instead.

`npm run benchmark:smoke` runs the same endpoint inventory with one request per endpoint and one concurrent worker. The GitHub Actions smoke workflow uses this mode as a regression gate.

## Configuration

Copy `.env.benchmark.example` to `.env.benchmark` and adjust values as needed.

Key variables:

- `BENCHMARK_TARGET_URL`: target API base URL. Leave unset for local in-process benchmarking.
- `BENCHMARK_AUTH_TOKEN`: optional token for protected routes. If omitted, the runner generates a benchmark admin token using `JWT_SECRET`.
- `BENCHMARK_REQUESTS_PER_ENDPOINT`: request count per endpoint.
- `BENCHMARK_CONCURRENCY`: maximum concurrent requests per endpoint.
- `BENCHMARK_TIMEOUT_MS`: request timeout in milliseconds.
- `BENCHMARK_RESULTS_DIR`: output directory for JSON and Markdown reports.

## Coverage

The suite covers `/health` and every route mounted under `/api/`:

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

Each endpoint uses a representative request payload where applicable. The admin route is exercised with a dedicated benchmark admin token.

## Results

Each run writes:

- `benchmarks/results/benchmark-<timestamp>.json`
- `benchmarks/results/benchmark-<timestamp>.md`

Reports include p50, p95, p99 latency, p95 TTFB, sustained RPS, peak one-second RPS, and error rate per endpoint.
