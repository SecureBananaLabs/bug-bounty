# API benchmarks

The dependency-free Node HTTP load tool runs against all 20 method/path pairs
registered by the Express API. It uses schema-shaped synthetic fixtures,
including an approximately 25 KiB multipart upload, and a dedicated short-lived
JWT for the protected admin route. The route coverage check fails when the API's
explicit route declarations no longer match the fixture inventory.

## Run

1. Use Node 22 and install the existing API dependencies: `npm ci --workspace apps/api --ignore-scripts --no-audit --no-fund`.
2. Run `npm run benchmark` for the full suite or `npm run benchmark:smoke` for the CI-sized suite.
3. Read `benchmarks/results/full.md` and `full.json` (or `smoke.md` and `smoke.json`).

No extra benchmark package, database, paid service or real account is required.
`npm run test:benchmark` checks metric calculations, real HTTP timing, failures,
coverage, configuration and preservation of the production rate limit.

See the [recorded baseline](baseline/README.md) and [terminal demo](demo/README.md)
for one verified run, its environment, reports and recording method.

## Load and measurements

Full runs measure 200 requests per endpoint at concurrency four; smoke runs
measure ten at concurrency one. Two warmup requests precede each endpoint and
are excluded from measurements. Requests use HTTP keep-alive. Routes run in the
fixture order, with collection POST routes before GET routes so reads exercise
populated collections. Each run starts fresh in-memory state.

- Latency is wall time from request creation until the response body is drained.
- TTFB is wall time from request creation until Node receives response headers.
  It is measured independently from body completion, not copied from latency.
- p50/p95/p99 use the nearest-rank method. With ten smoke samples, p99 is the
  maximum; full runs provide a less coarse distribution.
- Sustained RPS is completed requests divided by total endpoint wall time.
- Peak RPS is the largest count in a rolling one-second completion window. For
  runs shorter than one second, the count is normalized by actual elapsed time.
- Any unexpected HTTP status (including 429), aborted response, connection
  failure or deadline counts as an error. Status counts are included in JSON.
  Requests without response headers have no TTFB sample. Failed requests still
  contribute to end-to-end latency and throughput.

`thresholds.json` stores one p99 ceiling and error-rate ceiling per endpoint.
The initial 1000 ms p99 limits are conservative CI ceilings, not production
service objectives or claims of historical performance. All error ceilings are
zero. Threshold updates should accompany a reviewable baseline report. The
runner exits nonzero on regression, missing thresholds or incomplete coverage;
CI uploads reports even when the regression gate fails.

## Existing local or staging target

Copy `.env.benchmark.example` to `.env.benchmark`, configure a **disposable**
target and dedicated test token, then run:

```sh
node --env-file=benchmarks/.env.benchmark benchmarks/run.mjs --smoke
```

Existing-server runs require `BENCHMARK_ALLOW_MUTATIONS=1` because all POST
routes are exercised. They use that server's real middleware, including rate
limits; 429s are reported as errors. The runner never silently falls back to a
mock or local server if an explicitly configured host is unavailable. It does
not print the token or retain response bodies. The operator is responsible for
benchmark authorization, test-account provisioning and disposal of test data.

Environment knobs: `BENCHMARK_REQUESTS` (1–10000),
`BENCHMARK_CONCURRENCY` (1–16), `BENCHMARK_TIMEOUT_MS` (1–30000).
No env file is loaded automatically by `npm run benchmark`.

## Scope of the baseline

The current API has in-memory collections, a placeholder database connection,
and placeholder payment/search services. Results measure the current actual
route/middleware/serialization code; they do not establish database, Stripe or
production performance. The locally started API injects a no-op rate limiter
to avoid measuring its 200-requests-per-15-minutes quota; `createApp()` and the
production server retain the original limiter. The local JWT signing key is
generated for the benchmark process and is never written to the results.

Reports include Node/OS/CPU information, request counts and load settings.
Record Docker CPU/memory limits and competing workloads alongside any PR
baseline: OS-reported CPU count and memory can describe the host rather than a
container quota. Compare runs on equivalent hardware and load settings.
