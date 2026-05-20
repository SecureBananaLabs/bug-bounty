# API Benchmark Suite

This suite benchmarks every route mounted under `/api/` and writes reproducible JSON and Markdown reports to `benchmarks/results/`.

## Run locally

```bash
npm run benchmark
```

By default, the runner starts the Express API in-process on an ephemeral local port, raises the local benchmark rate-limit ceiling, creates a dedicated benchmark JWT via `/api/auth/login`, and benchmarks each endpoint independently.

## Run against staging

```bash
cp .env.benchmark.example .env.benchmark
BENCHMARK_TARGET_URL=https://staging.example.com BENCHMARK_TOKEN=<dedicated-token> npm run benchmark
```

Use a dedicated benchmark token for protected routes such as `/api/admin/metrics`. If `BENCHMARK_TOKEN` is omitted, the runner attempts to obtain one from `/api/auth/login` using the benchmark fixture credentials.

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `BENCHMARK_TARGET_URL` | unset | Existing local/staging API URL. If unset, a local in-process server starts automatically. |
| `BENCHMARK_TOKEN` | unset | Dedicated bearer token for auth-protected benchmark routes. |
| `BENCHMARK_DURATION_SECONDS` | `10` | Per-endpoint measurement duration. |
| `BENCHMARK_CONCURRENCY` | `8` | Concurrent workers per endpoint. |
| `BENCHMARK_WARMUP_REQUESTS` | `2` | Warmup calls before each measured endpoint run. |
| `BENCHMARK_OUTPUT_DIR` | `benchmarks/results` | Output directory for JSON and Markdown reports. |
| `BENCHMARK_THRESHOLDS_PATH` | `benchmarks/thresholds.json` | Reviewable p99/error-rate gate config. |
| `BENCHMARK_SMOKE` | `false` | Marks CI smoke runs in generated reports. |
| `RATE_LIMIT_MAX` | app default | Set high for local benchmark runs to prevent rate-limit noise. |

## Metrics captured per endpoint

- p50, p95, and p99 total latency in milliseconds
- p50, p95, and p99 time to first byte (TTFB) in milliseconds
- sustained requests per second
- peak one-second requests per second
- status-code distribution
- error count and error-rate percentage

## CI smoke gate

`.github/workflows/benchmark-smoke.yml` runs a low-concurrency benchmark on pull requests. The job fails when any endpoint exceeds its p99 or error-rate threshold from `benchmarks/thresholds.json`.

## Endpoint coverage

The endpoint catalog in `benchmarks/endpoints.mjs` covers every Express route mounted under `/api/`:

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

Payloads are shaped from `packages/db/prisma/schema.prisma` and the current API validators/controllers.
