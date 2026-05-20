# API Benchmark Summary

- Run ID: `2026-05-20T14-31-36-463Z`
- Started: 2026-05-20T14:31:36.463Z
- Finished: 2026-05-20T14:31:36.766Z
- Mode: full (local-app)
- Target: `http://127.0.0.1:53919`
- Concurrency: 4
- Requests per endpoint: 8
- Result: PASS
- Route coverage: 21/21 discovered routes covered

## Environment

- CPU: Apple M4 (10 logical cores)
- RAM: 32 GiB total, 1.78 GiB free at start
- OS: darwin 25.3.0 arm64
- Node.js: v25.9.0

## Endpoint Results

| Endpoint | Method | Requests | p50 ms | p95 ms | p99 ms | p95 TTFB ms | Sustained RPS | Peak RPS | Error % | Unexpected % | Statuses |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| `/health` | GET | 8 | 7.56 | 59.81 | 59.81 | 58.44 | 117.4 | 8 | 0 | 0 | 200: 8 |
| `/api/auth/register` | POST | 8 | 5.22 | 15.02 | 15.02 | 14.79 | 357.4 | 8 | 0 | 0 | 201: 8 |
| `/api/auth/login` | POST | 8 | 2.51 | 3.42 | 3.42 | 3.36 | 1374.54 | 8 | 0 | 0 | 200: 8 |
| `/api/auth/oauth/github/callback` | GET | 8 | 1.77 | 2.42 | 2.42 | 2.38 | 1944.58 | 8 | 0 | 0 | 200: 8 |
| `/api/auth/refresh` | POST | 8 | 2 | 2.75 | 2.75 | 2.69 | 1681.81 | 8 | 0 | 0 | 200: 8 |
| `/api/users` | GET | 8 | 1.46 | 1.94 | 1.94 | 1.9 | 2264.18 | 8 | 0 | 0 | 200: 8 |
| `/api/users` | POST | 8 | 2.45 | 3.19 | 3.19 | 3.15 | 1416.88 | 8 | 0 | 0 | 201: 8 |
| `/api/jobs` | GET | 8 | 1.18 | 1.48 | 1.48 | 1.45 | 2841.83 | 8 | 0 | 0 | 200: 8 |
| `/api/jobs` | POST | 8 | 2.41 | 3.52 | 3.52 | 3.46 | 1361.04 | 8 | 0 | 0 | 201: 8 |
| `/api/proposals` | GET | 8 | 1.27 | 1.55 | 1.55 | 1.51 | 2704.22 | 8 | 0 | 0 | 200: 8 |
| `/api/proposals` | POST | 8 | 1.55 | 2.04 | 2.04 | 2.01 | 2257.5 | 8 | 0 | 0 | 201: 8 |
| `/api/payments` | POST | 8 | 1.8 | 3.4 | 3.4 | 3.36 | 1537.86 | 8 | 0 | 0 | 201: 8 |
| `/api/reviews` | GET | 8 | 1.34 | 2 | 2 | 1.98 | 2370.17 | 8 | 0 | 0 | 200: 8 |
| `/api/reviews` | POST | 8 | 1.74 | 2.37 | 2.37 | 2.34 | 2053.04 | 8 | 0 | 0 | 201: 8 |
| `/api/messages` | GET | 8 | 1 | 1.29 | 1.29 | 1.25 | 3355 | 8 | 0 | 0 | 200: 8 |
| `/api/messages` | POST | 8 | 1.38 | 1.79 | 1.79 | 1.75 | 2567.22 | 8 | 0 | 0 | 201: 8 |
| `/api/notifications` | GET | 8 | 0.98 | 1.18 | 1.18 | 1.16 | 3481.67 | 8 | 0 | 0 | 200: 8 |
| `/api/notifications` | POST | 8 | 1.46 | 3.06 | 3.06 | 3.02 | 1762.13 | 8 | 0 | 0 | 201: 8 |
| `/api/uploads` | POST | 8 | 3.02 | 7.87 | 7.87 | 7.84 | 679.55 | 8 | 0 | 0 | 201: 8 |
| `/api/search` | GET | 8 | 1.5 | 2.92 | 2.92 | 2.89 | 1652.11 | 8 | 0 | 0 | 200: 8 |
| `/api/admin/metrics` | GET | 8 | 1.52 | 2.85 | 2.85 | 2.82 | 1798.92 | 8 | 0 | 0 | 200: 8 |

