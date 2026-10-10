# API Benchmark Suite — /benchmarks

Reproducible API benchmark suite for the platform Express API. Measures
p50/p95/p99 latency, RPS (peak + sustained), error rate and TTFB per endpoint,
with reviewable regression thresholds and JSON + Markdown output.

## Quick start

```bash
# 1. install dev dep
npm install -D autocannon   # (already in root devDependencies in CI)

# 2. run the full suite (starts the Express app locally on port 4010)
npm run benchmark

# 3. run the CI smoke gate (low concurrency, threshold-checked)
npm run benchmark:smoke
```

## Configuration

Copy `.env.benchmark.example` to `.env.benchmark` to point at a remote/staging
target instead of local loopback:

```bash
BENCHMARK_TARGET_URL=http://localhost:4010   # app-under-test base URL
BENCHMARK_DURATION=5                          # seconds per endpoint
BENCHMARK_CONNECTIONS=20                      # autocannon connections
BENCHMARK_SMOKE_MODE=false                    # true = CI regression gate
```

## Output

- `benchmarks/results/benchmark.json` — machine-readable per-endpoint metrics
- `benchmarks/results/benchmark.md` — human-readable summary (attach to PR)
- `benchmarks/thresholds.json` — reviewable regression thresholds (p99 ms)

## Endpoint inventory

Every mounted `/api/*` route is exercised with production-shaped payloads.
Auth-protected routes use a dedicated benchmark admin JWT (see
`lib/auth.js`). Multipart routes are covered with boundary-correct
`multipart/form-data` payloads.

## How it works

1. `run-benchmark.js` starts `apps/api` in-process on port 4010 (or honors
   `BENCHMARK_TARGET_URL`).
2. The route manifest (`manifest.js`) enumerates every mounted endpoint with
   its method, realistic payload and auth requirement.
3. `autocannon` drives each endpoint, recording request-rate, latency
   percentiles, errors and TTFB.
4. Results are written to `results/` as JSON + Markdown.
5. In smoke mode, the suite fails the run if any endpoint's p99 exceeds its
   threshold in `thresholds.json`.