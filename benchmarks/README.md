# API Benchmarks

This suite benchmarks `/health` plus every mounted `/api/*` route in the Express API.

## Commands

```bash
npm run benchmark:coverage
npm run benchmark:smoke
npm run benchmark
```

`benchmark:smoke` is intended for CI. `benchmark` runs a longer local baseline.

## Configuration

Copy `benchmarks/.env.benchmark.example` to `.env.benchmark` if you need custom settings.

Important variables:

- `BENCHMARK_BASE_URL`: target API host. If not already healthy, the runner starts `apps/api` locally.
- `BENCHMARK_DURATION_MS`: total target duration.
- `BENCHMARK_CONCURRENCY`: concurrent workers per scenario.
- `BENCHMARK_DISABLE_RATE_LIMIT`: opt-in local/non-production bypass for benchmark runs only.

## Outputs

Reports are written to `benchmarks/results/`:

- `latest.json`
- `latest.md`
- timestamped JSON/Markdown copies

The report includes p50, p95, p99 latency, sustained and peak RPS, error rate, TTFB, status counts, endpoint coverage, and threshold status.

## Thresholds

Reviewable thresholds live in `benchmarks/thresholds.json`. The smoke CI gate exits nonzero if thresholds fail.

## Covered endpoints

`npm run benchmark:coverage` verifies the manifest has not drifted from the current mounted route inventory. The manifest in `benchmarks/scenarios.mjs` covers `/health` and all current mounted `/api/*` routes, including the protected `/api/admin/metrics` route with a benchmark JWT acquired from `/api/auth/login`.
