# API Benchmark Suite

This directory contains a reproducible benchmark suite for every mounted API endpoint.

## Setup

1. Install dependencies from the repository root.
2. Start the API server.
3. Copy `benchmarks/.env.benchmark.example` to `benchmarks/.env.benchmark` and adjust the target if needed.
4. Run the suite.

```bash
npm install
npm run dev -w apps/api
npm run benchmark
```

The runner writes JSON and Markdown reports to `benchmarks/results/`.

## Commands

```bash
npm run benchmark:coverage
npm run benchmark:smoke
npm run benchmark
```

- `benchmark:coverage` verifies that `benchmarks/endpoints.json` covers every route mounted in `apps/api/src/app.js`.
- `benchmark:smoke` runs a low-concurrency suite suitable for CI and enforces `thresholds.json`.
- `benchmark` runs the default local suite and also enforces the configured thresholds.

## Environment

The runner reads `benchmarks/.env.benchmark` when present. Environment variables set in the shell take precedence.

| Variable | Default | Purpose |
| --- | --- | --- |
| `BENCHMARK_TARGET` | `http://127.0.0.1:4000` | API host to benchmark. |
| `BENCHMARK_CONCURRENCY` | `4` | Concurrent requests per endpoint. |
| `BENCHMARK_REQUESTS_PER_ENDPOINT` | `8` | Total requests sent to each endpoint. |
| `BENCHMARK_RESULTS_DIR` | `benchmarks/results` | Output directory for reports. |
| `JWT_SECRET` | `development-secret` | Signs the local benchmark token for protected routes. |
| `BENCHMARK_AUTH_TOKEN` | unset | Preissued token for staging or remote hosts. |

For auth-protected routes, the runner uses `BENCHMARK_AUTH_TOKEN` when provided. Otherwise it signs a short-lived benchmark token with `JWT_SECRET`.
