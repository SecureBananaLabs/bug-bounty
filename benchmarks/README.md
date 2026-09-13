# API benchmarks

This suite benchmarks all API routes mounted by `apps/api/src/app.js` and writes both machine-readable and human-readable results.

## Configure

Copy the template and adjust values for local or staging runs:

```bash
cp benchmarks/.env.benchmark.example benchmarks/.env.benchmark
```

Important variables:

- `BENCHMARK_TARGET` — API base URL, for example `http://127.0.0.1:3001`.
- `BENCHMARK_TOKEN` — dedicated benchmark token for auth-protected routes.
- `BENCHMARK_CONCURRENCY` — concurrent requests per endpoint.
- `BENCHMARK_ITERATIONS` — total requests per endpoint.

## Run

```bash
npm run benchmark
```

Outputs are written under `benchmarks/results/`:

- `latest.json` — raw per-endpoint metrics.
- `latest-summary.md` — markdown summary for PR descriptions.

Thresholds for CI smoke runs live in `benchmarks/thresholds.json`.
