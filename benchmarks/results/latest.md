# API Benchmark Report (full)

Generated: 2026-05-20T18:32:29.462Z
Target: `http://127.0.0.1:50115`

## Summary

- Endpoints covered: 21
- Requests measured: 168
- Error rate: 0%
- Max p99 latency: 5.5 ms
- Max p99 TTFB: 5.45 ms
- Slowest endpoint: POST `/api/auth/register` (5.5 ms p99)
- Threshold gate: passed

## Endpoint Metrics

| Endpoint | Requests | p50 ms | p95 ms | p99 ms | TTFB p99 ms | Sustained RPS | Peak RPS | Error % | Statuses |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| GET `/health` | 8 | 1.66 | 3.76 | 3.76 | 3.68 | 824.93 | 8 | 0 | 200:8 |
| POST `/api/auth/register` | 8 | 1.28 | 5.5 | 5.5 | 5.45 | 737.04 | 8 | 0 | 201:8 |
| POST `/api/auth/login` | 8 | 1.05 | 4.8 | 4.8 | 4.75 | 1015.95 | 8 | 0 | 200:8 |
| GET `/api/auth/oauth/github/callback?code=benchmark-code&state=benchmark-state` | 8 | 0.91 | 2.49 | 2.49 | 2.45 | 1418.87 | 8 | 0 | 200:8 |
| POST `/api/auth/refresh` | 8 | 1.23 | 2.54 | 2.54 | 2.37 | 1227.92 | 8 | 0 | 200:8 |
| GET `/api/users` | 8 | 0.63 | 2.38 | 2.38 | 2.34 | 1642.78 | 8 | 0 | 200:8 |
| POST `/api/users` | 8 | 0.95 | 1.15 | 1.15 | 1.11 | 1955.51 | 8 | 0 | 201:8 |
| GET `/api/jobs` | 8 | 0.54 | 0.67 | 0.67 | 0.63 | 3404.98 | 8 | 0 | 200:8 |
| POST `/api/jobs` | 8 | 1.17 | 2.95 | 2.95 | 2.88 | 1211.05 | 8 | 0 | 201:8 |
| GET `/api/proposals` | 8 | 0.9 | 1.26 | 1.26 | 1.22 | 2108.41 | 8 | 0 | 200:8 |
| POST `/api/proposals` | 8 | 0.82 | 1.77 | 1.77 | 1.73 | 1719 | 8 | 0 | 201:8 |
| POST `/api/payments` | 8 | 0.65 | 1.34 | 1.34 | 1.28 | 2136.16 | 8 | 0 | 201:8 |
| GET `/api/reviews` | 8 | 0.43 | 1.61 | 1.61 | 1.55 | 2647.84 | 8 | 0 | 200:8 |
| POST `/api/reviews` | 8 | 1.5 | 2.81 | 2.81 | 2.76 | 1218.37 | 8 | 0 | 201:8 |
| GET `/api/messages` | 8 | 0.45 | 0.67 | 0.67 | 0.63 | 3880.36 | 8 | 0 | 200:8 |
| POST `/api/messages` | 8 | 0.52 | 0.62 | 0.62 | 0.59 | 3584.43 | 8 | 0 | 201:8 |
| GET `/api/notifications` | 8 | 0.44 | 0.69 | 0.69 | 0.67 | 3900.46 | 8 | 0 | 200:8 |
| POST `/api/notifications` | 8 | 1.25 | 2.92 | 2.92 | 2.89 | 1276.77 | 8 | 0 | 201:8 |
| POST `/api/uploads` | 8 | 1.13 | 3.24 | 3.24 | 3.19 | 1037.13 | 8 | 0 | 201:8 |
| GET `/api/search?q=react%20api%20benchmark` | 8 | 0.43 | 0.91 | 0.91 | 0.48 | 3311.54 | 8 | 0 | 200:8 |
| GET `/api/admin/metrics` | 8 | 0.72 | 2.65 | 2.65 | 2.61 | 1681.5 | 8 | 0 | 200:8 |

## Threshold Failures

None.
