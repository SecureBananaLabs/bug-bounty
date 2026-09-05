# API Benchmark Report

- Mode: smoke
- Target: http://127.0.0.1:51574
- Generated: 2026-05-20T20:29:37.611Z
- Endpoints: 21
- Requests: 21
- Error rate: 0.00%
- Max p99 latency: 16.6 ms
- Max p99 TTFB: 15.2 ms

| Gate | Method | Path | Requests | Error rate | p50 ms | p95 ms | p99 ms | p99 TTFB ms | RPS |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| pass | GET | /health | 1 | 0.00% | 16.6 | 16.6 | 16.6 | 15.2 | 60.01 |
| pass | POST | /api/auth/register | 1 | 0.00% | 7.75 | 7.75 | 7.75 | 7.56 | 128.67 |
| pass | POST | /api/auth/login | 1 | 0.00% | 2.8 | 2.8 | 2.8 | 2.67 | 355.91 |
| pass | GET | /api/auth/oauth/benchmark/callback | 1 | 0.00% | 1.21 | 1.21 | 1.21 | 1.14 | 820.32 |
| pass | POST | /api/auth/refresh | 1 | 0.00% | 2.14 | 2.14 | 2.14 | 1.77 | 465.13 |
| pass | GET | /api/users | 1 | 0.00% | 1.48 | 1.48 | 1.48 | 1.07 | 670.37 |
| pass | POST | /api/users | 1 | 0.00% | 2.6 | 2.6 | 2.6 | 2.04 | 381.49 |
| pass | GET | /api/jobs | 1 | 0.00% | 1.08 | 1.08 | 1.08 | 0.98 | 915.61 |
| pass | POST | /api/jobs | 1 | 0.00% | 3.8 | 3.8 | 3.8 | 3.6 | 262.83 |
| pass | GET | /api/proposals | 1 | 0.00% | 2.24 | 2.24 | 2.24 | 2.17 | 443.45 |
| pass | POST | /api/proposals | 1 | 0.00% | 1.27 | 1.27 | 1.27 | 1.22 | 782.98 |
| pass | POST | /api/payments | 1 | 0.00% | 0.74 | 0.74 | 0.74 | 0.69 | 1000 |
| pass | GET | /api/reviews | 1 | 0.00% | 0.49 | 0.49 | 0.49 | 0.46 | 1000 |
| pass | POST | /api/reviews | 1 | 0.00% | 0.62 | 0.62 | 0.62 | 0.59 | 1000 |
| pass | GET | /api/messages | 1 | 0.00% | 0.32 | 0.32 | 0.32 | 0.29 | 1000 |
| pass | POST | /api/messages | 1 | 0.00% | 0.71 | 0.71 | 0.71 | 0.67 | 1000 |
| pass | GET | /api/notifications | 1 | 0.00% | 0.41 | 0.41 | 0.41 | 0.38 | 1000 |
| pass | POST | /api/notifications | 1 | 0.00% | 1.02 | 1.02 | 1.02 | 0.98 | 979.19 |
| pass | POST | /api/uploads | 1 | 0.00% | 5.29 | 5.29 | 5.29 | 5.24 | 188.74 |
| pass | GET | /api/search?q=benchmark | 1 | 0.00% | 0.87 | 0.87 | 0.87 | 0.83 | 1000 |
| pass | GET | /api/admin/metrics | 1 | 0.00% | 0.87 | 0.87 | 0.87 | 0.84 | 1000 |
