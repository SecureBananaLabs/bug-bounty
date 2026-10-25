# API Benchmarks

This suite benchmarks every route mounted under `/api/` with realistic JSON,
multipart, query-string, and authenticated requests.

## Run Locally

```sh
npm run benchmark
```

When `BENCHMARK_TARGET_URL` is not set, the runner starts the API on an
ephemeral local port. To target an already running server, copy
`.env.benchmark.example` to `.env.benchmark` and set the target URL.

## Smoke Gate

```sh
npm run benchmark:smoke
```

The smoke command runs the same endpoint matrix with a short duration and
checks p99 latency plus error-rate limits from `benchmarks/thresholds.json`.
The GitHub Actions smoke workflow runs this command on API and benchmark PRs.

## Results

Every run writes a JSON report and a markdown summary to
`benchmarks/results/`. Generated reports are ignored by git; keep
`benchmarks/results/.gitkeep` so the directory is present in fresh checkouts.
