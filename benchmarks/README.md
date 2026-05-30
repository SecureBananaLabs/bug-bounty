# API Benchmark Suite

This benchmark suite measures baseline API performance for the Express backend.

## Run

Start the API in one terminal:

```bash
npm run dev -w apps/api
```

Run benchmarks in another terminal:

```bash
npm run benchmark
```

Override defaults:

```bash
BENCHMARK_BASE_URL=http://127.0.0.1:4000 BENCHMARK_DURATION_SECONDS=10 BENCHMARK_CONCURRENCY=4 npm run benchmark
```

## Configuration

- `benchmark.config.json` defines endpoints, payloads, concurrency, duration, and timeout.
- `thresholds.json` defines p99 latency and error-rate limits for the regression gate.

## Output

Each run writes:

- `benchmarks/results/latest.json`
- `benchmarks/results/latest.md`

The Markdown summary is intended to be pasted into PR descriptions.
