# API Benchmarks

This suite benchmarks every mounted `/api/*` route in the Express API and writes a JSON report plus a Markdown summary to `benchmarks/results/`.

## Commands

```sh
npm run benchmark
npm run benchmark:smoke
```

`npm run benchmark` starts the local API app on an ephemeral loopback port unless `BENCHMARK_TARGET_URL` is set. `npm run benchmark:smoke` uses short duration and low concurrency for CI.

## Configuration

Copy `benchmarks/.env.benchmark.example` into your shell or CI environment and adjust:

- `BENCHMARK_TARGET_URL`: target an already-running local or staging server.
- `BENCHMARK_DURATION_MS`: duration per endpoint for full runs.
- `BENCHMARK_CONCURRENCY`: concurrent workers per endpoint.
- `BENCHMARK_WARMUP_REQUESTS`: warmup requests per endpoint.
- `BENCHMARK_MAX_REQUESTS_PER_ENDPOINT`: optional request cap per endpoint.
- `BENCHMARK_AUTH_TOKEN`: optional JWT for protected endpoints. If omitted, the runner creates an admin benchmark token using `JWT_SECRET`.
- `BENCHMARK_FAIL_ON_THRESHOLD`: set to `false` to generate reports without failing on threshold violations.

Thresholds live in `benchmarks/thresholds.json` and are intentionally reviewable.

`benchmarks/ci/api-benchmark-smoke.yml` contains a GitHub Actions smoke job template that runs `npm run benchmark:smoke`.
