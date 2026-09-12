# API Benchmark Summary

- Mode: smoke
- Target: local
- Iterations per endpoint: 1
- Endpoint scenarios: 21
- Overall max p99: 3.25 ms
- Overall max error rate: 0

| Endpoint | p50 ms | p95 ms | p99 ms | TTFB p95 ms | Sustained RPS | Peak RPS | Error rate |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| GET /health | 2.27 | 2.27 | 2.27 | 2.14 | 439.69 | 441.47 | 0 |
| POST /api/auth/register | 1.78 | 1.78 | 1.78 | 1.67 | 561.98 | 562.88 | 0 |
| POST /api/auth/login | 1.24 | 1.24 | 1.24 | 1.18 | 807.02 | 808.76 | 0 |
| GET /api/auth/oauth/github/callback | 0.85 | 0.85 | 0.85 | 0.76 | 1000 | 1179.36 | 0 |
| POST /api/auth/refresh | 1.08 | 1.08 | 1.08 | 0.8 | 915.79 | 921.73 | 0 |
| GET /api/users | 1.44 | 1.44 | 1.44 | 1.12 | 693.34 | 695.07 | 0 |
| POST /api/users | 0.95 | 0.95 | 0.95 | 0.91 | 1000 | 1049.78 | 0 |
| GET /api/jobs | 2.06 | 2.06 | 2.06 | 1.88 | 483.49 | 484.58 | 0 |
| POST /api/jobs | 1.15 | 1.15 | 1.15 | 1.1 | 871.36 | 872.66 | 0 |
| GET /api/proposals | 0.46 | 0.46 | 0.46 | 0.43 | 1000 | 2177.86 | 0 |
| POST /api/proposals | 0.53 | 0.53 | 0.53 | 0.5 | 1000 | 1901.59 | 0 |
| POST /api/payments | 0.51 | 0.51 | 0.51 | 0.48 | 1000 | 1975.14 | 0 |
| GET /api/reviews | 0.45 | 0.45 | 0.45 | 0.37 | 1000 | 2210.97 | 0 |
| POST /api/reviews | 0.64 | 0.64 | 0.64 | 0.6 | 1000 | 1572.12 | 0 |
| GET /api/messages | 0.36 | 0.36 | 0.36 | 0.33 | 1000 | 2747.88 | 0 |
| POST /api/messages | 1.83 | 1.83 | 1.83 | 1.79 | 547.22 | 547.82 | 0 |
| GET /api/notifications | 0.43 | 0.43 | 0.43 | 0.4 | 1000 | 2300.61 | 0 |
| POST /api/notifications | 1.24 | 1.24 | 1.24 | 1.12 | 803.45 | 806.99 | 0 |
| POST /api/uploads | 3.25 | 3.25 | 3.25 | 3.22 | 307 | 307.24 | 0 |
| GET /api/search?q=contract | 0.81 | 0.81 | 0.81 | 0.77 | 1000 | 1228.75 | 0 |
| GET /api/admin/metrics | 1.47 | 1.47 | 1.47 | 1.4 | 676.61 | 678.37 | 0 |
