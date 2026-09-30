# API Benchmark Report (smoke)

- Started: 2026-05-30T16:54:16.451Z
- Finished: 2026-05-30T16:54:16.506Z
- Target: http://127.0.0.1:58290
- Tool: node-fetch-loopback-benchmark
- Endpoints covered: 21
- Requests: 42
- Error rate: 0%
- Sustained RPS: 35555.03
- Peak RPS: 42
- Worst p99 latency: 25.38 ms
- Worst p99 TTFB: 24.73 ms

| Endpoint | Method | Path | Requests | Error rate | p50 latency | p95 latency | p99 latency | p99 TTFB | Sustained RPS | Peak RPS |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| health | GET | /health | 2 | 0% | 1.67 ms | 25.38 ms | 25.38 ms | 24.73 ms | 73.7 | 2 |
| auth.register | POST | /api/auth/register | 2 | 0% | 1 ms | 8.77 ms | 8.77 ms | 8.69 ms | 204 | 2 |
| auth.login | POST | /api/auth/login | 2 | 0% | 0.78 ms | 0.88 ms | 0.88 ms | 0.81 ms | 1187.59 | 2 |
| auth.oauth_callback | GET | /api/auth/oauth/github/callback?code=benchmark-code | 2 | 0% | 0.46 ms | 0.92 ms | 0.92 ms | 0.85 ms | 1447.74 | 2 |
| auth.refresh | POST | /api/auth/refresh | 2 | 0% | 0.51 ms | 0.54 ms | 0.54 ms | 0.5 ms | 1892.45 | 2 |
| users.list | GET | /api/users | 2 | 0% | 0.32 ms | 0.35 ms | 0.35 ms | 0.32 ms | 2000 | 2 |
| users.create | POST | /api/users | 2 | 0% | 0.37 ms | 0.48 ms | 0.48 ms | 0.45 ms | 2000 | 2 |
| jobs.list | GET | /api/jobs | 2 | 0% | 0.28 ms | 0.3 ms | 0.3 ms | 0.27 ms | 2000 | 2 |
| jobs.create | POST | /api/jobs | 2 | 0% | 0.33 ms | 0.55 ms | 0.55 ms | 0.52 ms | 2000 | 2 |
| proposals.list | GET | /api/proposals | 2 | 0% | 0.24 ms | 0.28 ms | 0.28 ms | 0.26 ms | 2000 | 2 |
| proposals.create | POST | /api/proposals | 2 | 0% | 0.36 ms | 0.36 ms | 0.36 ms | 0.34 ms | 2000 | 2 |
| payments.create | POST | /api/payments | 2 | 0% | 0.37 ms | 0.43 ms | 0.43 ms | 0.4 ms | 2000 | 2 |
| reviews.list | GET | /api/reviews | 2 | 0% | 0.29 ms | 0.31 ms | 0.31 ms | 0.27 ms | 2000 | 2 |
| reviews.create | POST | /api/reviews | 2 | 0% | 0.32 ms | 0.35 ms | 0.35 ms | 0.33 ms | 2000 | 2 |
| messages.list | GET | /api/messages | 2 | 0% | 0.23 ms | 0.38 ms | 0.38 ms | 0.35 ms | 2000 | 2 |
| messages.create | POST | /api/messages | 2 | 0% | 0.32 ms | 0.33 ms | 0.33 ms | 0.31 ms | 2000 | 2 |
| notifications.list | GET | /api/notifications | 2 | 0% | 0.22 ms | 0.23 ms | 0.23 ms | 0.22 ms | 2000 | 2 |
| notifications.create | POST | /api/notifications | 2 | 0% | 0.26 ms | 0.28 ms | 0.28 ms | 0.25 ms | 2000 | 2 |
| uploads.create | POST | /api/uploads | 2 | 0% | 0.47 ms | 2.18 ms | 2.18 ms | 2.15 ms | 749.55 | 2 |
| search.global | GET | /api/search?q=marketplace%20workflow%20review | 2 | 0% | 0.25 ms | 0.27 ms | 0.27 ms | 0.24 ms | 2000 | 2 |
| admin.metrics | GET | /api/admin/metrics | 2 | 0% | 0.34 ms | 0.63 ms | 0.63 ms | 0.61 ms | 2000 | 2 |

## Environment

- Node.js: v26.0.0
- Platform: darwin 25.5.0 arm64
- CPU: Apple M4 (10 logical cores)
- Memory: 76 MiB free / 16384 MiB total
