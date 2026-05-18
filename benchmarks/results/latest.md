# API Benchmark Summary

- Mode: full
- Target: http://127.0.0.1:39963
- Started: 2026-05-18T00:22:00.905Z
- Finished: 2026-05-18T00:22:01.100Z
- Duration per endpoint: 1000 ms
- Concurrency: 4
- Max requests per endpoint: 8
- Total requests: 160
- Max p99 latency: 21.06 ms
- Max error rate: 0%

| Endpoint | Requests | p50 ms | p95 ms | p99 ms | TTFB p95 ms | Sustained RPS | Peak RPS | Error rate |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| POST /api/auth/register | 8 | 7.37 | 21.06 | 21.06 | 20.94 | 337.18 | 8 | 0% |
| POST /api/auth/login | 8 | 5.08 | 7.23 | 7.23 | 7.11 | 655.15 | 8 | 0% |
| GET /api/auth/oauth/github/callback | 8 | 3.84 | 5.97 | 5.97 | 5.87 | 820.76 | 8 | 0% |
| POST /api/auth/refresh | 8 | 4.09 | 5.26 | 5.26 | 5.18 | 891.79 | 8 | 0% |
| GET /api/users | 8 | 2.85 | 3.66 | 3.66 | 3.58 | 1240.35 | 8 | 0% |
| POST /api/users | 8 | 3.21 | 3.94 | 3.94 | 3.87 | 1086.5 | 8 | 0% |
| GET /api/jobs | 8 | 3.16 | 3.77 | 3.77 | 3.66 | 1129.16 | 8 | 0% |
| POST /api/jobs | 8 | 4.4 | 5.83 | 5.83 | 5.71 | 806.98 | 8 | 0% |
| GET /api/proposals | 8 | 3.04 | 4.03 | 4.03 | 3.95 | 1126.1 | 8 | 0% |
| POST /api/proposals | 8 | 3.82 | 5.16 | 5.16 | 5.08 | 906.37 | 8 | 0% |
| POST /api/payments | 8 | 3.32 | 4.75 | 4.75 | 4.68 | 1007.29 | 8 | 0% |
| GET /api/reviews | 8 | 2.82 | 3.42 | 3.42 | 3.35 | 1249.16 | 8 | 0% |
| POST /api/reviews | 8 | 3.15 | 3.92 | 3.92 | 3.85 | 1138.47 | 8 | 0% |
| GET /api/messages | 8 | 2.7 | 3.46 | 3.46 | 3.4 | 1312.04 | 8 | 0% |
| POST /api/messages | 8 | 2.88 | 3.47 | 3.47 | 3.4 | 1256.89 | 8 | 0% |
| GET /api/notifications | 8 | 2.85 | 3.63 | 3.63 | 3.56 | 1213.85 | 8 | 0% |
| POST /api/notifications | 8 | 3.16 | 4 | 4 | 3.93 | 1142.93 | 8 | 0% |
| POST /api/uploads | 8 | 6.09 | 16.23 | 16.23 | 16.13 | 357.29 | 8 | 0% |
| GET /api/search?q=dashboard | 8 | 3.53 | 5.98 | 5.98 | 5.9 | 840.64 | 8 | 0% |
| GET /api/admin/metrics | 8 | 4.9 | 7.56 | 7.56 | 7.42 | 614.52 | 8 | 0% |
