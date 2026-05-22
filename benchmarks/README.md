# API Benchmarks

The benchmark suite covers every `/api/` endpoint in the repository and writes
JSON plus markdown summaries to [`benchmarks/results`](./results).

## Setup

1. Copy [`benchmarks/.env.benchmark.example`](./.env.benchmark.example) to `benchmarks/.env.benchmark`.
2. Adjust `BENCHMARK_TARGET` and `BENCHMARK_BASE_URL` if you want to hit a staging host instead of the local API.
3. Run `npm run benchmark` for the full suite or `npm run benchmark:smoke` for the low-concurrency CI profile.

When `BENCHMARK_TARGET=local`, the runner starts the Express app in benchmark mode,
uses a dedicated JWT benchmark token for `/api/admin/metrics`, and bypasses API
rate limiting so latency numbers are not polluted by 429 responses.

If you benchmark a remote or staging deployment, set `BENCHMARK_ADMIN_TOKEN` in
`benchmarks/.env.benchmark` so the protected admin endpoint is exercised with a
real dedicated benchmark token.

For bounty submissions, paste the generated `benchmarks/results/latest-full.md`
summary into the PR description.
