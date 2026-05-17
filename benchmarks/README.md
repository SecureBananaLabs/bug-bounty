# API Benchmark Suite

This suite benchmarks every current `/api/` route with realistic synthetic payloads from the existing route and validation schemas. It uses `autocannon` so local and CI runs produce comparable latency, throughput, error-rate, and TTFB numbers.

## Setup

1. Copy `.env.benchmark.example` to `.env.benchmark`.
2. Start the API with the same JWT secret: `JWT_SECRET=development-secret npm run dev -w apps/api`.
3. Run `npm run benchmark`.

For a CI-sized smoke gate, run `npm run benchmark:smoke`.

## Configuration

`BENCHMARK_TARGET` points at a local or staging API host. Protected routes use `BENCHMARK_AUTH_TOKEN` when it is set; otherwise the runner signs a dedicated benchmark token with `BENCHMARK_JWT_SECRET`.

`BENCHMARK_REQUESTS_PER_ENDPOINT` controls total requests per endpoint. Keep the default modest when using the development API because the application rate limiter is intentionally still active.

## Output

The runner writes:

- `benchmarks/results/latest.json`
- `benchmarks/results/latest.md`

Each endpoint records p50, p95, p99 latency, sustained and peak requests per second, error rate, TTFB, status-code distribution, and threshold status.

## Covered Routes

The route inventory lives in `benchmarks/endpoints.mjs` and currently covers:

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

## Thresholds

`benchmarks/thresholds.json` stores reviewable defaults and endpoint-specific overrides. The CI smoke job fails when p99 latency, TTFB, or error rate exceeds those thresholds.
