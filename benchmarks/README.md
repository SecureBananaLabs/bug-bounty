# API benchmark suite

Run a full local benchmark:

```bash
npm run benchmark
```

Run the low-concurrency regression smoke gate:

```bash
npm run benchmark:smoke
```

By default the runner imports `apps/api/src/app.js`, starts the Express app on a local ephemeral port, and benchmarks every current `/api/*` route. Set `BENCHMARK_BASE_URL` to target an already running local or staging API instead.

Configuration can be copied from `.env.benchmark.example`. Results are written to `benchmarks/results/latest.json` and `benchmarks/results/latest.md`.

The smoke command checks `benchmarks/thresholds.json` and exits non-zero when an endpoint exceeds the configured p99 latency, error-rate, or non-2xx limits.
