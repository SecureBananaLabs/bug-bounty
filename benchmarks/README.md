# API Benchmarks

This suite benchmarks the current Express API surface with Node's built-in `fetch`.

## Commands

```bash
npm run benchmark
npm run benchmark:smoke
```

By default the runner starts the local API on an ephemeral loopback port. To target an existing local or staging API, copy `benchmarks/.env.benchmark.example` to `benchmarks/.env.benchmark` and set `BENCHMARK_TARGET_URL`.

## Coverage

The route manifest covers `/health` and every mounted `/api/*` route in `apps/api/src/app.js`:

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

The protected admin route uses a benchmark token obtained from the local auth endpoint before the route suite starts.

## Output

Each run writes:

- `benchmarks/results/benchmark-<mode>.json`
- `benchmarks/results/benchmark-<mode>.md`

The JSON contains p50, p95, p99, sustained RPS, peak RPS, error rate, and TTFB metrics per endpoint. The Markdown report is intended for PR summaries.

## Regression Gate

`npm run benchmark:smoke` reads `benchmarks/thresholds.json` and exits non-zero if any endpoint exceeds its p99 latency threshold or error-rate threshold.
