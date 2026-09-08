# API Benchmark Baseline Report

- Generated at: 2026-06-05T12:50:27.500Z
- Target URL: http://127.0.0.1:56621
- Iterations per endpoint: 6
- Concurrency per endpoint: 2
- Covered /api endpoints: 20
- Runtime: v24.14.0 on win32/x64
- CPU: AMD Ryzen 7 9850X3D 8-Core Processor            (16 logical cores)

## Results

| Endpoint | Requests | p50 ms | p95 ms | p99 ms | p95 TTFB ms | Sustained RPS | Peak RPS Estimate | Error Rate | Status Codes |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| GET /health | 6 | 4.09 | 25.79 | 25.79 | 25.04 | 126.42 | 489.05 | 0% | 200:6 |
| POST /api/auth/register | 6 | 2.72 | 11.48 | 11.48 | 11.36 | 338.71 | 735.29 | 0% | 201:6 |
| POST /api/auth/login | 6 | 2.36 | 2.86 | 2.86 | 2.79 | 836.28 | 847.78 | 0% | 200:6 |
| GET /api/auth/oauth/github/callback | 6 | 1.47 | 1.74 | 1.74 | 1.67 | 1279.4 | 1365.09 | 0% | 200:6 |
| POST /api/auth/refresh | 6 | 1.95 | 2.41 | 2.41 | 2.35 | 1034.04 | 1028.01 | 0% | 200:6 |
| GET /api/users | 6 | 1.7 | 2.13 | 2.13 | 2.05 | 1160.79 | 1176.19 | 0% | 200:6 |
| POST /api/users | 6 | 1.63 | 1.91 | 1.91 | 1.86 | 1167.95 | 1228.2 | 0% | 201:6 |
| GET /api/jobs | 6 | 1.46 | 2.01 | 2.01 | 1.95 | 1248.62 | 1372.31 | 0% | 200:6 |
| POST /api/jobs | 6 | 2.13 | 2.37 | 2.37 | 2.29 | 881.98 | 938.39 | 0% | 201:6 |
| GET /api/proposals | 6 | 1.24 | 1.74 | 1.74 | 1.67 | 1459.89 | 1612.9 | 0% | 200:6 |
| POST /api/proposals | 6 | 2.07 | 2.34 | 2.34 | 2.27 | 927.59 | 968.05 | 0% | 201:6 |
| POST /api/payments | 6 | 1.57 | 2.14 | 2.14 | 2.08 | 1151.61 | 1273.89 | 0% | 201:6 |
| GET /api/reviews | 6 | 1.14 | 1.56 | 1.56 | 1.51 | 1557.03 | 1756.7 | 0% | 200:6 |
| POST /api/reviews | 6 | 1.69 | 2 | 2 | 1.91 | 1084.23 | 1184.62 | 0% | 201:6 |
| GET /api/messages | 6 | 1.07 | 2.09 | 2.09 | 2.04 | 1315.53 | 1876.17 | 0% | 200:6 |
| POST /api/messages | 6 | 1.48 | 1.77 | 1.77 | 1.73 | 1358.05 | 1353.82 | 0% | 201:6 |
| GET /api/notifications | 6 | 0.82 | 0.94 | 0.94 | 0.9 | 2234.05 | 2000 | 0% | 200:6 |
| POST /api/notifications | 6 | 1.2 | 1.53 | 1.53 | 1.49 | 1460.28 | 1670.98 | 0% | 201:6 |
| POST /api/uploads | 6 | 2.77 | 6.6 | 6.6 | 6.54 | 471.3 | 723.12 | 0% | 201:6 |
| GET /api/search?q=benchmark | 6 | 1.26 | 1.77 | 1.77 | 1.71 | 1423.01 | 1593.24 | 0% | 200:6 |
| GET /api/admin/metrics | 6 | 1.55 | 2.09 | 2.09 | 2.04 | 1153.23 | 1290.32 | 0% | 200:6 |

## Thresholds

No threshold failures.

## Covered API Routes

- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/oauth/github/callback
- POST /api/auth/refresh
- GET /api/users
- POST /api/users
- GET /api/jobs
- POST /api/jobs
- GET /api/proposals
- POST /api/proposals
- POST /api/payments
- GET /api/reviews
- POST /api/reviews
- GET /api/messages
- POST /api/messages
- GET /api/notifications
- POST /api/notifications
- POST /api/uploads
- GET /api/search?q=benchmark
- GET /api/admin/metrics
