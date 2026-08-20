# API Benchmark Report (smoke)

Generated: 2026-05-27T04:46:15.756Z
Target: `http://127.0.0.1:58122`
Requests per endpoint: 2
Concurrency: 1

| Endpoint | Method | Requests | Statuses | p50 | p95 | p99 | TTFB p95 | RPS | Error Rate |
| --- | --- | ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| /health | GET | 2 | 200:2 | 2.75 | 29.53 | 29.53 | 28.65 | 59.27 | 0 |
| /api/auth/register | POST | 2 | 201:2 | 3.53 | 9.19 | 9.19 | 9.05 | 153.77 | 0 |
| /api/auth/login | POST | 2 | 200:2 | 2.55 | 4.36 | 4.36 | 4.12 | 272.97 | 0 |
| /api/auth/oauth/github/callback | GET | 2 | 200:2 | 1.13 | 1.42 | 1.42 | 1.35 | 713.69 | 0 |
| /api/auth/refresh | POST | 2 | 200:2 | 2.23 | 7.37 | 7.37 | 5.6 | 185.45 | 0 |
| /api/users | GET | 2 | 200:2 | 0.69 | 1.23 | 1.23 | 1.17 | 922.9 | 0 |
| /api/users | POST | 2 | 201:2 | 0.74 | 0.81 | 0.81 | 0.71 | 1194.56 | 0 |
| /api/jobs | GET | 2 | 200:2 | 0.41 | 0.52 | 0.52 | 0.49 | 1961.83 | 0 |
| /api/jobs | POST | 2 | 201:2 | 0.71 | 1.51 | 1.51 | 1.44 | 810.47 | 0 |
| /api/proposals | GET | 2 | 200:2 | 0.4 | 0.56 | 0.56 | 0.53 | 1786.38 | 0 |
| /api/proposals | POST | 2 | 201:2 | 0.86 | 1.48 | 1.48 | 1.45 | 830.26 | 0 |
| /api/payments | POST | 2 | 201:2 | 0.44 | 0.49 | 0.49 | 0.46 | 2000 | 0 |
| /api/reviews | GET | 2 | 200:2 | 0.33 | 0.53 | 0.53 | 0.49 | 2000 | 0 |
| /api/reviews | POST | 2 | 201:2 | 0.46 | 0.82 | 0.82 | 0.78 | 1455.56 | 0 |
| /api/messages | GET | 2 | 200:2 | 0.48 | 0.58 | 0.58 | 0.55 | 1773.31 | 0 |
| /api/messages | POST | 2 | 201:2 | 0.64 | 0.65 | 0.65 | 0.61 | 1455.96 | 0 |
| /api/notifications | GET | 2 | 200:2 | 0.55 | 1.23 | 1.23 | 1.15 | 1077.08 | 0 |
| /api/notifications | POST | 2 | 201:2 | 0.45 | 0.63 | 0.63 | 0.61 | 1735.86 | 0 |
| /api/uploads | POST | 2 | 201:2 | 2.13 | 3.92 | 3.92 | 3.88 | 321.41 | 0 |
| /api/search?q=dashboard | GET | 2 | 200:2 | 0.71 | 1.06 | 1.06 | 1.03 | 1060.4 | 0 |
| /api/admin/metrics | GET | 2 | 200:2 | 1.1 | 1.17 | 1.17 | 1.14 | 844.97 | 0 |

No threshold failures.

