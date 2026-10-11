# API Benchmark Summary

- Mode: full
- Target: local
- Iterations per endpoint: 5
- Endpoint scenarios: 21
- Overall max p99: 2.89 ms
- Overall max error rate: 0

| Endpoint | p50 ms | p95 ms | p99 ms | TTFB p95 ms | Sustained RPS | Peak RPS | Error rate |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| GET /health | 0.79 | 1.81 | 1.81 | 1.7 | 1002.54 | 1443.17 | 0 |
| POST /api/auth/register | 1.24 | 2.34 | 2.34 | 2.15 | 708.13 | 1424.5 | 0 |
| POST /api/auth/login | 0.63 | 1.38 | 1.38 | 1.33 | 1325.66 | 2014.61 | 0 |
| GET /api/auth/oauth/github/callback | 0.35 | 0.88 | 0.88 | 0.84 | 2075.55 | 2980.99 | 0 |
| POST /api/auth/refresh | 0.31 | 0.4 | 0.4 | 0.37 | 3037.44 | 3573.56 | 0 |
| GET /api/users | 0.28 | 0.28 | 0.28 | 0.26 | 3762.7 | 4109.59 | 0 |
| POST /api/users | 0.42 | 0.56 | 0.56 | 0.52 | 2310.14 | 2851.37 | 0 |
| GET /api/jobs | 0.3 | 0.41 | 0.41 | 0.37 | 3124.67 | 3576.22 | 0 |
| POST /api/jobs | 0.54 | 0.62 | 0.62 | 0.59 | 1830.86 | 1975.8 | 0 |
| GET /api/proposals | 0.32 | 0.45 | 0.45 | 0.42 | 3003.45 | 3908.16 | 0 |
| POST /api/proposals | 0.31 | 0.37 | 0.37 | 0.34 | 3032.14 | 3282.27 | 0 |
| POST /api/payments | 0.33 | 1.25 | 1.25 | 1.19 | 1952.97 | 3294.45 | 0 |
| GET /api/reviews | 0.3 | 0.41 | 0.41 | 0.38 | 3258.92 | 3953.88 | 0 |
| POST /api/reviews | 0.31 | 0.39 | 0.39 | 0.36 | 3087.93 | 3386.48 | 0 |
| GET /api/messages | 0.25 | 0.28 | 0.28 | 0.25 | 3915.94 | 4148.67 | 0 |
| POST /api/messages | 0.34 | 0.47 | 0.47 | 0.43 | 2689.08 | 3275.55 | 0 |
| GET /api/notifications | 0.25 | 0.36 | 0.36 | 0.34 | 3542.02 | 4137.93 | 0 |
| POST /api/notifications | 0.31 | 0.38 | 0.38 | 0.35 | 3076.29 | 3379.81 | 0 |
| POST /api/uploads | 0.89 | 2.89 | 2.89 | 2.86 | 827.96 | 1604.17 | 0 |
| GET /api/search?q=contract | 0.44 | 0.96 | 0.96 | 0.92 | 1851.88 | 3108.41 | 0 |
| GET /api/admin/metrics | 0.36 | 0.8 | 0.8 | 0.77 | 2196.31 | 3406.19 | 0 |
