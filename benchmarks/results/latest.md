# API Benchmark Report

- **Generated:** 2026-10-17T11:01:27.018Z
- **Mode:** smoke (CI gate)
- **Target:** http://127.0.0.1:4010 (child process)
- **Profile:** 10 connections, 5s per endpoint
- **Endpoints:** 21
- **Runtime:** Node v26.4.0 on darwin/arm64

| Endpoint | Method | Path | p50 (ms) | p95 (ms) | p99 (ms) | TTFB p50 (ms) | RPS (sustained) | RPS (peak) | Error rate |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|
| `health` | GET | `/health` | 0.266 | 0.764 | 0.833 | 0.138 | 69304 | 71293 | 0% |
| `auth.register` | POST | `/api/auth/register` | 0.353 | 0.692 | 0.76 | 0.161 | 26228.8 | 27154 | 0% |
| `auth.login` | POST | `/api/auth/login` | 0.319 | 0.701 | 0.883 | 0.122 | 27739.2 | 29008 | 0% |
| `auth.refresh` | POST | `/api/auth/refresh` | 0.24 | 0.55 | 0.745 | 0.128 | 29464 | 29841 | 0% |
| `auth.oauthCallBack` | GET | `/api/auth/oauth/github/callback` | 0.185 | 0.445 | 0.471 | 0.066 | 60739.2 | 61181 | 0% |
| `jobs.list` | GET | `/api/jobs` | 0.214 | 0.39 | 0.489 | 0.085 | 68345.61 | 69026 | 0% |
| `jobs.create` | POST | `/api/jobs` | 0.188 | 0.371 | 0.475 | 0.075 | 49456 | 50659 | 0% |
| `users.list` | GET | `/api/users` | 0.249 | 0.441 | 0.577 | 0.086 | 66793.61 | 68214 | 0% |
| `users.create` | POST | `/api/users` | 0.201 | 0.446 | 0.482 | 0.079 | 51638.4 | 52828 | 0% |
| `proposals.list` | GET | `/api/proposals` | 0.195 | 0.363 | 0.509 | 0.082 | 60924.8 | 63790 | 0% |
| `proposals.create` | POST | `/api/proposals` | 0.267 | 0.722 | 0.964 | 0.08 | 50044.8 | 50575 | 0% |
| `reviews.list` | GET | `/api/reviews` | 0.18 | 0.471 | 0.529 | 0.059 | 63753.6 | 66310 | 0% |
| `reviews.create` | POST | `/api/reviews` | 0.192 | 0.438 | 0.477 | 0.064 | 52176 | 52647 | 0% |
| `messages.list` | GET | `/api/messages` | 0.146 | 0.364 | 0.5 | 0.057 | 67654.4 | 68511 | 0% |
| `messages.create` | POST | `/api/messages` | 0.186 | 0.424 | 0.466 | 0.06 | 51241.6 | 51931 | 0% |
| `notifications.list` | GET | `/api/notifications` | 0.144 | 0.409 | 0.458 | 0.058 | 68281.61 | 68594 | 0% |
| `notifications.create` | POST | `/api/notifications` | 0.272 | 0.953 | 1.23 | 0.072 | 50486.4 | 52873 | 0% |
| `payments.create` | POST | `/api/payments` | 0.186 | 0.347 | 0.485 | 0.068 | 51024 | 52321 | 0% |
| `uploads.create` | POST | `/api/uploads` | 0.241 | 0.536 | 0.636 | 0.077 | 34577.6 | 36786 | 0% |
| `search.query` | GET | `/api/search` | 0.142 | 0.302 | 0.456 | 0.058 | 60758.4 | 61518 | 0% |
| `admin.metrics` | GET | `/api/admin/metrics` | 0.409 | 0.876 | 2.257 | 0.126 | 27598.4 | 28692 | 0% |

## Latency measured two ways

`p50/p95/p99` above are **hrtime sub-millisecond percentiles** over 200 samples at concurrency 10.
autocannon's own histogram is integer-millisecond resolution, so on a fast local API it
reports `0` for p50 and p95 and carries no information. Both are recorded in the JSON:

| Endpoint | autocannon p50 / p95 / p99 (ms) | hrtime p50 / p95 / p99 (ms) |
|---|---|---|
| `health` | 0 / 0 / 0 | 0.266 / 0.764 / 0.833 |
| `auth.register` | 0 / 0 / 0 | 0.353 / 0.692 / 0.76 |
| `auth.login` | 0 / 0 / 0 | 0.319 / 0.701 / 0.883 |
| `auth.refresh` | 0 / 0 / 0 | 0.24 / 0.55 / 0.745 |
| `auth.oauthCallBack` | 0 / 0 / 0 | 0.185 / 0.445 / 0.471 |
| `jobs.list` | 0 / 0 / 0 | 0.214 / 0.39 / 0.489 |
| `jobs.create` | 0 / 0 / 0 | 0.188 / 0.371 / 0.475 |
| `users.list` | 0 / 0 / 0 | 0.249 / 0.441 / 0.577 |
| `users.create` | 0 / 0 / 0 | 0.201 / 0.446 / 0.482 |
| `proposals.list` | 0 / 0 / 0 | 0.195 / 0.363 / 0.509 |
| `proposals.create` | 0 / 0 / 0 | 0.267 / 0.722 / 0.964 |
| `reviews.list` | 0 / 0 / 0 | 0.18 / 0.471 / 0.529 |
| `reviews.create` | 0 / 0 / 0 | 0.192 / 0.438 / 0.477 |
| `messages.list` | 0 / 0 / 0 | 0.146 / 0.364 / 0.5 |
| `messages.create` | 0 / 0 / 0 | 0.186 / 0.424 / 0.466 |
| `notifications.list` | 0 / 0 / 0 | 0.144 / 0.409 / 0.458 |
| `notifications.create` | 0 / 0 / 0 | 0.272 / 0.953 / 1.23 |
| `payments.create` | 0 / 0 / 0 | 0.186 / 0.347 / 0.485 |
| `uploads.create` | 0 / 0 / 1 | 0.241 / 0.536 / 0.636 |
| `search.query` | 0 / 0 / 0 | 0.142 / 0.302 / 0.456 |
| `admin.metrics` | 0 / 0 / 1 | 0.409 / 0.876 / 2.257 |

> Latency percentiles are autocannon's `latency.p50`/`latency.p97_5`/`latency.p99`
> reported into the p50/p95/p99 columns (autocannon exposes p97_5, not p95).
> TTFB is measured separately with raw `http.request` over 20 samples,
> timed to the first `response` event — autocannon's own per-response time is total latency.
> Error rate = (errors + timeouts + non-2xx) / total requests.

## Regression gate

All endpoints within thresholds.

