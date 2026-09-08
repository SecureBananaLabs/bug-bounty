# API Benchmark Suite

This benchmark covers `/health` plus every currently mounted `/api/*` route in the Express API. It starts the local app automatically when `BENCHMARK_TARGET_URL` is unset, or it can target a staging/local URL supplied through the environment.

## Run

```sh
cp .env.benchmark.example .env.benchmark
npm run benchmark
```

For a low-concurrency regression gate:

```sh
npm run benchmark:smoke
```

## Configuration

- `BENCHMARK_TARGET_URL`: existing target host. Leave empty to start the local Express app.
- `BENCHMARK_REQUESTS`: requests per endpoint, default `20`.
- `BENCHMARK_CONCURRENCY`: concurrent requests per endpoint, default `4`.
- `BENCHMARK_TIMEOUT_MS`: per-request timeout, default `5000`.
- `BENCHMARK_OUTPUT_DIR`: report directory, default `benchmarks/results`.
- `JWT_SECRET`: secret used for the benchmark-only admin JWT.

## Output

Each run writes:

- `benchmarks/results/api-benchmark-latest.json`
- `benchmarks/results/api-benchmark-latest.md`

The JSON report includes p50, p95, p99, mean latency, TTFB, sustained/peak RPS, error rate, and status distribution for each endpoint. The smoke mode compares results against `benchmarks/thresholds.json`.
