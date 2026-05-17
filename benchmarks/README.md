# API Benchmarks

This suite benchmarks the current Express API routes with `autocannon` and writes both JSON and Markdown reports to `benchmarks/results/`.

## Commands

```bash
npm run benchmark
npm run benchmark:smoke
```

By default, the runner starts a local ephemeral API server for each endpoint. Starting a fresh local server per endpoint keeps the application-level rate limiter from turning a route inventory benchmark into a global limiter benchmark.
Local ephemeral runs also set `BENCHMARK_DISABLE_RATE_LIMIT=true` inside the runner process. External `BENCHMARK_BASE_URL` runs do not change the target server and should use that server's normal rate-limit policy.

To target an already running local or staging server, set `BENCHMARK_BASE_URL`:

```bash
BENCHMARK_BASE_URL=http://127.0.0.1:4000 npm run benchmark
```

## Environment

Copy `.env.benchmark.example` to `.env.benchmark` when you want persistent local settings.

| Variable | Purpose | Default |
| --- | --- | --- |
| `BENCHMARK_BASE_URL` | Existing API host. Leave empty to start local ephemeral servers. | empty |
| `BENCHMARK_AUTH_TOKEN` | Bearer token used for protected routes such as `/api/admin/metrics`. | generated local token |
| `BENCHMARK_CONNECTIONS` | Concurrent autocannon connections per endpoint. | `4`, or `1` in smoke mode |
| `BENCHMARK_REQUESTS` | Requests per endpoint in the full suite. | `60` |
| `BENCHMARK_SMOKE_REQUESTS` | Requests per endpoint in the smoke suite. | `8` |
| `BENCHMARK_TTFB_SAMPLES` | Direct fetch samples used for TTFB percentiles. | `5`, or `2` in smoke mode |
| `BENCHMARK_TIMEOUT_SECONDS` | Request timeout for autocannon. | `10` |
| `BENCHMARK_RESULTS_DIR` | Report output directory. | `benchmarks/results` |
| `BENCHMARK_THRESHOLDS_PATH` | Threshold JSON path. | `benchmarks/thresholds.json` |
| `BENCHMARK_DISABLE_RATE_LIMIT` | Internal local-run switch used by the runner to avoid measuring the shared in-memory limiter store. | unset |

## Metrics

Each endpoint report includes:

- p50, p95, and p99 latency from `autocannon`.
- Sustained and peak requests per second.
- Error rate, counting request errors and non-2xx responses.
- p50, p95, and p99 TTFB from direct `fetch` samples.

Thresholds live in `benchmarks/thresholds.json` so reviewers can tune the CI smoke gate without changing the runner.
