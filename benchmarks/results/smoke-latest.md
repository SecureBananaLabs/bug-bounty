# API Benchmark Report (smoke)

Generated: 2026-05-20T18:32:29.391Z
Target: `http://127.0.0.1:50116`

## Summary

- Endpoints covered: 21
- Requests measured: 42
- Error rate: 0%
- Max p99 latency: 27.34 ms
- Max p99 TTFB: 25.81 ms
- Slowest endpoint: GET `/health` (27.34 ms p99)
- Threshold gate: passed

## Endpoint Metrics

| Endpoint | Requests | p50 ms | p95 ms | p99 ms | TTFB p99 ms | Sustained RPS | Peak RPS | Error % | Statuses |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| GET `/health` | 2 | 2.33 | 27.34 | 27.34 | 25.81 | 47.14 | 2 | 0 | 200:2 |
| POST `/api/auth/register` | 2 | 1.64 | 22.32 | 22.32 | 22.2 | 82.67 | 2 | 0 | 201:2 |
| POST `/api/auth/login` | 2 | 3.48 | 5 | 5 | 4.91 | 233.35 | 2 | 0 | 200:2 |
| GET `/api/auth/oauth/github/callback?code=benchmark-code&state=benchmark-state` | 2 | 0.59 | 1.89 | 1.89 | 1.82 | 795.39 | 2 | 0 | 200:2 |
| POST `/api/auth/refresh` | 2 | 0.74 | 0.77 | 0.77 | 0.71 | 1304.38 | 2 | 0 | 200:2 |
| GET `/api/users` | 2 | 0.48 | 3.97 | 3.97 | 3.91 | 432 | 2 | 0 | 200:2 |
| POST `/api/users` | 2 | 0.92 | 2.26 | 2.26 | 2.19 | 599.99 | 2 | 0 | 201:2 |
| GET `/api/jobs` | 2 | 0.44 | 0.63 | 0.63 | 0.57 | 1844.24 | 2 | 0 | 200:2 |
| POST `/api/jobs` | 2 | 0.72 | 2.64 | 2.64 | 2.58 | 583.11 | 2 | 0 | 201:2 |
| GET `/api/proposals` | 2 | 0.68 | 0.87 | 0.87 | 0.62 | 1273.99 | 2 | 0 | 200:2 |
| POST `/api/proposals` | 2 | 0.92 | 2.26 | 2.26 | 2.18 | 616.44 | 2 | 0 | 201:2 |
| POST `/api/payments` | 2 | 0.86 | 2.39 | 2.39 | 2.23 | 600.08 | 2 | 0 | 201:2 |
| GET `/api/reviews` | 2 | 0.39 | 0.66 | 0.66 | 0.61 | 1890.36 | 2 | 0 | 200:2 |
| POST `/api/reviews` | 2 | 0.5 | 1.48 | 1.48 | 1.44 | 986.78 | 2 | 0 | 201:2 |
| GET `/api/messages` | 2 | 0.39 | 0.88 | 0.88 | 0.72 | 1557.48 | 2 | 0 | 200:2 |
| POST `/api/messages` | 2 | 0.43 | 0.53 | 0.53 | 0.48 | 1988.73 | 2 | 0 | 201:2 |
| GET `/api/notifications` | 2 | 0.34 | 0.35 | 0.35 | 0.32 | 2000 | 2 | 0 | 200:2 |
| POST `/api/notifications` | 2 | 0.44 | 0.85 | 0.85 | 0.81 | 1482.4 | 2 | 0 | 201:2 |
| POST `/api/uploads` | 2 | 0.85 | 5.59 | 5.59 | 5.53 | 295.82 | 2 | 0 | 201:2 |
| GET `/api/search?q=react%20api%20benchmark` | 2 | 0.55 | 1.37 | 1.37 | 1.31 | 1035.26 | 2 | 0 | 200:2 |
| GET `/api/admin/metrics` | 2 | 0.49 | 0.97 | 0.97 | 0.92 | 1300.25 | 2 | 0 | 200:2 |

## Threshold Failures

None.
