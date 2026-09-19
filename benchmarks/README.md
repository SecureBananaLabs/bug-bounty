# API Benchmarks

This suite benchmarks `/health` plus every mounted `/api/*` route with synthetic payloads that match the current controllers and validators. It uses native Node.js APIs, so no extra benchmark dependency is required.

## Commands

```sh
npm run benchmark
npm run benchmark:smoke
```

By default the runner starts the local Express app on an ephemeral loopback port. To benchmark an already-running local or staging target, copy `benchmarks/.env.benchmark.example` to `benchmarks/.env.benchmark` and set `BENCHMARK_TARGET_URL`.

## Outputs

Results are written to:

- `benchmarks/results/full-latest.json`
- `benchmarks/results/smoke-latest.json`
- `benchmarks/results/summary.md`

Each endpoint captures request count, sustained and peak RPS, error rate, p50/p95/p99 latency, and p50/p95/p99 time to first byte. The smoke command uses the same threshold gate as the full run, with p99 and error-rate limits stored in `benchmarks/thresholds.json`.

Local defaults intentionally cap requests per endpoint so the benchmark covers every route without exhausting the API's global rate limiter. Set `BENCHMARK_MAX_REQUESTS_PER_ENDPOINT=0` when benchmarking a target where rate limits are disabled or sized for load testing.

## CI Gate

`.github/workflows/benchmark-smoke.yml` runs the smoke suite on pull requests. It fails if any endpoint exceeds its reviewable p99 threshold or returns an error rate above the configured limit.
