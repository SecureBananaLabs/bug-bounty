# API benchmarks

This benchmark suite measures the Express API with repeatable latency and throughput metrics:

- p50, p95, and p99 latency
- p50 and p95 time to first byte
- requests per second
- error rate
- per-scenario breakdown
- JSON and Markdown reports
- reviewable regression thresholds

## Run locally

From the repository root:

```bash
npm install
npm run benchmark:api
```

By default, the runner starts `apps/api/src/server.js` on a free local port, warms it up, runs the benchmark, and writes:

- `benchmarks/results/api-benchmark.json`
- `benchmarks/results/api-benchmark.md`
- `benchmarks/results/local-api.log`

## Run against an existing API

```bash
npm run benchmark:api -- --url http://127.0.0.1:4000 --duration 30 --concurrency 16
```

Copy `.env.benchmark.example` if you want to run an already-started API with explicit local settings.

Useful options:

```text
--url                 Existing API base URL. If omitted, the runner starts the local API.
--duration            Benchmark duration in seconds. Default: 15.
--warmup              Warmup duration in seconds. Default: 3.
--concurrency         Number of concurrent workers. Default: 8.
--output              JSON output path.
--summary             Markdown output path.
--thresholds          JSON threshold file. Default: benchmarks/thresholds.json.
--jwt-secret          Secret used to mint the dedicated benchmark token for auth routes.
--start-local=false   Require --url instead of starting the local API.
```

## CI

The `API benchmark` workflow runs a short smoke benchmark on every pull request, fails when the threshold file is exceeded, and uploads the benchmark reports as artifacts.
