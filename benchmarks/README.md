# API Benchmarks

Run the full benchmark suite against a local or staging API:

```bash
cp benchmarks/.env.benchmark.example benchmarks/.env.benchmark
npm run benchmark
```

Run the low-cost smoke gate used by CI:

```bash
npm run benchmark:smoke
```

The suite covers every current `/api/*` route, including the admin route with a dedicated benchmark JWT. Configure `BENCHMARK_AUTH_TOKEN` if you want to supply a token explicitly, or let the runner generate one from `JWT_SECRET`.

Smoke mode uses a small fixed request count per endpoint so CI verifies coverage, report generation, and threshold behavior without exhausting the API's default rate limiter. Full mode uses duration-based load for local and staging baselines.

Results are written to `benchmarks/results/` as timestamped JSON and Markdown files plus `latest.json` and `latest.md`.

Thresholds live in `benchmarks/thresholds.json`. Each endpoint is compared against p99 latency and error-rate limits so regressions are reviewable in pull requests.
