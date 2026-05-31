# API benchmark report

Started: 2026-05-22T13:11:55.419Z

Environment: v24.15.0 on win32 x64, 8 CPU(s), 5.92 GB RAM

Config: concurrency 8, duration 8000ms, warmup 3

| Endpoint | Requests | RPS | Error rate | p50 ms | p95 ms | p99 ms | Threshold |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| GET /api/admin/metrics | 9699 | 1212.38 | 0 | 6.1 | 10.05 | 13.79 | pass |
| GET /api/auth/oauth/github/callback | 18919 | 2364.88 | 0 | 3.01 | 4.55 | 11.34 | pass |
| GET /api/jobs | 22279 | 2784.88 | 0 | 2.56 | 3.67 | 10.3 | pass |
| GET /api/messages | 22059 | 2757.38 | 0 | 2.55 | 3.73 | 10.46 | pass |
| GET /api/notifications | 21039 | 2629.88 | 0 | 2.66 | 4.37 | 10.49 | pass |
| GET /api/proposals | 22278 | 2784.75 | 0 | 2.54 | 3.67 | 10.88 | pass |
| GET /api/reviews | 22101 | 2762.63 | 0 | 2.55 | 3.79 | 10.59 | pass |
| GET /api/search | 21117 | 2639.63 | 0 | 2.63 | 4.18 | 10.8 | pass |
| GET /api/search?q=security | 21167 | 2645.88 | 0 | 2.69 | 3.91 | 10.48 | pass |
| GET /api/users | 22298 | 2787.25 | 0 | 2.54 | 3.65 | 10.19 | pass |
| GET /health | 22407 | 2800.88 | 0 | 2.52 | 3.74 | 10.64 | pass |
| POST /api/auth/login | 8551 | 1068.88 | 0 | 6.79 | 10.69 | 17.17 | pass |
| POST /api/auth/refresh | 9079 | 1134.88 | 0 | 6.75 | 9.48 | 17.43 | pass |
| POST /api/auth/register | 10605 | 1325.63 | 0 | 5.66 | 7.4 | 15.47 | pass |
| POST /api/jobs | 14503 | 1812.88 | 0 | 3.94 | 5.51 | 14.11 | pass |
| POST /api/messages | 14327 | 1790.88 | 0 | 3.93 | 6.09 | 14.17 | pass |
| POST /api/notifications | 15319 | 1914.88 | 0 | 3.71 | 5.09 | 14.25 | pass |
| POST /api/payments | 15095 | 1886.88 | 0 | 3.74 | 5.19 | 14.33 | pass |
| POST /api/proposals | 14945 | 1868.13 | 0 | 3.76 | 5.4 | 14.18 | pass |
| POST /api/reviews | 14559 | 1819.88 | 0 | 3.97 | 5.79 | 14.79 | pass |
| POST /api/uploads | 8831 | 1103.88 | 0 | 6.73 | 9.92 | 19.43 | pass |
| POST /api/users | 14752 | 1844 | 0 | 3.81 | 5.46 | 14.69 | pass |
