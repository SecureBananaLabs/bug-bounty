# API Benchmark Summary

- Benchmark ID: 2026-05-27T10-53-48-741Z
- Mode: full
- Target: local in-process Express server
- Started: 2026-05-27T10:53:48.765Z
- Finished: 2026-05-27T10:53:49.350Z
- Concurrency: 2
- Max requests per endpoint: 9
- Duration cap per endpoint: 3s
- Node.js: v24.15.0
- Platform: Windows_NT 10.0.19045 x64

| Endpoint | Requests | Sustained RPS | Peak RPS | p50 ms | p95 ms | p99 ms | TTFB p95 ms | Error % | Non-2xx % |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| GET /health | 9 | 77.5 | 77.5 | 7.49 | 85.96 | 85.96 | 83.09 | 0 | 0 |
| POST /api/auth/register | 9 | 173.52 | 173.52 | 5.73 | 31.94 | 31.94 | 31.6 | 0 | 0 |
| POST /api/auth/login | 9 | 387.76 | 387.76 | 4.19 | 7.3 | 7.3 | 7.1 | 0 | 0 |
| GET /api/auth/oauth/github/callback | 9 | 423.42 | 423.42 | 3.76 | 5.72 | 5.72 | 5.44 | 0 | 0 |
| POST /api/auth/refresh | 9 | 172.5 | 172.5 | 10.62 | 20.17 | 20.17 | 19.9 | 0 | 0 |
| GET /api/users | 9 | 498.9 | 498.9 | 3.63 | 5.02 | 5.02 | 4.89 | 0 | 0 |
| POST /api/users | 9 | 506.88 | 506.88 | 3.13 | 6.06 | 6.06 | 5.97 | 0 | 0 |
| GET /api/jobs | 9 | 597.15 | 597.15 | 2.6 | 5.75 | 5.75 | 5.54 | 0 | 0 |
| POST /api/jobs | 9 | 451.34 | 451.34 | 3.73 | 7.96 | 7.96 | 7.85 | 0 | 0 |
| GET /api/proposals | 9 | 554.71 | 554.71 | 3.35 | 6.25 | 6.25 | 6.12 | 0 | 0 |
| POST /api/proposals | 9 | 579.64 | 579.64 | 2.46 | 6.09 | 6.09 | 5.88 | 0 | 0 |
| POST /api/payments | 9 | 532.97 | 532.97 | 2.81 | 6.13 | 6.13 | 5.79 | 0 | 0 |
| GET /api/reviews | 9 | 631.69 | 631.69 | 2.25 | 5.79 | 5.79 | 5.59 | 0 | 0 |
| POST /api/reviews | 9 | 550.36 | 550.36 | 3.04 | 5.75 | 5.75 | 5.63 | 0 | 0 |
| GET /api/messages | 9 | 602.27 | 602.27 | 2.6 | 5.45 | 5.45 | 5.36 | 0 | 0 |
| POST /api/messages | 9 | 500.93 | 500.93 | 3.53 | 5.4 | 5.4 | 5.23 | 0 | 0 |
| GET /api/notifications | 9 | 550.83 | 550.83 | 3.1 | 6.8 | 6.8 | 6.61 | 0 | 0 |
| POST /api/notifications | 9 | 539.62 | 539.62 | 3.31 | 5.78 | 5.78 | 5.49 | 0 | 0 |
| POST /api/uploads | 9 | 178.18 | 178.18 | 9.85 | 16.23 | 16.23 | 16.09 | 0 | 0 |
| GET /api/search?q=benchmark | 9 | 453.51 | 453.51 | 2.77 | 8.47 | 8.47 | 8.21 | 0 | 0 |
| GET /api/admin/metrics | 9 | 334.22 | 334.22 | 4.2 | 10.46 | 10.46 | 10.37 | 0 | 0 |

## Threshold Failures

- None
