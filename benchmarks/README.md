# API Benchmark Suite

Baseline performance benchmarks for every endpoint under `/api/` (plus `/health`), built with [autocannon](https://github.com/mcollina/autocannon).

## Quick start

```bash
npm install          # from the repo root (installs workspace deps incl. autocannon)
npm run benchmark    # runs the full suite against a freshly started local server
```

Against a staging server instead:

```bash
BASE_URL=https://staging.example.com npm run benchmark
```

Copy `benchmarks/.env.benchmark` values into your environment (or edit the file — it is a committed template) to tune durations, concurrency and the target host.

## What it measures (per endpoint)

| Metric | Source |
|---|---|
| p50 / p97.5 / p99 latency (ms) | sustained autocannon run (autocannon reports p97.5 as its mid-tail percentile) |
| Requests/sec — peak | burst run (100 conns, 10s) |
| Requests/sec — sustained | sustained run (20 conns, 20s) |
| Error rate % | (errors + timeouts + non-2xx) / total |
| TTFB p50 / p95 / p99 (ms) | 50 sequential first-byte samples |

All 21 routes are covered, including the auth-protected `GET /api/admin/metrics`, which is benchmarked with a dedicated benchmark admin token obtained at run time via `/api/auth/register`.

## Output

- `benchmarks/results/benchmark-<timestamp>.json` — full machine-readable results
- `benchmarks/results/benchmark-<timestamp>.md` — human-readable summary table

## CI regression gate

```bash
npm run benchmark:smoke
```

Runs a low-concurrency pass and fails if any endpoint's p99 exceeds `benchmarks/thresholds.json`.

To wire it into CI, add `.github/workflows/benchmark-smoke.yml` (note: this file is intentionally not included in this PR — committing workflow files requires the `workflow` OAuth scope):

```yaml
name: Benchmark smoke

on:
  push:
    branches: [main]
    paths:
      - "apps/api/**"
      - "benchmarks/**"
  pull_request:
    paths:
      - "apps/api/**"
      - "benchmarks/**"

jobs:
  smoke:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run benchmark:smoke
```

## Notes

- When the runner starts the local server it sets `BENCHMARK_MODE=1`, which disables the express rate limiter so the suite measures API throughput rather than the limiter. Pointing at a remote `BASE_URL` keeps the production limiter active and results will reflect it.
- Services are currently in-memory stubs; treat these numbers as a baseline, not production capacity.
