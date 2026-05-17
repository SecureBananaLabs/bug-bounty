# API Benchmark Report

Generated: 2026-05-17T06:34:08.016Z
Target: http://127.0.0.1:43817
Mode: smoke
Node: v22.22.1
Host: Linux 6.6.87.2-microsoft-standard-WSL2 x64, 6 logical cores, 16 GiB RAM
Rate limit disabled: yes

| Endpoint | Gate | p50 ms | p95 ms | p99 ms | Sustained RPS | Peak RPS | Error % | TTFB p95 ms | Statuses |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| POST /api/auth/register | pass | 2 | 168 | 168 | 2 | 2 | 0 | 6.88 | 201: 2 |
| POST /api/auth/login | pass | 1 | 3 | 3 | 2 | 2 | 0 | 2.29 | 200: 2 |
| GET /api/auth/oauth/github/callback | pass | 1 | 2 | 2 | 2 | 2 | 0 | 2.78 | 200: 2 |
| POST /api/auth/refresh | pass | 2 | 2 | 2 | 2 | 2 | 0 | 2.27 | 200: 2 |
| GET /api/users | pass | 1 | 1 | 1 | 2 | 2 | 0 | 1.11 | 200: 2 |
| POST /api/users | pass | 0 | 1 | 1 | 2 | 2 | 0 | 1.15 | 201: 2 |
| GET /api/jobs | pass | 0 | 1 | 1 | 2 | 2 | 0 | 1 | 200: 2 |
| POST /api/jobs | pass | 0 | 2 | 2 | 2 | 2 | 0 | 1.95 | 201: 2 |
| GET /api/proposals | pass | 0 | 2 | 2 | 2 | 2 | 0 | 1.66 | 200: 2 |
| POST /api/proposals | pass | 0 | 1 | 1 | 2 | 2 | 0 | 1.17 | 201: 2 |
| POST /api/payments | pass | 0 | 1 | 1 | 2 | 2 | 0 | 1.08 | 201: 2 |
| GET /api/reviews | pass | 1 | 1 | 1 | 2 | 2 | 0 | 0.98 | 200: 2 |
| POST /api/reviews | pass | 0 | 1 | 1 | 2 | 2 | 0 | 1.21 | 201: 2 |
| GET /api/messages | pass | 0 | 1 | 1 | 2 | 2 | 0 | 1.09 | 200: 2 |
| POST /api/messages | pass | 0 | 1 | 1 | 2 | 2 | 0 | 1.2 | 201: 2 |
| GET /api/notifications | pass | 0 | 1 | 1 | 2 | 2 | 0 | 1.3 | 200: 2 |
| POST /api/notifications | pass | 0 | 1 | 1 | 2 | 2 | 0 | 1.87 | 201: 2 |
| POST /api/uploads | pass | 2 | 11 | 11 | 2 | 2 | 0 | 1.9 | 201: 2 |
| GET /api/search?q=senior%20react%20payments | pass | 1 | 2 | 2 | 2 | 2 | 0 | 1.07 | 200: 2 |
| GET /api/admin/metrics | pass | 1 | 3 | 3 | 2 | 2 | 0 | 1.3 | 200: 2 |

All benchmark thresholds passed.
