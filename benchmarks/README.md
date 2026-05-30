# API Benchmarks

Run the full local benchmark suite:

```bash
npm run benchmark
```

Run the CI-sized smoke benchmark:

```bash
npm run benchmark:smoke
```

By default the runner starts the local Express app on a random loopback port. To benchmark another environment, copy `.env.benchmark.example` to `.env.benchmark` and set `BENCHMARK_TARGET_URL`.

The suite covers `/health` and all mounted `/api/*` routes in the API app. Request bodies use the same fields expected by the current controllers and validators, and the admin route receives a dedicated benchmark JWT.

Outputs are written to `benchmarks/results/`:

- `api-benchmark-<mode>-latest.json`
- `api-benchmark-<mode>-latest.md`

Regression thresholds live in `benchmarks/thresholds.json`. The smoke command exits non-zero if a route exceeds its p99 threshold or error-rate budget, so it can be used directly as a CI gate.
