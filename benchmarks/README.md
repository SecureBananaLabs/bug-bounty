# API Benchmarks

Run `cp .env.benchmark.example .env.benchmark`, review the values, then run `npm run benchmark`. With no target URL, the runner starts an in-process API bound to loopback. Reports are written to `benchmarks/results/` and ignored by git. Set `BENCHMARK_TARGET_URL` to use a reachable local or staging API.

The suite covers every method/path currently registered beneath `/api/`. Requests use fixture payloads aligned with the current API validators and Prisma models. The API currently uses in-memory placeholder services, so this measures the present implementation, not production database behavior.

Every route scenario is run independently and includes POST requests. POSTs mutate data; set `BENCHMARK_ALLOW_MUTATIONS=1` only after confirming the target is disposable. Do not point it at production. Repeated runs on a remote target create repeated records where handlers persist data.

The protected admin metrics route needs an auth token. For the in-process API, the runner signs a short-lived benchmark admin JWT with `BENCHMARK_JWT_SECRET` (or a local fallback). For an external target, provide `BENCHMARK_TOKEN` or `BENCHMARK_JWT_SECRET` matching that API's `JWT_SECRET`. Tokens and secrets are never written to result reports.

Configuration is read from environment variables first, then `.env.benchmark`:

- `BENCHMARK_TARGET_URL`: target origin; blank starts the in-process API.
- `BENCHMARK_ALLOW_MUTATIONS`: must be `1` to run POST scenarios.
- `BENCHMARK_DURATION_SECONDS`, `BENCHMARK_CONCURRENCY`, `BENCHMARK_TIMEOUT_MS`: per-endpoint run settings.
- `BENCHMARK_THRESHOLDS`: JSON threshold file; `p99Ms` applies to each endpoint's total-response p99.
- `BENCHMARK_RESULTS_DIR`: output directory.
- `BENCHMARK_TOKEN` or `BENCHMARK_JWT_SECRET`: authorization for the protected route.

`npm run benchmark:smoke` runs the same full endpoint catalog. CI starts an isolated local API and runs with 1 second per endpoint and concurrency 1; the job fails if any route exceeds `benchmarks/thresholds.json`. The smoke job is a lightweight regression signal and not a production capacity benchmark.

Metrics use nearest-rank percentiles. Latency measures until the response body is fully read; TTFB measures until response headers arrive. Average requests/sec uses the run wall time. Peak requests/sec is the largest count completed within any wall-clock second. Non-2xx responses and network/timeout failures count as errors.
