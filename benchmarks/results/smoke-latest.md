# API Benchmark Report (smoke)

Generated: 2026-06-04T23:21:52.122Z
Target: `http://127.0.0.1:50793`

## Summary

- Endpoints covered: 21
- Requests measured: 42
- Error rate: 0%
- Max p99 latency: 26.97 ms
- Max p99 TTFB: 26.12 ms
- Slowest endpoint: GET `/health` (26.97 ms p99)
- Threshold gate: passed

## Endpoint Metrics

| Endpoint | Requests | p50 ms | p95 ms | p99 ms | TTFB p99 ms | Sustained RPS | Peak RPS | Error % | Statuses |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| GET `/health` | 2 | 2.86 | 26.97 | 26.97 | 26.12 | 43.29 | 2 | 0 | 200:2 |
| POST `/api/auth/register` | 2 | 3.11 | 15.14 | 15.14 | 15.04 | 106.36 | 2 | 0 | 201:2 |
| POST `/api/auth/login` | 2 | 1.34 | 1.74 | 1.74 | 1.63 | 628.23 | 2 | 0 | 200:2 |
| GET `/api/auth/oauth/github/callback?code=benchmark-code&state=benchmark-state` | 2 | 0.62 | 1.3 | 1.3 | 1.23 | 1025.58 | 2 | 0 | 200:2 |
| POST `/api/auth/refresh` | 2 | 0.73 | 0.81 | 0.81 | 0.74 | 1273.51 | 2 | 0 | 200:2 |
| GET `/api/users` | 2 | 0.52 | 1.38 | 1.38 | 1.3 | 1034.82 | 2 | 0 | 200:2 |
| POST `/api/users` | 2 | 0.78 | 2.11 | 2.11 | 1.88 | 653.36 | 2 | 0 | 201:2 |
| GET `/api/jobs` | 2 | 0.51 | 0.82 | 0.82 | 0.75 | 1488.51 | 2 | 0 | 200:2 |
| POST `/api/jobs` | 2 | 1.44 | 1.7 | 1.7 | 1.54 | 618.7 | 2 | 0 | 201:2 |
| GET `/api/proposals` | 2 | 1.08 | 1.18 | 1.18 | 1.09 | 867.98 | 2 | 0 | 200:2 |
| POST `/api/proposals` | 2 | 1.06 | 1.77 | 1.77 | 1.69 | 685.63 | 2 | 0 | 201:2 |
| POST `/api/payments` | 2 | 0.59 | 0.59 | 0.59 | 0.53 | 1599.52 | 2 | 0 | 201:2 |
| GET `/api/reviews` | 2 | 0.52 | 0.59 | 0.59 | 0.52 | 1772.85 | 2 | 0 | 200:2 |
| POST `/api/reviews` | 2 | 0.54 | 0.63 | 0.63 | 0.56 | 1627.45 | 2 | 0 | 201:2 |
| GET `/api/messages` | 2 | 0.32 | 0.36 | 0.36 | 0.32 | 2000 | 2 | 0 | 200:2 |
| POST `/api/messages` | 2 | 0.5 | 0.7 | 0.7 | 0.52 | 1583.74 | 2 | 0 | 201:2 |
| GET `/api/notifications` | 2 | 0.45 | 0.51 | 0.51 | 0.47 | 2000 | 2 | 0 | 200:2 |
| POST `/api/notifications` | 2 | 1 | 2.03 | 2.03 | 1.98 | 624.39 | 2 | 0 | 201:2 |
| POST `/api/uploads` | 2 | 1.15 | 4.6 | 4.6 | 4.55 | 323.6 | 2 | 0 | 201:2 |
| GET `/api/search?q=react%20api%20benchmark` | 2 | 0.36 | 0.64 | 0.64 | 0.6 | 1976.2 | 2 | 0 | 200:2 |
| GET `/api/admin/metrics` | 2 | 0.72 | 1.67 | 1.67 | 1.61 | 809.12 | 2 | 0 | 200:2 |

## Threshold Failures

None.
