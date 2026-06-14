# API Benchmarks

This suite benchmarks every route mounted under `/api/` and writes reproducible JSON and Markdown reports to `benchmarks/results/`.

## Commands

```bash
npm run benchmark
npm run benchmark:smoke
```

By default, the runner starts the local Express API on loopback and generates a dedicated benchmark bearer token for the protected admin metrics route. Set `BENCHMARK_TARGET_URL` to benchmark an already-running local or staging API instead.

## Configuration

Copy `.env.benchmark.example` to `.env.benchmark` and adjust values as needed.

| Variable | Default | Description |
| --- | --- | --- |
| `BENCHMARK_TARGET_URL` | `local` | Use `local` to start the API in-process, or set a URL such as `http://127.0.0.1:4000`. |
| `BENCHMARK_TOKEN` | generated locally | Bearer token for auth-protected routes when benchmarking an external target. |
| `BENCHMARK_CONCURRENCY` | `4` full, `1` smoke | Concurrent workers per endpoint. |
| `BENCHMARK_DURATION_MS` | `1500` full, `250` smoke | Load duration per endpoint. |
| `BENCHMARK_WARMUP_REQUESTS` | `2` full, `1` smoke | Warmup requests before recording samples. |
| `BENCHMARK_OUTPUT_DIR` | `benchmarks/results` | Output location for `latest.json` and `latest.md`. |
| `BENCHMARK_THRESHOLDS` | `benchmarks/thresholds.json` | Threshold file used by the regression gate. |
| `BENCHMARK_DISABLE_RATE_LIMIT` | `1` | Disables the in-memory API limiter for local benchmark runs. |

## Metrics

Each endpoint report includes p50/p95/p99 total latency, p50/p95/p99 TTFB, sustained RPS, peak one-second RPS, error rate, sample count, and status-code counts. TTFB is measured as Node fetch response-header timing; total latency includes reading the response body.
