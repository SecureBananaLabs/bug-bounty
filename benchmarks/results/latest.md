# API benchmark report

Mode: full
Target: http://127.0.0.1:50927
Started: 2026-05-20T03:45:53.105Z
Finished: 2026-05-20T03:45:53.306Z
Requests per endpoint: 8

## Environment

- CPU: Apple M4 (10 logical cores)
- Memory: 24 GiB total, 0.11 GiB free at start
- OS: darwin 25.2.0
- Node.js: v25.4.0

## Summary

- Endpoints benchmarked: 21
- Total requests: 168
- Overall error rate: 0%

## Endpoint metrics

| Endpoint | Requests | p50 ms | p95 ms | p99 ms | p95 TTFB ms | Sustained RPS | Peak RPS | Error % | Non-2xx % |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| GET /health | 8 | 1.07 | 65.59 | 65.59 | 64.03 | 106.07 | 8 | 0 | 0 |
| POST /api/auth/register | 8 | 1.22 | 15.35 | 15.35 | 15.2 | 320.29 | 8 | 0 | 0 |
| POST /api/auth/login | 8 | 0.92 | 1.32 | 1.32 | 1.26 | 997.79 | 8 | 0 | 0 |
| GET /api/auth/oauth/:provider/callback | 8 | 0.51 | 0.86 | 0.86 | 0.76 | 1686.28 | 8 | 0 | 0 |
| POST /api/auth/refresh | 8 | 0.66 | 0.97 | 0.97 | 0.88 | 1274.86 | 8 | 0 | 0 |
| GET /api/users | 8 | 0.44 | 1.11 | 1.11 | 1.06 | 1624.53 | 8 | 0 | 0 |
| POST /api/users | 8 | 0.58 | 1.38 | 1.38 | 1.33 | 1378.69 | 8 | 0 | 0 |
| GET /api/jobs | 8 | 0.44 | 0.76 | 0.76 | 0.68 | 1933.5 | 8 | 0 | 0 |
| POST /api/jobs | 8 | 0.62 | 1.18 | 1.18 | 1.13 | 1407.99 | 8 | 0 | 0 |
| GET /api/proposals | 8 | 0.39 | 0.53 | 0.53 | 0.48 | 2398.98 | 8 | 0 | 0 |
| POST /api/proposals | 8 | 0.53 | 1.71 | 1.71 | 1.66 | 1435.05 | 8 | 0 | 0 |
| POST /api/payments | 8 | 0.51 | 0.63 | 0.63 | 0.59 | 1857.14 | 8 | 0 | 0 |
| GET /api/reviews | 8 | 0.35 | 0.44 | 0.44 | 0.4 | 2659.13 | 8 | 0 | 0 |
| POST /api/reviews | 8 | 0.44 | 0.52 | 0.52 | 0.48 | 2130.33 | 8 | 0 | 0 |
| GET /api/messages | 8 | 0.32 | 0.4 | 0.4 | 0.36 | 2896.5 | 8 | 0 | 0 |
| POST /api/messages | 8 | 0.46 | 0.59 | 0.59 | 0.55 | 1979.85 | 8 | 0 | 0 |
| GET /api/notifications | 8 | 0.36 | 1.29 | 1.29 | 1.23 | 2093.51 | 8 | 0 | 0 |
| POST /api/notifications | 8 | 0.53 | 0.77 | 0.77 | 0.71 | 1725.9 | 8 | 0 | 0 |
| POST /api/uploads | 8 | 0.88 | 6.96 | 6.96 | 6.89 | 546.29 | 8 | 0 | 0 |
| GET /api/search | 8 | 0.41 | 1.32 | 1.32 | 1.27 | 1861.55 | 8 | 0 | 0 |
| GET /api/admin/metrics | 8 | 0.48 | 1.49 | 1.49 | 1.45 | 1589.5 | 8 | 0 | 0 |

## Slowest endpoints by p99

- GET /health: p99 65.59ms, p95 TTFB 64.03ms
- POST /api/auth/register: p99 15.35ms, p95 TTFB 15.2ms
- POST /api/uploads: p99 6.96ms, p95 TTFB 6.89ms
- POST /api/proposals: p99 1.71ms, p95 TTFB 1.66ms
- GET /api/admin/metrics: p99 1.49ms, p95 TTFB 1.45ms
