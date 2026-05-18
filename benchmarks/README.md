# API Benchmarks

The benchmark suite covers every current route mounted under `/api/*`.

## Configure

Copy `.env.benchmark.example` to `.env.benchmark` when you need to target a
staging host or override the local defaults.

```sh
cp .env.benchmark.example .env.benchmark
```

Key settings:

- `BENCHMARK_BASE_URL`: target an already-running API; omitted starts the local Express app.
- `BENCHMARK_AUTH_TOKEN`: bearer token for protected routes; omitted generates a local admin token.
- `BENCHMARK_CONNECTIONS`: concurrent connections per endpoint.
- `BENCHMARK_REQUESTS_PER_ENDPOINT`: fixed request count per endpoint.
- `BENCHMARK_DURATION_SECONDS`: duration-based run; overrides fixed request count.

## Run

```sh
npm run benchmark
npm run benchmark:smoke
```

Both commands write JSON and Markdown reports under `benchmarks/results/`.

## Metrics

Each endpoint report includes:

- p50, p95, and p99 latency
- sustained and peak requests per second
- error rate from network errors, timeouts, and non-2xx responses
- measured time to first byte

The smoke command enforces `benchmarks/thresholds.json` and is wired into CI.
