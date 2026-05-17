# API Benchmark Report

Generated: 2026-05-17T06:34:35.481Z
Target: http://127.0.0.1:40825
Mode: full
Node: v22.22.1
Host: Linux 6.6.87.2-microsoft-standard-WSL2 x64, 6 logical cores, 16 GiB RAM
Rate limit disabled: yes

| Endpoint | Gate | p50 ms | p95 ms | p99 ms | Sustained RPS | Peak RPS | Error % | TTFB p95 ms | Statuses |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| POST /api/auth/register | pass | 5 | 186 | 193 | 50 | 50 | 0 | 4.97 | 201: 50 |
| POST /api/auth/login | pass | 6 | 17 | 22 | 50 | 50 | 0 | 1.47 | 200: 50 |
| GET /api/auth/oauth/github/callback | pass | 3 | 7 | 9 | 50 | 50 | 0 | 1.33 | 200: 50 |
| POST /api/auth/refresh | pass | 4 | 8 | 10 | 50 | 50 | 0 | 1.77 | 200: 50 |
| GET /api/users | pass | 2 | 7 | 9 | 50 | 50 | 0 | 0.86 | 200: 50 |
| POST /api/users | pass | 4 | 8 | 10 | 50 | 50 | 0 | 1.23 | 201: 50 |
| GET /api/jobs | pass | 3 | 8 | 10 | 50 | 50 | 0 | 0.96 | 200: 50 |
| POST /api/jobs | pass | 3 | 7 | 9 | 50 | 50 | 0 | 1.05 | 201: 50 |
| GET /api/proposals | pass | 2 | 5 | 6 | 50 | 50 | 0 | 0.89 | 200: 50 |
| POST /api/proposals | pass | 3 | 6 | 8 | 50 | 50 | 0 | 1.07 | 201: 50 |
| POST /api/payments | pass | 2 | 5 | 7 | 50 | 50 | 0 | 0.99 | 201: 50 |
| GET /api/reviews | pass | 3 | 6 | 9 | 50 | 50 | 0 | 0.84 | 200: 50 |
| POST /api/reviews | pass | 3 | 6 | 9 | 50 | 50 | 0 | 1.12 | 201: 50 |
| GET /api/messages | pass | 2 | 6 | 7 | 50 | 50 | 0 | 0.92 | 200: 50 |
| POST /api/messages | pass | 3 | 8 | 10 | 50 | 50 | 0 | 0.96 | 201: 50 |
| GET /api/notifications | pass | 2 | 4 | 5 | 50 | 50 | 0 | 1.19 | 200: 50 |
| POST /api/notifications | pass | 4 | 11 | 14 | 50 | 50 | 0 | 1.13 | 201: 50 |
| POST /api/uploads | pass | 6 | 20 | 26 | 50 | 50 | 0 | 3.04 | 201: 50 |
| GET /api/search?q=senior%20react%20payments | pass | 3 | 11 | 14 | 50 | 50 | 0 | 1.04 | 200: 50 |
| GET /api/admin/metrics | pass | 3 | 9 | 12 | 50 | 50 | 0 | 1.81 | 200: 50 |

All benchmark thresholds passed.
