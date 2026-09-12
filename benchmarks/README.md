# FreelanceFlow API Benchmarks

Measures **p50, p95, p99 latency**, **RPS**, **error rate**, and **TTFB** for all platform API endpoints.

## Setup

```bash
cd benchmarks
npm install
```

Copy `.env.benchmark.example` to `.env.benchmark` and set `BENCHMARK_HOST`.

## Run

```bash
# From repo root
npm run benchmark -w benchmarks

# Or directly
cd benchmarks && node run.js --host http://localhost:4000
```

## Smoke mode (CI)

```bash
node run.js --smoke
```

Low concurrency, short duration. Exits non-zero if any p99 exceeds the threshold in `thresholds.json`.

## Output

Results are written to `benchmarks/results/` as:
- `<timestamp>.json` — raw machine-readable data
- `<timestamp>.md` — human-readable markdown summary

## Thresholds

Edit `benchmarks/thresholds.json` to adjust failure thresholds per endpoint.
