# API Benchmarks

This suite benchmarks every mounted `/api/*` route in the Express app and writes both machine-readable and human-readable output to `benchmarks/results/`.

## Commands

```bash
npm run benchmark
npm run benchmark:smoke
```

By default the runner starts the local Express app on an ephemeral loopback port. To target an already-running local or staging API, copy `.env.benchmark.example` and export the values in your shell:

```bash
export BENCHMARK_TARGET_URL=http://127.0.0.1:4000
export BENCHMARK_REQUESTS=6
export BENCHMARK_CONCURRENCY=4
npm run benchmark
```

Protected routes use `BENCHMARK_TOKEN` when provided. If it is omitted, the runner generates a short-lived benchmark JWT using the app's local development secret.

## Output

- `benchmarks/results/latest.json`
- `benchmarks/results/latest.md`

Each endpoint report includes p50, p95, p99 latency, p95 TTFB, sustained RPS, peak one-second RPS, error rate, status code distribution, and threshold pass/fail status.

Thresholds live in `benchmarks/thresholds.json`. The CI smoke job runs `npm run benchmark:smoke` with low request counts so regressions are caught without creating noisy load in pull requests.
