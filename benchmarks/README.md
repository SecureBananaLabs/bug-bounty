# API Benchmark Suite

This suite benchmarks every current `/api/` route with realistic synthetic payloads using `autocannon`. It produces comparable latency, throughput, error-rate, and TTFB numbers for local and CI runs.

## Setup

1. Copy `.env.benchmark.example` to `.env.benchmark`:
   ```bash
   cp .env.benchmark.example .env.benchmark
   ```
2. Start the API:
   ```bash
   JWT_SECRET=development-secret npm run dev -w apps/api
   ```
3. In another terminal, run:
   ```bash
   npm run benchmark
   ```

For a quick CI-sized smoke gate:
```bash
npm run benchmark:smoke
```

## Configuration

| Variable | Default | Description |
|---|---|---|
| `BENCHMARK_TARGET` | `http://127.0.0.1:4000` | Target API host |
| `BENCHMARK_JWT_SECRET` | `development-secret` | JWT secret signing benchmark tokens |
| `BENCHMARK_AUTH_TOKEN` | (auto-generated) | Pre-generated token for protected routes |
| `BENCHMARK_CONNECTIONS` | `2` (full) / `1` (smoke) | Concurrent connections |
| `BENCHMARK_REQUESTS_PER_ENDPOINT` | `8` (full) / `2` (smoke) | Total requests per endpoint |
| `BENCHMARK_TIMEOUT_SECONDS` | `10` | Per-request timeout |
| `BENCHMARK_OUTPUT_DIR` | `benchmarks/results` | Output directory |

## Output

The runner writes:
- `benchmarks/results/latest.json` — full structured report
- `benchmarks/results/latest.md` — human-readable markdown summary

Each endpoint records:
- **p50, p95, p99 latency** (ms)
- **Sustained and peak requests per second**
- **Error rate** (%)
- **Time to first byte** (ms, from a single warm-up probe)
- **Status code distribution**
- **Threshold status** (PASS/FAIL)

## Covered Routes

The route inventory lives in `benchmarks/endpoints.mjs` and covers all 20 endpoints:

| Method | Path | Auth | Payload |
|---|---|---|---|
| POST | `/api/auth/register` | — | JSON (email, password, role) |
| POST | `/api/auth/login` | — | JSON (email, password) |
| GET | `/api/auth/oauth/:provider/callback` | — | — |
| POST | `/api/auth/refresh` | — | — |
| GET | `/api/users` | — | — |
| POST | `/api/users` | — | JSON |
| GET | `/api/jobs` | — | — |
| POST | `/api/jobs` | — | JSON |
| GET | `/api/proposals` | — | — |
| POST | `/api/proposals` | — | JSON |
| POST | `/api/payments` | — | JSON |
| GET | `/api/reviews` | — | — |
| POST | `/api/reviews` | — | JSON |
| GET | `/api/messages` | — | — |
| POST | `/api/messages` | — | JSON |
| GET | `/api/notifications` | — | — |
| POST | `/api/notifications` | — | JSON |
| POST | `/api/uploads` | — | Multipart form |
| GET | `/api/search?q=...` | — | Query string |
| GET | `/api/admin/metrics` | ✅ Bearer JWT | — |

## Thresholds

`benchmarks/thresholds.json` stores reviewable defaults and endpoint-specific overrides:

| Metric | Default | Upload endpoint override |
|---|---|---|
| p99 latency | 1500 ms | 2500 ms |
| TTFB | 1000 ms | 1500 ms |
| Error rate | 1% | 1% |

The CI smoke job fails when any threshold is exceeded.
