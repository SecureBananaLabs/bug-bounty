# Benchmarks

Run full API benchmarks:

```bash
npm run benchmark
```

## Configuration

1. Copy `benchmarks/.env.benchmark.example` to `.env.benchmark` in the repo root.
2. Set `BENCHMARK_BASE_URL` and optional `BENCHMARK_AUTH_TOKEN`.
3. Tune `BENCHMARK_CONNECTIONS` and `BENCHMARK_DURATION` as needed.

## Outputs

Each run writes to `benchmarks/results/`:
- `benchmark-<timestamp>.json`
- `benchmark-<timestamp>.md`

## Smoke mode

CI uses smoke mode to enforce p99 thresholds from `benchmarks/thresholds.json`:

```bash
BENCHMARK_SMOKE=1 BENCHMARK_CONNECTIONS=2 BENCHMARK_DURATION=2 npm run benchmark
```
