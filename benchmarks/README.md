# API benchmark suite

This suite benchmarks the platform API with native Node.js `fetch`, so it does not require a separate load-test dependency.

## Run locally

```bash
cp benchmarks/.env.benchmark.example .env.benchmark
npm run benchmark
```

By default the runner starts the local Express app in-process. Set `BENCHMARK_TARGET_URL` to benchmark a running local or staging server instead.

## Output

Each run writes:

- `benchmarks/results/latest.json`
- `benchmarks/results/latest.md`

The JSON file is intended for regression tracking. The Markdown file is intended for PR review.

## Regression gate

Thresholds live in `benchmarks/thresholds.json`. `npm run benchmark:smoke` runs a short low-concurrency benchmark suitable for CI smoke checks.
