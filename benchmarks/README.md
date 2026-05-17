# API Benchmarks

This suite benchmarks every route mounted under `/api/` with realistic JSON or multipart payloads derived from the current route validators and service contracts.

## Run Locally

```bash
cp .env.benchmark.example .env.benchmark
npm run benchmark
```

When `BENCHMARK_TARGET_URL` is empty, the runner starts the local Express app on an ephemeral port and benchmarks it over loopback. For local benchmark runs, `BENCHMARK_DISABLE_RATE_LIMIT=1` avoids measuring the in-memory rate limiter instead of endpoint code. Set it to `0` when you explicitly want rate-limit behavior included.

To benchmark an already running API, set:

```bash
BENCHMARK_TARGET_URL=http://127.0.0.1:4000 npm run benchmark
```

For protected routes such as `/api/admin/metrics`, set `BENCHMARK_AUTH_TOKEN` when targeting staging or production-like environments. Local runs generate a benchmark JWT from the repository's `JWT_SECRET`.

## Output

Results are written to `benchmarks/results/` as:

- `benchmark-<mode>-<timestamp>.json`
- `benchmark-<mode>-<timestamp>.md`

Each report includes p50, p95, p99 latency, sustained and peak requests per second, error rate, and TTFB samples for each endpoint. When the installed `autocannon` version does not expose an exact p95 field, the runner records the stricter p97.5 value as `p95Ms` and notes the source in JSON.

## CI Smoke Gate

`npm run benchmark:smoke` runs a low-concurrency pass suitable for pull requests. It uses `benchmarks/thresholds.json` and fails if any endpoint exceeds its configured p99 latency or error-rate threshold.
