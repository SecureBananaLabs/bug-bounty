# API Benchmark Summary

- Target: http://127.0.0.1:54115
- Started: 2026-05-20T20:08:30.696Z
- Finished: 2026-05-20T20:08:30.770Z
- Endpoints covered: 21
- Total requests: 105
- Total errors: 0
- Max p99 latency: 19.07 ms
- Max p99 TTFB: 18.47 ms

| Endpoint | Method | Path | Requests | Error rate | p50 ms | p95 ms | p99 ms | p99 TTFB ms | RPS |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| health | GET | /health | 5 | 0% | 0.74 | 19.07 | 19.07 | 18.47 | 221.83 |
| auth register | POST | /api/auth/register | 5 | 0% | 0.79 | 6.14 | 6.14 | 6.06 | 524.36 |
| auth login | POST | /api/auth/login | 5 | 0% | 0.68 | 0.89 | 0.89 | 0.84 | 1389.07 |
| auth oauth callback | GET | /api/auth/oauth/github/callback | 5 | 0% | 0.36 | 0.58 | 0.58 | 0.54 | 2395.69 |
| auth refresh | POST | /api/auth/refresh | 5 | 0% | 0.37 | 1.15 | 1.15 | 1.11 | 1874.18 |
| users list | GET | /api/users | 5 | 0% | 0.3 | 0.34 | 0.34 | 0.31 | 3336.58 |
| users create | POST | /api/users | 5 | 0% | 0.49 | 0.57 | 0.57 | 0.52 | 2000.23 |
| jobs list | GET | /api/jobs | 5 | 0% | 0.28 | 0.35 | 0.35 | 0.32 | 3504.37 |
| jobs create | POST | /api/jobs | 5 | 0% | 0.39 | 0.6 | 0.6 | 0.56 | 2324.32 |
| proposals list | GET | /api/proposals | 5 | 0% | 0.31 | 0.45 | 0.45 | 0.42 | 2968.61 |
| proposals create | POST | /api/proposals | 5 | 0% | 0.35 | 0.39 | 0.39 | 0.36 | 2709.48 |
| payments create | POST | /api/payments | 5 | 0% | 0.35 | 0.42 | 0.42 | 0.39 | 2824.19 |
| reviews list | GET | /api/reviews | 5 | 0% | 0.23 | 0.25 | 0.25 | 0.23 | 4288.78 |
| reviews create | POST | /api/reviews | 5 | 0% | 0.33 | 1.03 | 1.03 | 0.99 | 2026.58 |
| messages list | GET | /api/messages | 5 | 0% | 0.26 | 0.3 | 0.3 | 0.27 | 3835.83 |
| messages create | POST | /api/messages | 5 | 0% | 0.32 | 0.38 | 0.38 | 0.36 | 3014.17 |
| notifications list | GET | /api/notifications | 5 | 0% | 0.23 | 0.25 | 0.25 | 0.22 | 4510.94 |
| notifications create | POST | /api/notifications | 5 | 0% | 0.28 | 0.31 | 0.31 | 0.29 | 3437.9 |
| uploads create | POST | /api/uploads | 5 | 0% | 0.61 | 3 | 3 | 2.97 | 864.57 |
| search | GET | /api/search?q=designer | 5 | 0% | 0.27 | 0.69 | 0.69 | 0.66 | 2749.58 |
| admin metrics | GET | /api/admin/metrics | 5 | 0% | 0.35 | 0.82 | 0.82 | 0.79 | 2294.5 |
