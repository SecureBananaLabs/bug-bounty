# API Benchmark Report

- Mode: full
- Target: http://127.0.0.1:54698
- Started: 2026-05-20T13:06:07.824Z
- Finished: 2026-05-20T13:06:07.915Z
- Requests per endpoint: 8
- Concurrency: 4
- Host: darwin 25.2.0 (arm64)
- CPU: Apple M4, 10 logical cores
- Memory: 16384 MB total, 179 MB free at start
- Node.js: v22.22.2

| Method | Path | Requests | p50 ms | p95 ms | p99 ms | p95 TTFB ms | Sustained RPS | Peak RPS | Error Rate | Non-2xx Rate |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| GET | `/health` | 8 | 5.68 | 16.67 | 16.67 | 16.46 | 302.51 | 80 | 0% | 0% |
| POST | `/api/auth/register` | 8 | 2.74 | 8.6 | 8.6 | 8.48 | 638.38 | 80 | 0% | 0% |
| POST | `/api/auth/login` | 8 | 1.81 | 2.75 | 2.75 | 2.72 | 1768.18 | 80 | 0% | 0% |
| GET | `/api/auth/oauth/github/callback` | 8 | 1.38 | 1.91 | 1.91 | 1.88 | 2594.94 | 80 | 0% | 0% |
| POST | `/api/auth/refresh` | 8 | 1.12 | 1.83 | 1.83 | 1.8 | 2732.28 | 80 | 0% | 0% |
| GET | `/api/users` | 8 | 0.86 | 1.17 | 1.17 | 1.14 | 3780.34 | 80 | 0% | 0% |
| POST | `/api/users` | 8 | 1.09 | 1.5 | 1.5 | 1.47 | 3198.29 | 80 | 0% | 0% |
| GET | `/api/jobs` | 8 | 0.74 | 0.91 | 0.91 | 0.89 | 4705.07 | 80 | 0% | 0% |
| POST | `/api/jobs` | 8 | 1.08 | 1.47 | 1.47 | 1.44 | 3298.74 | 80 | 0% | 0% |
| GET | `/api/proposals` | 8 | 0.88 | 1 | 1 | 0.97 | 4214.78 | 80 | 0% | 0% |
| POST | `/api/proposals` | 8 | 1.02 | 1.82 | 1.82 | 1.8 | 2953.48 | 80 | 0% | 0% |
| POST | `/api/payments` | 8 | 0.86 | 1.08 | 1.08 | 1.06 | 4161.43 | 80 | 0% | 0% |
| GET | `/api/reviews` | 8 | 0.84 | 0.99 | 0.99 | 0.96 | 4376.77 | 80 | 0% | 0% |
| POST | `/api/reviews` | 8 | 0.98 | 1.23 | 1.23 | 1.21 | 3666.36 | 80 | 0% | 0% |
| GET | `/api/messages` | 8 | 0.75 | 0.9 | 0.9 | 0.88 | 4677.79 | 80 | 0% | 0% |
| POST | `/api/messages` | 8 | 1.37 | 3.19 | 3.19 | 3.17 | 1872.62 | 80 | 0% | 0% |
| GET | `/api/notifications` | 8 | 0.73 | 0.92 | 0.92 | 0.9 | 4691.74 | 80 | 0% | 0% |
| POST | `/api/notifications` | 8 | 0.87 | 1.06 | 1.06 | 1.04 | 3966.2 | 80 | 0% | 0% |
| POST | `/api/uploads` | 8 | 2.39 | 4.59 | 4.59 | 4.56 | 1148.14 | 80 | 0% | 0% |
| GET | `/api/search?q=react%20payments%20benchmark` | 8 | 1.15 | 1.39 | 1.39 | 1.36 | 3255.01 | 80 | 0% | 0% |
| GET | `/api/admin/metrics` | 8 | 1.22 | 1.78 | 1.78 | 1.77 | 2855.36 | 80 | 0% | 0% |

## Thresholds

No threshold failures.
