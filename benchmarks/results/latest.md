# API Benchmark Report

- Mode: full
- Started: 2026-05-29T13:50:18.389Z
- Completed: 2026-05-29T13:50:18.879Z
- Base URL: http://127.0.0.1:50486
- Concurrency: 6
- Requests per endpoint: 30
- Endpoints covered: 21
- Total requests: 630
- Total errors: 0
- Overall error rate: 0%
- Slowest p99 route: GET /health

| Endpoint | Requests | p50 ms | p95 ms | p99 ms | TTFB p95 ms | Sustained RPS | Peak RPS | Error Rate | Statuses |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| GET /health | 30 | 5.66 | 24.27 | 24.67 | 24.1 | 555.89 | 30 | 0% | 200:30 |
| POST /api/auth/register | 30 | 6.46 | 17.49 | 17.7 | 17.45 | 737.81 | 30 | 0% | 201:30 |
| POST /api/auth/login | 30 | 4.65 | 6.81 | 6.9 | 6.75 | 1124.62 | 30 | 0% | 200:30 |
| GET /api/auth/oauth/github/callback | 30 | 3.34 | 7.81 | 7.98 | 7.76 | 1434.83 | 30 | 0% | 200:30 |
| POST /api/auth/refresh | 30 | 5.85 | 8.3 | 8.45 | 8.24 | 1012.42 | 30 | 0% | 200:30 |
| GET /api/users | 30 | 3.02 | 6.01 | 6.1 | 5.97 | 1639.95 | 30 | 0% | 200:30 |
| POST /api/users | 30 | 3.34 | 6.57 | 6.75 | 6.53 | 1495.56 | 30 | 0% | 201:30 |
| GET /api/jobs | 30 | 2.84 | 7.59 | 7.66 | 7.55 | 1523.37 | 30 | 0% | 200:30 |
| POST /api/jobs | 30 | 4.28 | 5.31 | 5.34 | 5.18 | 1295.14 | 30 | 0% | 201:30 |
| GET /api/proposals | 30 | 2.83 | 6.53 | 6.58 | 6.48 | 1708.89 | 30 | 0% | 200:30 |
| POST /api/proposals | 30 | 2.75 | 5.47 | 5.55 | 5.43 | 1780.38 | 30 | 0% | 201:30 |
| POST /api/payments | 30 | 3.52 | 4.71 | 4.76 | 4.66 | 1548.84 | 30 | 0% | 201:30 |
| GET /api/reviews | 30 | 2.62 | 4.66 | 4.68 | 4.62 | 1875.2 | 30 | 0% | 200:30 |
| POST /api/reviews | 30 | 3.23 | 4.13 | 4.29 | 4.1 | 1764.78 | 30 | 0% | 201:30 |
| GET /api/messages | 30 | 2.42 | 4.07 | 4.09 | 4.02 | 2102.68 | 30 | 0% | 200:30 |
| POST /api/messages | 30 | 3.49 | 4.48 | 4.58 | 4.44 | 1648.53 | 30 | 0% | 201:30 |
| GET /api/notifications | 30 | 2.43 | 6.44 | 6.54 | 6.4 | 1727.8 | 30 | 0% | 200:30 |
| POST /api/notifications | 30 | 3.36 | 6.63 | 6.83 | 6.6 | 1520.7 | 30 | 0% | 201:30 |
| POST /api/uploads | 30 | 5.33 | 16.1 | 16.32 | 16.06 | 845.25 | 30 | 0% | 201:30 |
| GET /api/search?q=designer | 30 | 4.41 | 6.48 | 6.72 | 6.42 | 1376.77 | 30 | 0% | 200:30 |
| GET /api/admin/metrics | 30 | 3.73 | 5.76 | 5.92 | 5.72 | 1399.98 | 30 | 0% | 200:30 |

## Thresholds

All configured thresholds passed.
