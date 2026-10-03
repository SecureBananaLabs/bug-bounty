# API Benchmark Report (full)

Generated: 2026-05-27T04:44:45.058Z
Target: `http://127.0.0.1:57776`
Requests per endpoint: 5
Concurrency: 1

| Endpoint | Method | Requests | Statuses | p50 | p95 | p99 | TTFB p95 | RPS | Error Rate |
| --- | --- | ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| /health | GET | 5 | 200:5 | 2.14 | 24.56 | 24.56 | 23.65 | 145.26 | 0 |
| /api/auth/register | POST | 5 | 201:5 | 2.63 | 7.05 | 7.05 | 6.73 | 220.96 | 0 |
| /api/auth/login | POST | 5 | 200:5 | 1.34 | 2.13 | 2.13 | 2.1 | 666.11 | 0 |
| /api/auth/oauth/github/callback | GET | 5 | 200:5 | 0.51 | 0.92 | 0.92 | 0.89 | 1537.54 | 0 |
| /api/auth/refresh | POST | 5 | 200:5 | 0.43 | 0.56 | 0.56 | 0.54 | 2221.61 | 0 |
| /api/users | GET | 5 | 200:5 | 0.41 | 0.9 | 0.9 | 0.88 | 1856.61 | 0 |
| /api/users | POST | 5 | 201:5 | 0.4 | 1.14 | 1.14 | 1.11 | 1443.07 | 0 |
| /api/jobs | GET | 5 | 200:5 | 0.36 | 0.44 | 0.44 | 0.42 | 2637.36 | 0 |
| /api/jobs | POST | 5 | 201:5 | 0.6 | 0.78 | 0.78 | 0.75 | 1552.13 | 0 |
| /api/proposals | GET | 5 | 200:5 | 0.29 | 0.43 | 0.43 | 0.41 | 2515.83 | 0 |
| /api/proposals | POST | 5 | 201:5 | 0.34 | 0.61 | 0.61 | 0.56 | 2334.31 | 0 |
| /api/payments | POST | 5 | 201:5 | 0.39 | 0.56 | 0.56 | 0.53 | 2313.83 | 0 |
| /api/reviews | GET | 5 | 200:5 | 0.4 | 0.56 | 0.56 | 0.53 | 2361.79 | 0 |
| /api/reviews | POST | 5 | 201:5 | 0.38 | 0.53 | 0.53 | 0.5 | 2262.61 | 0 |
| /api/messages | GET | 5 | 200:5 | 0.3 | 0.45 | 0.45 | 0.43 | 2709.35 | 0 |
| /api/messages | POST | 5 | 201:5 | 0.32 | 0.44 | 0.44 | 0.42 | 2638.52 | 0 |
| /api/notifications | GET | 5 | 200:5 | 0.32 | 0.69 | 0.69 | 0.66 | 2247.4 | 0 |
| /api/notifications | POST | 5 | 201:5 | 0.35 | 0.56 | 0.56 | 0.53 | 2431.17 | 0 |
| /api/uploads | POST | 5 | 201:5 | 1.7 | 4.08 | 4.08 | 4.05 | 487.53 | 0 |
| /api/search?q=dashboard | GET | 5 | 200:5 | 0.7 | 1.07 | 1.07 | 1.04 | 1400.22 | 0 |
| /api/admin/metrics | GET | 5 | 200:5 | 0.56 | 1.38 | 1.38 | 1.36 | 1271.91 | 0 |

No threshold failures.

