# API Benchmark Suite

This suite benchmarks every current `/api/*` route and the `/health` probe with realistic payloads based on the existing validators and service shapes. It starts the Express API on a random local port by default, or targets an existing server when `BENCHMARK_BASE_URL` is set.

## Commands

```bash
npm run benchmark
npm run benchmark:smoke
```

`benchmark:smoke` is intended for CI. It uses lower concurrency and fewer iterations, but still checks every endpoint against `benchmarks/thresholds.json`.

## Configuration

Copy `.env.benchmark.example` to `.env.benchmark` and adjust values as needed:

```bash
BENCHMARK_BASE_URL=http://127.0.0.1:4000
BENCHMARK_AUTH_TOKEN=your-admin-benchmark-token
BENCHMARK_CONCURRENCY=2
BENCHMARK_ITERATIONS=4
BENCHMARK_WARMUP=1
```

When no `BENCHMARK_BASE_URL` is provided, the runner imports `apps/api/src/app.js`, starts the app locally, and creates a dedicated benchmark JWT for protected routes. When targeting staging or another remote host, provide a valid `BENCHMARK_AUTH_TOKEN` for the protected admin route.

The default local full-run settings stay under the current Express rate-limit window. Increase `BENCHMARK_CONCURRENCY` or `BENCHMARK_ITERATIONS` when benchmarking a staging environment configured for higher load.

## Output

Each run writes:

- JSON results to `benchmarks/results/<run-id>.json`
- Markdown summary to `benchmarks/results/<run-id>.md`

The summary includes p50, p95, p99 latency, p95 time to first byte, sustained RPS, peak RPS, and error rate for each endpoint. Threshold failures exit with a non-zero status.

## Scope

Covered routes:

- `GET /health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/oauth/github/callback`
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
