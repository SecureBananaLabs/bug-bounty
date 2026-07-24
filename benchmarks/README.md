# API Benchmarks

This suite benchmarks `/health` and every mounted `/api/*` route with synthetic local data. By default it starts the Express app in-process, so no database, production host, or secret token is required.

## Commands

```bash
npm run benchmark
npm run benchmark:smoke
```

Use `BENCHMARK_TARGET_URL` to point the suite at an already running local or staging server. Copy `benchmarks/.env.benchmark.example` when you want a repeatable environment file.

## Output

The runner writes:

- `benchmarks/results/latest.json`
- `benchmarks/results/summary.md`

Each endpoint report includes p50/p95/p99 latency, TTFB, requests per second, status counts, error rate, and non-2xx rate. Thresholds live in `benchmarks/thresholds.json`; the smoke command uses the `smoke` section.

The default full run sends nine requests per endpoint, which keeps the local in-process benchmark under the API's 200-request rate limit while still covering every mounted route.
