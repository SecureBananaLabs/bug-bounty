# API Benchmark Summary

- Generated: 2026-05-17T10:23:32.649Z
- Target: http://127.0.0.1:56525
- Mode: full
- Requests per endpoint: 25
- Concurrency: 5
- Gate: passed

| Endpoint | Requests | p50 | p95 | p99 | Sustained RPS | Peak RPS | Error Rate | TTFB p50 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `GET /health` | 25 | 10.46 ms | 25.12 ms | 26.61 ms | 345.11 | 345.11 | 0% | 10.25 ms |
| `POST /api/auth/register` | 25 | 10.23 ms | 16.02 ms | 16.89 ms | 438 | 438 | 0% | 10.12 ms |
| `POST /api/auth/login` | 25 | 6.84 ms | 7.22 ms | 7.53 ms | 732 | 732 | 0% | 6.75 ms |
| `GET /api/auth/oauth/github/callback` | 25 | 4.96 ms | 6.91 ms | 7.17 ms | 921.75 | 921.75 | 0% | 4.87 ms |
| `POST /api/auth/refresh` | 25 | 11.23 ms | 12.66 ms | 13.04 ms | 458.01 | 458.01 | 0% | 11.16 ms |
| `GET /api/users` | 25 | 4.17 ms | 4.55 ms | 4.59 ms | 1170.07 | 1170.07 | 0% | 4.08 ms |
| `POST /api/users` | 25 | 6.54 ms | 7.82 ms | 7.88 ms | 772.95 | 772.95 | 0% | 6.45 ms |
| `GET /api/jobs` | 25 | 6.94 ms | 8.63 ms | 8.68 ms | 760.22 | 760.22 | 0% | 6.8 ms |
| `POST /api/jobs` | 25 | 5.93 ms | 9.58 ms | 9.78 ms | 788.92 | 788.92 | 0% | 5.82 ms |
| `GET /api/proposals` | 25 | 3.59 ms | 3.82 ms | 3.82 ms | 1359.51 | 1359.51 | 0% | 3.51 ms |
| `POST /api/proposals` | 25 | 5.04 ms | 7.83 ms | 8.23 ms | 883.62 | 883.62 | 0% | 4.99 ms |
| `POST /api/payments` | 25 | 5.17 ms | 6.67 ms | 7.26 ms | 916.81 | 916.81 | 0% | 5.11 ms |
| `GET /api/reviews` | 25 | 3.94 ms | 4.2 ms | 4.21 ms | 1233.01 | 1233.01 | 0% | 3.89 ms |
| `POST /api/reviews` | 25 | 5.44 ms | 6.2 ms | 6.41 ms | 901.88 | 901.88 | 0% | 5.39 ms |
| `GET /api/messages` | 25 | 3.65 ms | 4.01 ms | 4.06 ms | 1310.51 | 1310.51 | 0% | 3.61 ms |
| `POST /api/messages` | 25 | 5.68 ms | 6.81 ms | 6.96 ms | 850.84 | 850.84 | 0% | 5.62 ms |
| `GET /api/notifications` | 25 | 4.16 ms | 4.72 ms | 4.96 ms | 1161.38 | 1161.38 | 0% | 4.09 ms |
| `POST /api/notifications` | 25 | 4.65 ms | 8.22 ms | 8.23 ms | 943.94 | 943.94 | 0% | 4.6 ms |
| `POST /api/uploads` | 25 | 9 ms | 9.97 ms | 10.21 ms | 548.81 | 548.81 | 0% | 8.9 ms |
| `GET /api/search?q=typescript%20marketplace%20api` | 25 | 5.09 ms | 7.28 ms | 7.63 ms | 881.64 | 881.64 | 0% | 5 ms |
| `GET /api/admin/metrics` | 25 | 7.11 ms | 12.54 ms | 12.68 ms | 623.18 | 623.18 | 0% | 7.03 ms |

## Environment

- Node.js: v22.22.3
- Platform: Windows_NT 10.0.26200 x64
- CPU: AMD Ryzen 5 5600H with Radeon Graphics          (12 cores)
- Memory: 1013 MB free / 7522 MB total

## Gate

All endpoints were within configured thresholds.
