# API Benchmarks

This suite benchmarks `/health` plus every mounted `/api/*` route with realistic synthetic request bodies. It records p50, p95, and p99 latency, sustained and peak requests per second, error rate, and time to first byte.

## Commands

```bash
npm run benchmark
npm run benchmark:smoke
npm run benchmark -- --list
```

If `BENCHMARK_TARGET_URL` is not set, the runner starts the Express app in-process on a random loopback port. To benchmark a running local or staging server, copy `.env.benchmark.example` to `.env.benchmark`, export the values for your shell, and set `BENCHMARK_TARGET_URL`.

Auth-protected routes use `BENCHMARK_AUTH_TOKEN` when provided. If it is omitted, the runner creates a benchmark-only admin token with the repository's local JWT secret.

For local in-process runs, the app uses `NODE_ENV=benchmark` and skips the API rate limiter so endpoint latency is not replaced by anti-abuse 429 responses. External target benchmarks do not change the target server's environment, so provide a dedicated benchmark host or token if rate limiting should be configured differently there.

## Output

Full runs write timestamped JSON results and a Markdown summary under `benchmarks/results/`. Smoke runs use the same threshold checks with lower concurrency and shorter duration, making them suitable for CI regression gates.

Thresholds live in `benchmarks/thresholds.json` so reviewers can adjust p99 latency and error-rate limits per endpoint.
