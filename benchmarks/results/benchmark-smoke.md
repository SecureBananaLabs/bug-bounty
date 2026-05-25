# API Benchmark Report (smoke)

Generated: 2026-05-25T10:21:16.004Z
Target: local ephemeral Express server
Routes covered: 20 /api routes plus /health
Requests per endpoint: 1
Concurrency: 1

## Environment

- OS: win32 10.0.26200 x64
- CPU: AMD Ryzen 7 9800X3D 8-Core Processor (16 logical cores)
- Memory: 61.59 GB total, 32.58 GB free at start
- Node: v22.18.0

## Results

| Endpoint | Requests | p50 ms | p95 ms | p99 ms | p95 TTFB ms | Sustained RPS | Peak RPS | Error % |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| GET /health | 1 | 2.98 | 2.98 | 2.98 | 2.81 | 326.56 | 4 | 0 |
| POST /api/auth/register | 1 | 3.51 | 3.51 | 3.51 | 3.38 | 282.41 | 4 | 0 |
| POST /api/auth/login | 1 | 1.97 | 1.97 | 1.97 | 1.88 | 504.72 | 4 | 0 |
| GET /api/auth/oauth/github/callback | 1 | 1.41 | 1.41 | 1.41 | 1.24 | 705.92 | 4 | 0 |
| POST /api/auth/refresh | 1 | 1.79 | 1.79 | 1.79 | 1.64 | 556.14 | 4 | 0 |
| GET /api/users | 1 | 1.18 | 1.18 | 1.18 | 1.02 | 842.53 | 4 | 0 |
| POST /api/users | 1 | 1.14 | 1.14 | 1.14 | 1.07 | 835.49 | 4 | 0 |
| GET /api/jobs | 1 | 2.21 | 2.21 | 2.21 | 2.02 | 450.09 | 4 | 0 |
| POST /api/jobs | 1 | 2.25 | 2.25 | 2.25 | 2.17 | 434.57 | 4 | 0 |
| GET /api/proposals | 1 | 1.13 | 1.13 | 1.13 | 1.01 | 870.32 | 4 | 0 |
| POST /api/proposals | 1 | 1.32 | 1.32 | 1.32 | 1.25 | 673.58 | 4 | 0 |
| POST /api/payments | 1 | 1.08 | 1.08 | 1.08 | 1.02 | 887.63 | 4 | 0 |
| GET /api/reviews | 1 | 1.04 | 1.04 | 1.04 | 0.93 | 957.49 | 4 | 0 |
| POST /api/reviews | 1 | 1.14 | 1.14 | 1.14 | 1.07 | 850.34 | 4 | 0 |
| GET /api/messages | 1 | 0.77 | 0.77 | 0.77 | 0.69 | 1296.51 | 4 | 0 |
| POST /api/messages | 1 | 1.57 | 1.57 | 1.57 | 1.51 | 622.94 | 4 | 0 |
| GET /api/notifications | 1 | 1.31 | 1.31 | 1.31 | 1.25 | 761.27 | 4 | 0 |
| POST /api/notifications | 1 | 1.63 | 1.63 | 1.63 | 1.56 | 599.02 | 4 | 0 |
| POST /api/uploads | 1 | 4.23 | 4.23 | 4.23 | 4.16 | 217.91 | 4 | 0 |
| GET /api/search | 1 | 1.4 | 1.4 | 1.4 | 1.33 | 709.62 | 4 | 0 |
| GET /api/admin/metrics | 1 | 1.75 | 1.75 | 1.75 | 1.67 | 567.99 | 4 | 0 |

## Thresholds

All configured benchmark thresholds passed.
