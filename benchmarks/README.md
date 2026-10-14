# API Benchmark Suite

This benchmark suite covers the Express API route surface with realistic synthetic marketplace payloads. It runs against a local in-memory app by default, or against a staging/local target when `BENCHMARK_TARGET_URL` is set.

## Commands

```bash
npm run benchmark
npm run benchmark:smoke
npm run test:benchmarks
```

`npm run benchmark` runs the full profile. `npm run benchmark:smoke` runs a short low-concurrency profile suitable for CI.

## Configuration

Copy `benchmarks/.env.benchmark.example` to `benchmarks/.env.benchmark` or set variables in your shell:

```bash
BENCHMARK_TARGET_URL=http://127.0.0.1:4000
BENCHMARK_DURATION_SECONDS=5
BENCHMARK_CONNECTIONS=10
BENCHMARK_PIPELINING=1
BENCHMARK_TTFB_SAMPLES=5
BENCHMARK_JWT_SECRET=development-secret
```

When `BENCHMARK_TARGET_URL` is empty, the runner imports `apps/api/src/app.js`, starts it on a random loopback port, sets `BENCHMARK_MODE=true`, and benchmarks that local server. The API rate limiter skips only when `BENCHMARK_MODE=true` so load tests are not polluted by `429` responses.

## Coverage

The suite covers:

- `/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/oauth/:provider/callback`
- `POST /api/auth/refresh`
- `GET /api/users`
- `POST /api/users`
- `GET /api/jobs`
- `POST /api/jobs`
- `GET /api/proposals`
- `POST /api/proposals`
- `POST /api/payments`
- `GET /api/reviews`
- `POST /api/reviews`
- `GET /api/messages`
- `POST /api/messages`
- `GET /api/notifications`
- `POST /api/notifications`
- `POST /api/uploads`
- `GET /api/search`
- `GET /api/admin/metrics`

`npm run test:benchmarks` compares the benchmark registry against the current Express route files so future API routes are not silently skipped.

## Outputs

Results are written to `benchmarks/results/`:

- `api-benchmark-<profile>-<timestamp>.json`
- `api-benchmark-<profile>-<timestamp>.md`
- `latest.json`
- `latest.md`

Each endpoint report includes p50, p95, p99 latency, sustained and peak RPS, error rate, status-code distribution, and sampled TTFB percentiles.

## Regression Gate

Thresholds live in `benchmarks/thresholds.json`. The runner fails when p99 latency, p95 TTFB, error rate, or minimum sustained RPS breach the reviewable threshold.
