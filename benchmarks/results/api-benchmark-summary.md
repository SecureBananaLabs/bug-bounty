# API Benchmark Summary

- Mode: full
- Target: http://127.0.0.1:61903
- Started: 2026-05-22T02:31:07.278Z
- Finished: 2026-05-22T02:31:07.544Z
- Runtime: v22.15.0 on win32 10.0.26200 x64
- CPU: AMD Ryzen 5 7530U with Radeon Graphics          (12 cores)
- Requests: 105 across 21 endpoints
- Max p99 latency: 24.14 ms
- Max p99 TTFB: 23.99 ms
- Aggregate error rate: 0%
- Threshold failures: 0

| Endpoint | Method | Path | Requests | p50 ms | p95 ms | p99 ms | p99 TTFB ms | Sustained RPS | Error % |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| health | GET | /health | 5 | 4.34 | 17.11 | 17.11 | 16.42 | 192.48 | 0 |
| auth-register | POST | /api/auth/register | 5 | 14.53 | 24.14 | 24.14 | 23.99 | 116.17 | 0 |
| auth-login | POST | /api/auth/login | 5 | 7.12 | 9.17 | 9.17 | 9.05 | 244.88 | 0 |
| auth-oauth-callback | GET | /api/auth/oauth/github/callback | 5 | 2.82 | 2.97 | 2.97 | 2.84 | 729 | 0 |
| auth-refresh | POST | /api/auth/refresh | 5 | 3.48 | 4.39 | 4.39 | 4.23 | 469.24 | 0 |
| users-list | GET | /api/users | 5 | 2.85 | 3.55 | 3.55 | 3.46 | 585.86 | 0 |
| users-create | POST | /api/users | 5 | 3.43 | 4.12 | 4.12 | 4 | 488.84 | 0 |
| jobs-list | GET | /api/jobs | 5 | 2.9 | 4.2 | 4.2 | 4.08 | 574.27 | 0 |
| jobs-create | POST | /api/jobs | 5 | 3.56 | 4.93 | 4.93 | 4.83 | 504.7 | 0 |
| proposals-list | GET | /api/proposals | 5 | 3.67 | 4.87 | 4.87 | 4.73 | 480.11 | 0 |
| proposals-create | POST | /api/proposals | 5 | 2.35 | 2.64 | 2.64 | 2.56 | 671.82 | 0 |
| payments-create | POST | /api/payments | 5 | 3.35 | 4.25 | 4.25 | 4.17 | 516.13 | 0 |
| reviews-list | GET | /api/reviews | 5 | 2.92 | 3.46 | 3.46 | 3.35 | 617.75 | 0 |
| reviews-create | POST | /api/reviews | 5 | 4.98 | 5.29 | 5.29 | 5.08 | 395.72 | 0 |
| messages-list | GET | /api/messages | 5 | 3.14 | 4.78 | 4.78 | 4.67 | 499.28 | 0 |
| messages-create | POST | /api/messages | 5 | 3.57 | 4.73 | 4.73 | 4.54 | 467.99 | 0 |
| notifications-list | GET | /api/notifications | 5 | 2.05 | 4.13 | 4.13 | 4.01 | 674.7 | 0 |
| notifications-create | POST | /api/notifications | 5 | 1.97 | 2.3 | 2.3 | 2.24 | 922.58 | 0 |
| uploads-create | POST | /api/uploads | 5 | 3.04 | 11.13 | 11.13 | 11.06 | 317.39 | 0 |
| search | GET | /api/search?q=benchmark | 5 | 2 | 4.27 | 4.27 | 4.19 | 673.15 | 0 |
| admin-metrics | GET | /api/admin/metrics | 5 | 4.55 | 5.87 | 5.87 | 5.77 | 357.96 | 0 |
