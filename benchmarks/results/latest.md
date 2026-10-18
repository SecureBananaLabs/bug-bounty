# API Benchmark Summary

Generated: 2026-05-31T16:50:47.547Z
Mode: full
Target: http://127.0.0.1:51474
Duration per endpoint: 2000 ms
Concurrency: 4

Total endpoints: 20
Total requests: 409854
Overall error rate: 0.00%
Failed endpoints: none

| Endpoint | Requests | p50 ms | p95 ms | p99 ms | TTFB p95 ms | Sustained RPS | Peak RPS | Error rate | Threshold |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| POST /api/auth/register | 14158 | 0.46 | 1.12 | 1.66 | 1.11 | 7078.54 | 8052 | 0.00% | pass |
| POST /api/auth/login | 16695 | 0.42 | 1.09 | 1.39 | 1.09 | 8345.56 | 8063 | 0.00% | pass |
| GET /api/auth/oauth/github/callback | 24632 | 0.29 | 0.39 | 1.03 | 0.38 | 12314.56 | 12488 | 0.00% | pass |
| POST /api/auth/refresh | 17319 | 0.42 | 0.61 | 1.26 | 0.6 | 8657.89 | 8660 | 0.00% | pass |
| GET /api/users | 25772 | 0.28 | 0.34 | 1.04 | 0.33 | 12885 | 12851 | 0.00% | pass |
| POST /api/users | 19432 | 0.37 | 0.58 | 1.3 | 0.57 | 9715.45 | 9656 | 0.00% | pass |
| GET /api/jobs | 24352 | 0.29 | 0.48 | 1.2 | 0.47 | 12175.2 | 11872 | 0.00% | pass |
| POST /api/jobs | 18876 | 0.37 | 0.62 | 1.4 | 0.61 | 9436.67 | 9525 | 0.00% | pass |
| GET /api/proposals | 24772 | 0.29 | 0.37 | 1.24 | 0.36 | 12385.43 | 12488 | 0.00% | pass |
| POST /api/proposals | 19212 | 0.37 | 0.56 | 1.38 | 0.55 | 9604.14 | 9613 | 0.00% | pass |
| POST /api/payments | 19300 | 0.37 | 0.59 | 1.34 | 0.58 | 9648.76 | 9716 | 0.00% | pass |
| GET /api/reviews | 24179 | 0.29 | 0.46 | 1.2 | 0.45 | 12082.88 | 11948 | 0.00% | pass |
| POST /api/reviews | 19214 | 0.37 | 0.58 | 1.34 | 0.57 | 9606.13 | 9662 | 0.00% | pass |
| GET /api/messages | 24824 | 0.29 | 0.36 | 1.2 | 0.35 | 12411.24 | 12440 | 0.00% | pass |
| POST /api/messages | 18668 | 0.38 | 0.67 | 1.44 | 0.66 | 9333.36 | 9321 | 0.00% | pass |
| GET /api/notifications | 24535 | 0.29 | 0.35 | 1.26 | 0.34 | 12266.07 | 12404 | 0.00% | pass |
| POST /api/notifications | 18243 | 0.37 | 1.01 | 1.51 | 1 | 9120.37 | 9177 | 0.00% | pass |
| POST /api/uploads | 12527 | 0.54 | 1.51 | 1.85 | 1.5 | 6260.61 | 6600 | 0.00% | pass |
| GET /api/search | 23832 | 0.3 | 0.35 | 1.23 | 0.35 | 11915.27 | 12008 | 0.00% | pass |
| GET /api/admin/metrics | 19312 | 0.38 | 0.44 | 1.36 | 0.44 | 9654.91 | 9631 | 0.00% | pass |
