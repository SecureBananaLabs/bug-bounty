# API Benchmark Suite

This suite measures the platform API with reproducible, local-first benchmark runs. By default it starts the Express app in-process on a loopback port, then exercises `/health` plus every route mounted below `/api/`.

## Commands

```sh
npm run benchmark
npm run benchmark:smoke
```

`npm run benchmark` runs the full local suite and writes JSON plus Markdown output to `benchmarks/results/`.

`npm run benchmark:smoke` runs a low-concurrency regression gate and fails if `benchmarks/thresholds.json` is exceeded.

## Configuration

Copy `.env.benchmark.example` to `.env.benchmark` to override defaults:

```sh
cp .env.benchmark.example .env.benchmark
```

Useful variables:

- `BENCHMARK_TARGET_URL`: benchmark an existing API instead of starting the local Express app.
- `BENCHMARK_REQUESTS_PER_ENDPOINT`: total measured requests per endpoint.
- `BENCHMARK_CONCURRENCY`: concurrent workers per endpoint.
- `BENCHMARK_TIMEOUT_MS`: per-request timeout.
- `BENCHMARK_OUTPUT_DIR`: where JSON and Markdown reports are written.
- `JWT_SECRET`: secret used for benchmark-only bearer tokens.

## Endpoint Coverage

The runner covers:

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

Payloads are synthetic but shaped to the current controller schemas and service records. Protected routes use benchmark-only JWTs generated locally from the configured `JWT_SECRET`.
