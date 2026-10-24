# API Benchmarks (bug-bounty#30)

Baseline benchmark suite for all platform API endpoints: latency (p50/p95/p99, ms),
throughput (sustained req/s), error rate (%), and TTFB (ms, time to first data chunk).

## Run

```sh
npm run benchmark         # full suite, spawns a local API on :4100
npm run benchmark:smoke   # CI smoke: 1 request/endpoint + p99 gate
```

Results land in `benchmarks/results/` as `<timestamp>.json` (machine-readable)
plus `<timestamp>.summary.md` (human-readable, paste into PR descriptions).

## Configure

Copy the template and adjust for staging runs (never commit real secrets):

```sh
cp benchmarks/.env.benchmark .env.benchmark.local
```

| var | default | meaning |
|---|---|---|
| `BENCHMARK_BASE_URL` | `http://127.0.0.1:4100` | target host; set `BENCHMARK_SPAWN_SERVER=0` to hit an external host |
| `BENCHMARK_EMAIL` / `BENCHMARK_PASSWORD` | `bench@example.com` / `Benchmark-123` | dedicated benchmark test account used via `POST /api/auth/login`; the returned JWT is attached to auth-protected routes (`/api/admin/*`) |
| `BENCHMARK_REQUESTS_PER_ENDPOINT` | `20` | full-run volume (smoke overrides to 1) |
| `BENCHMARK_CONCURRENCY` | `4` | parallel in-flight requests (smoke overrides to 1) |

Note: the API ships an in-process rate limiter (200 req / 15 min window), so
sustained-RPS numbers above that ceiling reflect the limiter, not handler
capacity. Keep full runs small or raise the limiter for load-specific rigs.

## Thresholds

`benchmarks/thresholds.json` holds per-endpoint p99 ceilings (ms). The runner
exits non-zero on breach, which is what the CI smoke job gates on. Thresholds
are loopback smoke baselines + headroom — tighten them after the first
staging/production-baseline run.

## Coverage

`benchmarks/endpoints.mjs` is a mechanical inventory of `apps/api/src/app.js`
mounts + `apps/api/src/routes/*.js`. 21 entries: `/health`, 4 auth routes
(login doubles as the benchmark-token source), CRUD pairs for users/jobs/
proposals/reviews/messages/notifications, payments, multipart upload, search,
and the auth-protected `GET /api/admin/metrics`. Payloads mirror the zod
validators and service contracts (`benchmarks/payloads.mjs`).
