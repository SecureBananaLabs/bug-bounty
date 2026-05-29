# API Benchmark Report

- Mode: full
- Started: 2026-05-29T06:06:38.614Z
- Completed: 2026-05-29T06:06:39.116Z
- Base URL: http://127.0.0.1:58258
- Concurrency: 6
- Requests per endpoint: 30
- Endpoints covered: 21
- Total requests: 630
- Total errors: 0
- Overall error rate: 0%
- Slowest p99 route: GET /health

| Endpoint | Requests | p50 ms | p95 ms | p99 ms | TTFB p95 ms | Sustained RPS | Peak RPS | Error Rate | Statuses |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| GET /health | 30 | 7.27 | 26.12 | 26.8 | 25.92 | 510.68 | 30 | 0% | 200:30 |
| POST /api/auth/register | 30 | 9.07 | 20.87 | 21.08 | 20.82 | 564.76 | 30 | 0% | 201:30 |
| POST /api/auth/login | 30 | 6.34 | 9.12 | 9.13 | 9.07 | 884.59 | 30 | 0% | 200:30 |
| GET /api/auth/oauth/github/callback | 30 | 4.55 | 6 | 6.14 | 5.95 | 1309.9 | 30 | 0% | 200:30 |
| POST /api/auth/refresh | 30 | 5.78 | 8.42 | 8.65 | 8.38 | 924.02 | 30 | 0% | 200:30 |
| GET /api/users | 30 | 3.69 | 5.1 | 5.32 | 4.99 | 1501.04 | 30 | 0% | 200:30 |
| POST /api/users | 30 | 3.37 | 5.57 | 5.76 | 5.53 | 1453.43 | 30 | 0% | 201:30 |
| GET /api/jobs | 30 | 3.07 | 4.05 | 4.07 | 4 | 1836.13 | 30 | 0% | 200:30 |
| POST /api/jobs | 30 | 3.43 | 4.54 | 4.71 | 4.5 | 1637.86 | 30 | 0% | 201:30 |
| GET /api/proposals | 30 | 2.98 | 5.49 | 5.49 | 5.45 | 1775.36 | 30 | 0% | 200:30 |
| POST /api/proposals | 30 | 2.59 | 2.98 | 3.13 | 2.95 | 2220.1 | 30 | 0% | 201:30 |
| POST /api/payments | 30 | 3.12 | 3.91 | 4.4 | 3.87 | 1788.46 | 30 | 0% | 201:30 |
| GET /api/reviews | 30 | 2.7 | 3.59 | 3.82 | 3.55 | 2177.46 | 30 | 0% | 200:30 |
| POST /api/reviews | 30 | 2.96 | 4.09 | 4.25 | 4.06 | 1802.54 | 30 | 0% | 201:30 |
| GET /api/messages | 30 | 2.18 | 2.67 | 2.8 | 2.63 | 2618.33 | 30 | 0% | 200:30 |
| POST /api/messages | 30 | 2.98 | 3.24 | 3.27 | 3.2 | 2020.61 | 30 | 0% | 201:30 |
| GET /api/notifications | 30 | 3.45 | 4.22 | 4.43 | 4.17 | 1643.38 | 30 | 0% | 200:30 |
| POST /api/notifications | 30 | 4.67 | 7.99 | 8.03 | 7.96 | 1168.34 | 30 | 0% | 201:30 |
| POST /api/uploads | 30 | 6.24 | 12.25 | 12.42 | 12.2 | 829.33 | 30 | 0% | 201:30 |
| GET /api/search?q=designer | 30 | 2.42 | 4.76 | 4.9 | 4.73 | 2042.64 | 30 | 0% | 200:30 |
| GET /api/admin/metrics | 30 | 4.69 | 6.86 | 6.91 | 6.81 | 1201.03 | 30 | 0% | 200:30 |

## Thresholds

All configured thresholds passed.
