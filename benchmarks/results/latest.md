# API Benchmark Summary

Generated: 2026-05-19T03:23:36.253Z
Mode: full
Target: http://127.0.0.1:55486
Requests per endpoint: 8
Concurrency: 4

## Environment

- CPU: Apple M2 Max
- Platform: Darwin 25.3.0 arm64
- Node: v23.7.0
- Memory: 32 GiB total

## Results

| Endpoint | Requests | p50 ms | p95 ms | p99 ms | TTFB p95 ms | Sustained RPS | Error % | Statuses |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| POST /api/auth/register | 8 | 8.33 | 30.81 | 30.81 | 30.36 | 203.15 | 0 | 201:8 |
| POST /api/auth/login | 8 | 3.3 | 5.13 | 5.13 | 4.95 | 899.14 | 0 | 200:8 |
| GET /api/auth/oauth/:provider/callback | 8 | 2.36 | 2.75 | 2.75 | 2.72 | 1459.7 | 0 | 200:8 |
| POST /api/auth/refresh | 8 | 1.62 | 2.03 | 2.03 | 2 | 2221.37 | 0 | 200:8 |
| GET /api/users | 8 | 1.19 | 1.46 | 1.46 | 1.44 | 2905.22 | 0 | 200:8 |
| POST /api/users | 8 | 1.52 | 1.69 | 1.69 | 1.67 | 2343.92 | 0 | 201:8 |
| GET /api/jobs | 8 | 1.13 | 1.27 | 1.27 | 1.25 | 3204.38 | 0 | 200:8 |
| POST /api/jobs | 8 | 2.22 | 2.66 | 2.66 | 2.62 | 1722.67 | 0 | 201:8 |
| GET /api/proposals | 8 | 0.86 | 1 | 1 | 0.97 | 4148.39 | 0 | 200:8 |
| POST /api/proposals | 8 | 1.04 | 1.35 | 1.35 | 1.33 | 3383.5 | 0 | 201:8 |
| POST /api/payments | 8 | 1.15 | 1.42 | 1.42 | 1.4 | 3107 | 0 | 201:8 |
| GET /api/reviews | 8 | 1.08 | 1.27 | 1.27 | 1.23 | 3388.34 | 0 | 200:8 |
| POST /api/reviews | 8 | 2.03 | 2.44 | 2.44 | 2.4 | 1845.16 | 0 | 201:8 |
| GET /api/messages | 8 | 0.98 | 1.12 | 1.12 | 1.1 | 3629.08 | 0 | 200:8 |
| POST /api/messages | 8 | 1.15 | 1.52 | 1.52 | 1.49 | 3108.66 | 0 | 201:8 |
| GET /api/notifications | 8 | 1.06 | 1.45 | 1.45 | 1.42 | 3307.66 | 0 | 200:8 |
| POST /api/notifications | 8 | 1.43 | 1.74 | 1.74 | 1.71 | 2598.14 | 0 | 201:8 |
| POST /api/uploads | 8 | 3.89 | 6.62 | 6.62 | 6.6 | 820 | 0 | 201:8 |
| GET /api/search | 8 | 1.19 | 1.7 | 1.7 | 1.68 | 2732.43 | 0 | 200:8 |
| GET /api/admin/metrics | 8 | 1.61 | 1.81 | 1.81 | 1.79 | 2321.64 | 0 | 200:8 |

## Regression Gate

Passed.
