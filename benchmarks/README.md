# API Benchmarks

This benchmark suite covers `/health` and every mounted `/api/*` route in the Express API. It starts the app locally by default, or it can target an already-running local or staging API with `BENCHMARK_TARGET_URL`.

## Commands

```bash
npm run benchmark
npm run benchmark:smoke
```

`npm run benchmark` writes a full JSON report and Markdown summary under `benchmarks/results/`. `npm run benchmark:smoke` runs a lower-request-count pass and checks the results against `benchmarks/thresholds.json`.

## Configuration

Copy `.env.benchmark.example` to `.env.benchmark` when you need to override defaults.

```bash
cp .env.benchmark.example .env.benchmark
```

Supported values:

- `BENCHMARK_TARGET_URL`: optional API base URL. When omitted, the runner starts the Express app on loopback.
- `BENCHMARK_AUTH_TOKEN`: optional bearer token for protected routes when targeting a remote API.
- `BENCHMARK_REQUESTS_PER_ENDPOINT`: number of requests issued to each endpoint.
- `BENCHMARK_CONCURRENCY`: per-endpoint concurrency.
- `JWT_SECRET`: used to mint the local benchmark-only admin token when no token is supplied.

The default request counts are intentionally modest so the current API rate limiter does not distort baseline measurements. Increase them when benchmarking an environment configured for sustained load.

## Covered Routes

- `GET /health`
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

Each write endpoint uses synthetic payloads shaped like the current service and validation contracts. The admin metrics endpoint uses a dedicated benchmark token.
