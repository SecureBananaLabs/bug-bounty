# API Benchmarks

This suite measures the FreelanceFlow API locally by default and can also target a running API with `BENCHMARK_TARGET_URL`.

## Commands

```sh
npm run benchmark
npm run benchmark:smoke
```

`benchmark:smoke` runs a short, CI-friendly pass. Full benchmark runs use more samples per endpoint while staying under the local API rate limit by default.

## Configuration

Copy `benchmarks/benchmark.env.example` to `benchmarks/.env.benchmark` or export the variables in your shell before running.

Key settings:

- `BENCHMARK_TARGET_URL`: optional existing API base URL. If omitted, the runner starts the Express app on a random local port.
- `BENCHMARK_REQUESTS`: requests per endpoint. Defaults to `8`, or `3` in smoke mode.
- `BENCHMARK_CONCURRENCY`: concurrent requests per endpoint. Defaults to `4`, or `1` in smoke mode.
- `BENCHMARK_AUTH_TOKEN`: optional bearer token for protected routes when targeting an external API.

Results are written to `benchmarks/results/latest.json` and `benchmarks/results/latest.md`.
