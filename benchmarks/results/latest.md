# API Benchmark Summary

- Mode: full
- Target: http://127.0.0.1:65444
- Generated: 2026-05-20T02:59:22.109Z
- Duration per endpoint: 1000ms
- Concurrency: 4
- Warmup requests per endpoint: 2
- Routes covered: 20

| Method | Path | Requests | p50 ms | p95 ms | p99 ms | p95 TTFB ms | Sustained RPS | Peak RPS | Error Rate |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| POST | `/api/auth/register` | 7972 | 0.41 | 0.86 | 2.25 | 0.84 | 7972 | 7972 | 0% |
| POST | `/api/auth/login` | 9292 | 0.35 | 0.69 | 2.21 | 0.68 | 9292 | 9292 | 0% |
| GET | `/api/auth/oauth/google/callback` | 15352 | 0.22 | 0.39 | 0.71 | 0.38 | 15352 | 15352 | 0% |
| POST | `/api/auth/refresh` | 9892 | 0.34 | 0.6 | 1.95 | 0.59 | 9892 | 9892 | 0% |
| GET | `/api/users` | 16731 | 0.21 | 0.3 | 0.58 | 0.3 | 16731 | 16731 | 0% |
| POST | `/api/users` | 12280 | 0.29 | 0.42 | 1.94 | 0.41 | 12280 | 12280 | 0% |
| GET | `/api/jobs` | 16823 | 0.21 | 0.29 | 0.5 | 0.29 | 16823 | 16823 | 0% |
| POST | `/api/jobs` | 11400 | 0.29 | 0.54 | 2.17 | 0.53 | 11400 | 11400 | 0% |
| GET | `/api/proposals` | 16441 | 0.21 | 0.33 | 0.59 | 0.32 | 16441 | 16441 | 0% |
| POST | `/api/proposals` | 11833 | 0.28 | 0.49 | 2.06 | 0.49 | 11833 | 11833 | 0% |
| POST | `/api/payments` | 12524 | 0.28 | 0.39 | 2 | 0.38 | 12524 | 12524 | 0% |
| GET | `/api/reviews` | 16674 | 0.21 | 0.3 | 0.51 | 0.29 | 16674 | 16674 | 0% |
| POST | `/api/reviews` | 12312 | 0.28 | 0.42 | 1.79 | 0.41 | 12312 | 12312 | 0% |
| GET | `/api/messages` | 16536 | 0.21 | 0.3 | 0.49 | 0.29 | 16536 | 16536 | 0% |
| POST | `/api/messages` | 12296 | 0.29 | 0.39 | 0.96 | 0.39 | 12296 | 12296 | 0% |
| GET | `/api/notifications` | 16749 | 0.21 | 0.28 | 0.43 | 0.28 | 16749 | 16749 | 0% |
| POST | `/api/notifications` | 11920 | 0.29 | 0.46 | 2.01 | 0.46 | 11920 | 11920 | 0% |
| POST | `/api/uploads` | 7084 | 0.47 | 0.81 | 3.22 | 0.8 | 7084 | 7084 | 0% |
| GET | `/api/search?q=benchmark%20api%20latency` | 15908 | 0.22 | 0.3 | 0.5 | 0.3 | 15908 | 15908 | 0% |
| GET | `/api/admin/metrics` | 12000 | 0.3 | 0.41 | 0.69 | 0.4 | 12000 | 12000 | 0% |

## Thresholds

No threshold failures.
