# API Benchmark Suite

This directory contains a reproducible benchmark suite for the platform API.

## Coverage

The suite covers every route mounted under `/api/` in `apps/api/src/app.js` plus `/health` for server readiness:

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
- `GET /api/search?q=...`
- `GET /api/admin/metrics` with a benchmark token

Payloads live in `routes.mjs` so reviewers can inspect and tune realistic request bodies without changing the runner.

## Commands

From the repository root:

```bash
npm run benchmark
```

Smoke mode for CI:

```bash
npm run benchmark:smoke
```

Optional overrides:

```bash
npm run benchmark -- --requests 20 --concurrency 4 --warmup 2
npm run benchmark:smoke -- --requests 3 --concurrency 1
```

## Target selection

If `BENCHMARK_TARGET_URL` is unset, the runner starts the local Express app on a random loopback port and benchmarks that process.

If `BENCHMARK_TARGET_URL` is set, the runner benchmarks that local/staging host instead:

```bash
BENCHMARK_TARGET_URL=http://localhost:4000 npm run benchmark
```

Do not run this against production unless the service owner has explicitly approved the load profile.

## Auth-protected routes

`GET /api/admin/metrics` uses a dedicated benchmark token.

- Set `BENCHMARK_AUTH_TOKEN` to use a real staging benchmark token.
- If omitted, the runner creates a short-lived HS256 token using `JWT_SECRET` or the local development default.

## Output

Every run writes both machine-readable and human-readable output:

```text
benchmarks/results/<mode>-<timestamp>.json
benchmarks/results/<mode>-<timestamp>.md
```

Captured per endpoint:

- p50, p95, p99 latency in milliseconds
- p50, p95, p99 time-to-first-byte in milliseconds
- sustained requests per second
- peak requests-per-second estimate
- error rate percentage
- status-code counts

## Regression gate

`thresholds.json` stores reviewable limits. CI runs smoke mode and fails if any endpoint exceeds configured p99 latency or error-rate thresholds.

The default thresholds are intentionally conservative for local/CI smoke checks. Tighten them after collecting representative staging baselines.
