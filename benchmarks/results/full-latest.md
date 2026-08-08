# API Benchmark Report

- Mode: full
- Target: http://127.0.0.1:51582
- Generated: 2026-05-20T20:29:40.993Z
- Endpoints: 21
- Requests: 168
- Error rate: 0.00%
- Max p99 latency: 13.01 ms
- Max p99 TTFB: 12.74 ms

| Gate | Method | Path | Requests | Error rate | p50 ms | p95 ms | p99 ms | p99 TTFB ms | RPS |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| pass | GET | /health | 8 | 0.00% | 1.87 | 13.01 | 13.01 | 12.74 | 390.66 |
| pass | POST | /api/auth/register | 8 | 0.00% | 1.37 | 8.73 | 8.73 | 8.55 | 574.19 |
| pass | POST | /api/auth/login | 8 | 0.00% | 1.32 | 1.64 | 1.64 | 1.58 | 1491.7 |
| pass | GET | /api/auth/oauth/benchmark/callback | 8 | 0.00% | 0.53 | 0.9 | 0.9 | 0.86 | 3102.73 |
| pass | POST | /api/auth/refresh | 8 | 0.00% | 0.55 | 0.75 | 0.75 | 0.72 | 3310.46 |
| pass | GET | /api/users | 8 | 0.00% | 0.47 | 0.91 | 0.91 | 0.89 | 3269.87 |
| pass | POST | /api/users | 8 | 0.00% | 0.62 | 1.14 | 1.14 | 1.12 | 2616.98 |
| pass | GET | /api/jobs | 8 | 0.00% | 0.5 | 0.57 | 0.57 | 0.55 | 3787.51 |
| pass | POST | /api/jobs | 8 | 0.00% | 0.78 | 1.57 | 1.57 | 1.54 | 2067.54 |
| pass | GET | /api/proposals | 8 | 0.00% | 0.46 | 0.55 | 0.55 | 0.53 | 4142.3 |
| pass | POST | /api/proposals | 8 | 0.00% | 0.57 | 0.7 | 0.7 | 0.67 | 3359.05 |
| pass | POST | /api/payments | 8 | 0.00% | 0.57 | 0.67 | 0.67 | 0.64 | 3376.24 |
| pass | GET | /api/reviews | 8 | 0.00% | 0.46 | 0.75 | 0.75 | 0.72 | 3575.88 |
| pass | POST | /api/reviews | 8 | 0.00% | 0.59 | 1.44 | 1.44 | 1.35 | 2460.75 |
| pass | GET | /api/messages | 8 | 0.00% | 0.45 | 0.54 | 0.54 | 0.51 | 4278.26 |
| pass | POST | /api/messages | 8 | 0.00% | 0.77 | 1.73 | 1.73 | 1.7 | 1984.31 |
| pass | GET | /api/notifications | 8 | 0.00% | 0.44 | 0.57 | 0.57 | 0.55 | 4168.84 |
| pass | POST | /api/notifications | 8 | 0.00% | 0.53 | 0.66 | 0.66 | 0.64 | 3563.67 |
| pass | POST | /api/uploads | 8 | 0.00% | 1.17 | 4.86 | 4.86 | 4.83 | 939.32 |
| pass | GET | /api/search?q=benchmark | 8 | 0.00% | 0.53 | 1.05 | 1.05 | 1.03 | 3003.28 |
| pass | GET | /api/admin/metrics | 8 | 0.00% | 0.52 | 1.02 | 1.02 | 1 | 3019.67 |
