# API Benchmark Report (full)

- Started: 2026-05-30T16:54:16.703Z
- Finished: 2026-05-30T16:54:16.771Z
- Target: http://127.0.0.1:58293
- Tool: node-fetch-loopback-benchmark
- Endpoints covered: 21
- Requests: 105
- Error rate: 0%
- Sustained RPS: 68907.69
- Peak RPS: 105
- Worst p99 latency: 26.08 ms
- Worst p99 TTFB: 25.42 ms

| Endpoint | Method | Path | Requests | Error rate | p50 latency | p95 latency | p99 latency | p99 TTFB | Sustained RPS | Peak RPS |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| health | GET | /health | 5 | 0% | 2.53 ms | 26.08 ms | 26.08 ms | 25.42 ms | 171.88 | 5 |
| auth.register | POST | /api/auth/register | 5 | 0% | 1.99 ms | 5.72 ms | 5.72 ms | 5.67 ms | 598.29 | 5 |
| auth.login | POST | /api/auth/login | 5 | 0% | 0.87 ms | 1.12 ms | 1.12 ms | 1.09 ms | 2064.12 | 5 |
| auth.oauth_callback | GET | /api/auth/oauth/github/callback?code=benchmark-code | 5 | 0% | 0.46 ms | 0.96 ms | 0.96 ms | 0.94 ms | 2871.5 | 5 |
| auth.refresh | POST | /api/auth/refresh | 5 | 0% | 0.56 ms | 0.59 ms | 0.59 ms | 0.56 ms | 3470.01 | 5 |
| users.list | GET | /api/users | 5 | 0% | 0.42 ms | 0.52 ms | 0.52 ms | 0.49 ms | 4235.79 | 5 |
| users.create | POST | /api/users | 5 | 0% | 0.52 ms | 0.61 ms | 0.61 ms | 0.59 ms | 3539.2 | 5 |
| jobs.list | GET | /api/jobs | 5 | 0% | 0.4 ms | 0.41 ms | 0.41 ms | 0.39 ms | 4904.56 | 5 |
| jobs.create | POST | /api/jobs | 5 | 0% | 0.68 ms | 0.8 ms | 0.8 ms | 0.78 ms | 2480.67 | 5 |
| proposals.list | GET | /api/proposals | 5 | 0% | 0.49 ms | 0.54 ms | 0.54 ms | 0.52 ms | 3921.82 | 5 |
| proposals.create | POST | /api/proposals | 5 | 0% | 0.45 ms | 0.58 ms | 0.58 ms | 0.55 ms | 3928.5 | 5 |
| payments.create | POST | /api/payments | 5 | 0% | 0.51 ms | 0.58 ms | 0.58 ms | 0.55 ms | 3733.55 | 5 |
| reviews.list | GET | /api/reviews | 5 | 0% | 0.37 ms | 0.39 ms | 0.39 ms | 0.37 ms | 4765.88 | 5 |
| reviews.create | POST | /api/reviews | 5 | 0% | 0.59 ms | 0.74 ms | 0.74 ms | 0.71 ms | 3178.05 | 5 |
| messages.list | GET | /api/messages | 5 | 0% | 0.36 ms | 0.45 ms | 0.45 ms | 0.43 ms | 5000 | 5 |
| messages.create | POST | /api/messages | 5 | 0% | 0.46 ms | 0.56 ms | 0.56 ms | 0.54 ms | 3972.98 | 5 |
| notifications.list | GET | /api/notifications | 5 | 0% | 0.39 ms | 1.15 ms | 1.15 ms | 1.13 ms | 2854.49 | 5 |
| notifications.create | POST | /api/notifications | 5 | 0% | 0.43 ms | 0.51 ms | 0.51 ms | 0.5 ms | 4075.67 | 5 |
| uploads.create | POST | /api/uploads | 5 | 0% | 0.68 ms | 2.7 ms | 2.7 ms | 2.68 ms | 1321.38 | 5 |
| search.global | GET | /api/search?q=marketplace%20workflow%20review | 5 | 0% | 0.38 ms | 0.43 ms | 0.43 ms | 0.42 ms | 4774.98 | 5 |
| admin.metrics | GET | /api/admin/metrics | 5 | 0% | 0.46 ms | 0.95 ms | 0.95 ms | 0.93 ms | 3044.37 | 5 |

## Environment

- Node.js: v26.0.0
- Platform: darwin 25.5.0 arm64
- CPU: Apple M4 (10 logical cores)
- Memory: 66 MiB free / 16384 MiB total
