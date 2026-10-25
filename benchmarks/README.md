# API Benchmark Suite

This suite benchmarks every route mounted under `/api/` with realistic request bodies, auth headers for protected routes, and reproducible JSON plus Markdown output.

## Usage

Run a full local benchmark:

```sh
npm run benchmark
```

Run the low-concurrency smoke gate used by CI:

```sh
npm run benchmark:smoke
```

If `BENCHMARK_TARGET_URL` is not set, the runner starts the Express app in-process on an ephemeral local port. To benchmark an already running local or staging server, copy the template and set the target URL:

```sh
cp benchmarks/.env.benchmark.example .env.benchmark
BENCHMARK_TARGET_URL=https://staging.example.com npm run benchmark
```

## Configuration

The runner reads `.env.benchmark` first, then environment variables:

- `BENCHMARK_TARGET_URL`: API origin to benchmark. Leave empty to auto-start the local Express app.
- `BENCHMARK_DURATION`: seconds per endpoint. Default: `10`.
- `BENCHMARK_CONNECTIONS`: concurrent connections. Default: `20`.
- `BENCHMARK_PIPELINING`: HTTP pipelining depth. Default: `1`.
- `BENCHMARK_AUTH_TOKEN`: bearer token for auth-protected routes.
- `BENCHMARK_JWT_SECRET`: fallback secret used to create a benchmark token when `BENCHMARK_AUTH_TOKEN` is omitted. Default: `development-secret`.
- `BENCHMARK_DISABLE_RATE_LIMIT`: set to `true` for local in-process benchmarks so the API limiter does not dominate baseline latency. Default: `true` when auto-starting the local app.
- `BENCHMARK_OUTPUT_DIR`: result directory. Default: `benchmarks/results`.

Endpoint coverage lives in `benchmarks/endpoints.json`. Regression thresholds live in `benchmarks/thresholds.json`.
