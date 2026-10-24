# API Benchmarks

This suite benchmarks the current FreelanceFlow API surface with realistic local payloads and a benchmark JWT for protected routes.

## Commands

```bash
npm run benchmark
npm run benchmark:smoke
```

By default the runner starts the Express app locally on a random port. Set `BENCHMARK_TARGET_URL` to benchmark an already-running local or staging server.

## Configuration

Copy `benchmarks/.env.benchmark.example` into your environment and adjust:

- `BENCHMARK_TARGET_URL`: optional target host.
- `BENCHMARK_REQUESTS`: requests per endpoint.
- `BENCHMARK_CONCURRENCY`: concurrent requests per endpoint.
- `BENCHMARK_P99_THRESHOLD_MS`: p99 latency gate.
- `BENCHMARK_ERROR_RATE_THRESHOLD`: error-rate gate in percent.

Results are written to:

- `benchmarks/results/latest.json`
- `benchmarks/results/latest.md`
- `benchmarks/demo/benchmark-smoke-demo.mp4` is a short demo artifact showing the validation path used for the bounty submission.

The default full run uses 8 requests per endpoint so local runs stay under the API's built-in 200-request rate limiter while still reporting every route. Increase `BENCHMARK_REQUESTS` when targeting a staging server with an appropriate load-test policy.

`npm run benchmark:smoke` uses lower load and is intended for CI regression checks.
