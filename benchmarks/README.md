# API Benchmarks

This benchmark suite covers every route mounted under `/api/` plus `/health`.
It records latency percentiles, time to first byte, throughput, and error rate
for each endpoint.

## Configuration

Copy the template and adjust values for the target environment:

```bash
cp .env.benchmark.example .env.benchmark
```

`BENCHMARK_TARGET_URL` points at a running API server. If it is omitted, the
benchmark starts the local Express app on an ephemeral port for reproducible
local and CI runs.

Auth-protected endpoints use `BENCHMARK_AUTH_TOKEN` when it is set. Otherwise
the runner creates a dedicated local benchmark JWT signed with `JWT_SECRET` or
the development default.

## Commands

Run the full suite:

```bash
npm run benchmark
```

Run a low-concurrency smoke benchmark and enforce thresholds:

```bash
npm run benchmark:smoke
```

Results are written to `benchmarks/results/` as:

- `latest.json`
- `latest.md`

Historical runs can be kept by copying these files after each run.

## Endpoint Matrix

Endpoint definitions live in `benchmarks/endpoints.json`. Each entry includes
the HTTP method, path, expected status codes, and realistic sample payloads
based on the current API schemas.

Thresholds live in `benchmarks/thresholds.json`. CI uses the smoke profile so
the gate catches obvious regressions without turning normal pull requests into
long load tests.
