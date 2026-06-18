# API Benchmark Summary

- Mode: full
- Target: http://127.0.0.1:62219
- Started: 2026-06-10T10:37:25.383Z
- Requests per endpoint: 5
- Concurrency: 2
- Runtime: v24.11.1 on darwin/arm64
- CPU: Apple M4 (10 logical cores)

| Endpoint | Requests | Error % | Sustained RPS | Peak RPS | p50 ms | p95 ms | p99 ms | p95 TTFB ms | Statuses |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| GET /health | 5 | 0 | 243.49 | 5 | 2.47 | 17.6 | 17.6 | 17.13 | 200: 5 |
| POST /api/auth/register | 5 | 0 | 610.48 | 5 | 1.83 | 5.84 | 5.84 | 5.79 | 201: 5 |
| POST /api/auth/login | 5 | 0 | 2205.44 | 5 | 0.88 | 1.02 | 1.02 | 0.99 | 200: 5 |
| GET /api/auth/oauth/github/callback | 5 | 0 | 3943.48 | 5 | 0.46 | 0.53 | 0.53 | 0.51 | 200: 5 |
| POST /api/auth/refresh | 5 | 0 | 2242.53 | 5 | 0.67 | 1.31 | 1.31 | 1.27 | 200: 5 |
| GET /api/users | 5 | 0 | 4155.13 | 5 | 0.4 | 0.58 | 0.58 | 0.56 | 200: 5 |
| POST /api/users | 5 | 0 | 3380.47 | 5 | 0.55 | 0.65 | 0.65 | 0.63 | 201: 5 |
| GET /api/jobs | 5 | 0 | 5611.41 | 5 | 0.33 | 0.37 | 0.37 | 0.35 | 200: 5 |
| POST /api/jobs | 5 | 0 | 3535.65 | 5 | 0.48 | 0.69 | 0.69 | 0.67 | 201: 5 |
| GET /api/proposals | 5 | 0 | 4726.64 | 5 | 0.36 | 0.48 | 0.48 | 0.46 | 200: 5 |
| POST /api/proposals | 5 | 0 | 4319.81 | 5 | 0.43 | 0.49 | 0.49 | 0.47 | 201: 5 |
| POST /api/payments | 5 | 0 | 4000.13 | 5 | 0.46 | 0.52 | 0.52 | 0.5 | 201: 5 |
| GET /api/reviews | 5 | 0 | 5429.13 | 5 | 0.33 | 0.39 | 0.39 | 0.37 | 200: 5 |
| POST /api/reviews | 5 | 0 | 2693.54 | 5 | 0.66 | 1.15 | 1.15 | 1.12 | 201: 5 |
| GET /api/messages | 5 | 0 | 5362.17 | 5 | 0.31 | 0.39 | 0.39 | 0.38 | 200: 5 |
| POST /api/messages | 5 | 0 | 4665.45 | 5 | 0.4 | 0.48 | 0.48 | 0.47 | 201: 5 |
| GET /api/notifications | 5 | 0 | 6071.34 | 5 | 0.33 | 0.33 | 0.33 | 0.31 | 200: 5 |
| POST /api/notifications | 5 | 0 | 4609.36 | 5 | 0.4 | 0.49 | 0.49 | 0.47 | 201: 5 |
| POST /api/uploads | 5 | 0 | 1174.21 | 5 | 0.89 | 2.87 | 2.87 | 2.84 | 201: 5 |
| GET /api/search | 5 | 0 | 3556.72 | 5 | 0.42 | 0.73 | 0.73 | 0.71 | 200: 5 |
| GET /api/admin/metrics | 5 | 0 | 3099.81 | 5 | 0.5 | 0.88 | 0.88 | 0.86 | 200: 5 |

## Thresholds

No threshold violations.
