# API benchmark summary

Target: http://127.0.0.1:3001

| Endpoint | p50 ms | p95 ms | p99 ms | TTFB p50 ms | RPS | Error rate |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| GET /health | 2.42 | 29.4 | 29.4 | 2.21 | 62.74 | 0% |
| POST /api/auth/login | 2.34 | 10.69 | 10.69 | 2.18 | 153.41 | 0% |
| GET /api/users | 1.22 | 1.44 | 1.44 | 1.09 | 749.41 | 0% |
| GET /api/jobs | 1.13 | 1.45 | 1.45 | 1.04 | 753.04 | 0% |
| GET /api/proposals | 1.56 | 1.7 | 1.7 | 1.35 | 611.29 | 0% |
| GET /api/payments | 1.24 | 1.72 | 1.72 | 1.12 | 672.04 | 0% |
| GET /api/reviews | 0.98 | 1.23 | 1.23 | 0.89 | 901.32 | 0% |
| GET /api/messages | 0.94 | 1.13 | 1.13 | 0.88 | 962 | 0% |
| GET /api/notifications | 0.62 | 0.73 | 0.73 | 0.57 | 1476.74 | 0% |
| GET /api/search?q=benchmark | 0.86 | 1.39 | 1.39 | 0.81 | 885.82 | 0% |
| GET /api/admin | 0.67 | 0.87 | 0.87 | 0.61 | 1290.29 | 0% |
