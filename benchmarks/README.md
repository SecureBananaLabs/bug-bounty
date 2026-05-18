# API Benchmark Suite

This suite uses `autocannon` to measure latency, throughput, and error rates of the API endpoints.

## Setup
1. Copy `.env.benchmark` and configure `BENCHMARK_TARGET_HOST` and your test token.
2. Ensure you have installed the root dependencies: `npm install`

## Running Benchmarks
Run the entire suite using:
```bash
npm run benchmark
```

Results are exported as JSON and summarized in a Markdown table in `/benchmarks/results/`. CI pipelines automatically run this and check against limits defined in `thresholds.json`.
