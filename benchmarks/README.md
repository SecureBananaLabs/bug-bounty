# API benchmarks

Reproducible load benchmarks for every route mounted under `/api/`. Results are
written to `benchmarks/results/` as JSON and a markdown summary suitable for a
PR description.

## Quick start

```bash
npm install
npm run benchmark          # full suite against a local API
npm run benchmark:smoke    # low-concurrency run used by CI
```

The runner starts `apps/api` on an ephemeral port by default, waits for
`/health`, runs every endpoint sequentially, then shuts the server down. To
benchmark staging or another host, copy the environment template and set the
target:

```bash
cp benchmarks/.env.benchmark.example benchmarks/.env.benchmark
# edit BENCHMARK_BASE_URL and BENCHMARK_TOKEN
npm run benchmark
```

`.env.benchmark` is git-ignored; the committed template documents every
setting.

## Metrics

For each endpoint the suite records:

| Metric | Source |
|---|---|
| p50 / p95 / p99 latency (ms) | Raw per-response timings captured from autocannon |
| Requests per second (sustained) | Mean over the run |
| Requests per second (peak) | Busiest one-second sample |
| Error rate (%) | Non-2xx + transport errors + timeouts / attempted requests |
| TTFB p50 / p95 / p99 (ms) | Separate warm keep-alive sequential probe |

TTFB is measured outside the load generator because autocannon reports
end-to-end response time only. It describes server responsiveness, not
behaviour under concurrent load.

## Auth

`GET /api/admin/metrics` is the only auth-protected route today. The runner
attaches a bearer token to it. For local runs the token is minted from
`BENCHMARK_JWT_SECRET` (default `development-secret`, matching the API
default). For remote targets set `BENCHMARK_TOKEN`; if it is missing the
runner fails fast instead of reporting a misleading 100% error rate.

## Rate limiting

`apps/api` limits each IP to 200 requests per 15 minutes by default. A load
test would otherwise measure `429` responses rather than handler performance.
The local runner therefore starts the API with:

```
RATE_LIMIT_MAX=1000000
RATE_LIMIT_WINDOW_MS=60000
```

Both values are configurable through environment variables; production
defaults are unchanged. Remote targets must also allow benchmark traffic, or
the reported error rate will reflect throttling.

## Regression gate

`benchmarks/thresholds.json` defines reviewable budgets:

- `default` applies to every endpoint.
- `endpoints["METHOD /route"]` overrides individual routes.

The suite exits non-zero when a p99 latency or error-rate budget is exceeded.
Use `--no-thresholds` to report violations without failing (useful when
investigating a regression). CI runs `npm run benchmark:smoke` on pull requests
and uploads the results as an artifact.

## Payloads

Payloads are static and modelled on `packages/db/prisma/schema.prisma`:
realistic job descriptions (~1.2 KB), proposal cover letters (~1.5 KB),
message bodies, review comments, a 128 KiB multipart PDF upload, and so on.
Static bytes keep runs comparable across builds.

## CLI

```
npm run benchmark -- [options]

  --smoke                 Low-concurrency CI run (5 connections, 3s per endpoint)
  --connections <n>       Concurrent connections per endpoint
  --duration <seconds>    Duration per endpoint
  --pipelining <n>        HTTP pipelining factor (default: 1)
  --ttfb-samples <n>      Sequential TTFB samples per endpoint
  --base-url <url>        Target API; omit to start a local server
  --filter <text>         Only run endpoints whose "METHOD /route" contains text
  --no-thresholds         Report threshold violations without failing the run
  --help, -h              Show help
```

Example: benchmark only job routes with a short run:

```bash
npm run benchmark -- --filter /api/jobs --duration 5 --connections 10
```

## Tests

```bash
npm run test:benchmarks
```
