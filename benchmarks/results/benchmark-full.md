# API Benchmark Report (full)

Generated: 2026-05-25T10:21:20.778Z
Target: local ephemeral Express server
Routes covered: 20 /api routes plus /health
Requests per endpoint: 5
Concurrency: 2

## Environment

- OS: win32 10.0.26200 x64
- CPU: AMD Ryzen 7 9800X3D 8-Core Processor (16 logical cores)
- Memory: 61.59 GB total, 32.53 GB free at start
- Node: v22.18.0

## Results

| Endpoint | Requests | p50 ms | p95 ms | p99 ms | p95 TTFB ms | Sustained RPS | Peak RPS | Error % |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| GET /health | 5 | 3.56 | 5.3 | 5.3 | 5.12 | 495.31 | 20 | 0 |
| POST /api/auth/register | 5 | 4.99 | 5.26 | 5.26 | 5.02 | 429.55 | 20 | 0 |
| POST /api/auth/login | 5 | 3.1 | 3.61 | 3.61 | 3.53 | 634.68 | 20 | 0 |
| GET /api/auth/oauth/github/callback | 5 | 1.55 | 2.12 | 2.12 | 2.05 | 1150.8 | 20 | 0 |
| POST /api/auth/refresh | 5 | 1.84 | 2.02 | 2.02 | 1.96 | 1014.45 | 20 | 0 |
| GET /api/users | 5 | 1.04 | 1.31 | 1.31 | 1.26 | 1690.79 | 20 | 0 |
| POST /api/users | 5 | 1.6 | 1.61 | 1.61 | 1.56 | 1277.11 | 20 | 0 |
| GET /api/jobs | 5 | 1.1 | 1.22 | 1.22 | 1.16 | 1673.81 | 20 | 0 |
| POST /api/jobs | 5 | 1.58 | 2.1 | 2.1 | 2.04 | 1157.73 | 20 | 0 |
| GET /api/proposals | 5 | 1.21 | 1.35 | 1.35 | 1.29 | 1477.93 | 20 | 0 |
| POST /api/proposals | 5 | 1.39 | 1.64 | 1.64 | 1.59 | 1155.19 | 20 | 0 |
| POST /api/payments | 5 | 1.53 | 1.63 | 1.63 | 1.57 | 1260.05 | 20 | 0 |
| GET /api/reviews | 5 | 1.11 | 1.22 | 1.22 | 1.15 | 1714.62 | 20 | 0 |
| POST /api/reviews | 5 | 1.38 | 1.61 | 1.61 | 1.55 | 1378.28 | 20 | 0 |
| GET /api/messages | 5 | 1.04 | 1.15 | 1.15 | 1.1 | 1821.23 | 20 | 0 |
| POST /api/messages | 5 | 1.36 | 1.65 | 1.65 | 1.59 | 1364.96 | 20 | 0 |
| GET /api/notifications | 5 | 1.03 | 1.14 | 1.14 | 1.07 | 1741.61 | 20 | 0 |
| POST /api/notifications | 5 | 1.36 | 1.61 | 1.61 | 1.56 | 1380.8 | 20 | 0 |
| POST /api/uploads | 5 | 2.21 | 6.08 | 6.08 | 6.03 | 499.95 | 20 | 0 |
| GET /api/search | 5 | 1.2 | 1.83 | 1.83 | 1.78 | 1346.98 | 20 | 0 |
| GET /api/admin/metrics | 5 | 1.85 | 2.58 | 2.58 | 2.53 | 941.6 | 20 | 0 |

## Thresholds

All configured benchmark thresholds passed.
