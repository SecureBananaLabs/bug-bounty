# API Benchmark Report

- **Generated:** 2026-10-17T11:03:50.850Z
- **Mode:** smoke (CI gate)
- **Target:** http://127.0.0.1:4010 (child process)
- **Profile:** 10 connections, 5s per endpoint
- **Endpoints:** 21
- **Runtime:** Node v22.23.1 on darwin/arm64

| Endpoint | Method | Path | p50 (ms) | p95 (ms) | p99 (ms) | TTFB p50 (ms) | RPS (sustained) | RPS (peak) | Error rate |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|
| `health` | GET | `/health` | 0.364 | 0.862 | 1.026 | 0.181 | 25322.67 | 26290 | 0% |
| `auth.register` | POST | `/api/auth/register` | 0.509 | 1.33 | 1.582 | 0.148 | 15367.2 | 15666 | 0% |
| `auth.login` | POST | `/api/auth/login` | 0.477 | 1.026 | 1.507 | 0.196 | 15824.8 | 15960 | 0% |
| `auth.refresh` | POST | `/api/auth/refresh` | 0.453 | 1.071 | 1.629 | 0.125 | 15868 | 16179 | 0% |
| `auth.oauthCallBack` | GET | `/api/auth/oauth/github/callback` | 0.322 | 0.777 | 0.898 | 0.089 | 23534.4 | 23734 | 0% |
| `jobs.list` | GET | `/api/jobs` | 0.304 | 0.703 | 0.868 | 0.09 | 24798.4 | 24978 | 0% |
| `jobs.create` | POST | `/api/jobs` | 0.36 | 1.355 | 1.792 | 0.142 | 19787.2 | 20098 | 0% |
| `users.list` | GET | `/api/users` | 0.303 | 1.092 | 1.416 | 0.085 | 24126.4 | 24224 | 0% |
| `users.create` | POST | `/api/users` | 0.406 | 1.469 | 1.883 | 0.111 | 20049.6 | 20266 | 0% |
| `proposals.list` | GET | `/api/proposals` | 0.297 | 1.102 | 1.513 | 0.089 | 23192 | 23859 | 0% |
| `proposals.create` | POST | `/api/proposals` | 0.34 | 1.931 | 2.392 | 0.127 | 19713.6 | 19915 | 0% |
| `reviews.list` | GET | `/api/reviews` | 0.294 | 0.668 | 0.888 | 0.09 | 23284.8 | 23408 | 0% |
| `reviews.create` | POST | `/api/reviews` | 0.382 | 0.794 | 1.314 | 0.113 | 19448 | 20049 | 0% |
| `messages.list` | GET | `/api/messages` | 0.329 | 0.744 | 0.861 | 0.091 | 22897.6 | 23502 | 0% |
| `messages.create` | POST | `/api/messages` | 0.347 | 0.801 | 1.879 | 0.08 | 19102.41 | 19433 | 0% |
| `notifications.list` | GET | `/api/notifications` | 0.315 | 0.855 | 1.319 | 0.085 | 21483.2 | 22923 | 0% |
| `notifications.create` | POST | `/api/notifications` | 0.348 | 2.014 | 2.669 | 0.099 | 19048 | 19495 | 0% |
| `payments.create` | POST | `/api/payments` | 0.343 | 0.888 | 1.366 | 0.111 | 19185.6 | 19550 | 0% |
| `uploads.create` | POST | `/api/uploads` | 0.462 | 2.361 | 2.936 | 0.125 | 14517.6 | 14798 | 0% |
| `search.query` | GET | `/api/search` | 0.305 | 1.859 | 2.247 | 0.078 | 21835.2 | 22139 | 0% |
| `admin.metrics` | GET | `/api/admin/metrics` | 0.503 | 1.362 | 2.243 | 0.146 | 15413.6 | 15810 | 0% |

## Latency measured two ways

`p50/p95/p99` above are **hrtime sub-millisecond percentiles** over 200 samples at concurrency 10.
autocannon's own histogram is integer-millisecond resolution, so on a fast local API it
reports `0` for p50 and p95 and carries no information. Both are recorded in the JSON:

| Endpoint | autocannon p50 / p95 / p99 (ms) | hrtime p50 / p95 / p99 (ms) |
|---|---|---|
| `health` | 0 / 0 / 1 | 0.364 / 0.862 / 1.026 |
| `auth.register` | 0 / 1 / 1 | 0.509 / 1.33 / 1.582 |
| `auth.login` | 0 / 1 / 1 | 0.477 / 1.026 / 1.507 |
| `auth.refresh` | 0 / 1 / 1 | 0.453 / 1.071 / 1.629 |
| `auth.oauthCallBack` | 0 / 0 / 1 | 0.322 / 0.777 / 0.898 |
| `jobs.list` | 0 / 0 / 1 | 0.304 / 0.703 / 0.868 |
| `jobs.create` | 0 / 1 / 1 | 0.36 / 1.355 / 1.792 |
| `users.list` | 0 / 1 / 1 | 0.303 / 1.092 / 1.416 |
| `users.create` | 0 / 1 / 1 | 0.406 / 1.469 / 1.883 |
| `proposals.list` | 0 / 1 / 1 | 0.297 / 1.102 / 1.513 |
| `proposals.create` | 0 / 1 / 1 | 0.34 / 1.931 / 2.392 |
| `reviews.list` | 0 / 1 / 1 | 0.294 / 0.668 / 0.888 |
| `reviews.create` | 0 / 1 / 1 | 0.382 / 0.794 / 1.314 |
| `messages.list` | 0 / 1 / 1 | 0.329 / 0.744 / 0.861 |
| `messages.create` | 0 / 1 / 1 | 0.347 / 0.801 / 1.879 |
| `notifications.list` | 0 / 1 / 1 | 0.315 / 0.855 / 1.319 |
| `notifications.create` | 0 / 1 / 2 | 0.348 / 2.014 / 2.669 |
| `payments.create` | 0 / 1 / 2 | 0.343 / 0.888 / 1.366 |
| `uploads.create` | 0 / 2 / 2 | 0.462 / 2.361 / 2.936 |
| `search.query` | 0 / 1 / 1 | 0.305 / 1.859 / 2.247 |
| `admin.metrics` | 0 / 1 / 2 | 0.503 / 1.362 / 2.243 |

> Latency percentiles are autocannon's `latency.p50`/`latency.p97_5`/`latency.p99`
> reported into the p50/p95/p99 columns (autocannon exposes p97_5, not p95).
> TTFB is measured separately with raw `http.request` over 20 samples,
> timed to the first `response` event — autocannon's own per-response time is total latency.
> Error rate = (errors + timeouts + non-2xx) / total requests.

## Regression gate

All endpoints within thresholds.

