# API Benchmark Summary

- Run ID: bench_1780239027334
- Mode: default
- Target: http://127.0.0.1:60202
- Started: 2026-05-31T14:50:27.418Z
- Completed: 2026-05-31T14:50:27.500Z
- Requests per endpoint: 8
- Concurrency: 2
- Threshold status: passed

## Environment

- Platform: Darwin 25.3.0 arm64
- CPU: Apple M1
- Logical cores: 8
- Memory: 8192 MiB total, 379 MiB free at run start
- Node: v22.22.0

## Endpoint Results

| Endpoint | Requests | Error % | p50 ms | p95 ms | p99 ms | TTFB p95 ms | Sustained RPS | Peak RPS | Statuses |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| GET /health | 8 | 0 | 1.58 | 11.03 | 11.03 | 10.98 | 466.32 | 8 | {"200":8} |
| POST /api/auth/register | 8 | 0 | 1.08 | 6.46 | 6.46 | 6.31 | 735.6 | 8 | {"201":8} |
| POST /api/auth/login | 8 | 0 | 0.67 | 1.31 | 1.31 | 1.28 | 2230.98 | 8 | {"200":8} |
| GET /api/auth/oauth/google/callback | 8 | 0 | 0.46 | 0.62 | 0.62 | 0.6 | 3803.04 | 8 | {"200":8} |
| POST /api/auth/refresh | 8 | 0 | 0.58 | 0.69 | 0.69 | 0.67 | 3176.13 | 8 | {"200":8} |
| GET /api/users | 8 | 0 | 0.45 | 0.53 | 0.53 | 0.51 | 4083.63 | 8 | {"200":8} |
| POST /api/users | 8 | 0 | 0.49 | 0.56 | 0.56 | 0.54 | 3691.03 | 8 | {"201":8} |
| GET /api/jobs | 8 | 0 | 0.55 | 1.14 | 1.14 | 1.12 | 2871.97 | 8 | {"200":8} |
| POST /api/jobs | 8 | 0 | 0.57 | 0.94 | 0.94 | 0.91 | 2811.91 | 8 | {"201":8} |
| GET /api/proposals | 8 | 0 | 0.43 | 0.84 | 0.84 | 0.82 | 3674.43 | 8 | {"200":8} |
| POST /api/proposals | 8 | 0 | 0.49 | 0.53 | 0.53 | 0.51 | 3746.41 | 8 | {"201":8} |
| POST /api/payments | 8 | 0 | 0.49 | 0.66 | 0.66 | 0.64 | 3526.3 | 8 | {"201":8} |
| GET /api/reviews | 8 | 0 | 0.5 | 0.69 | 0.69 | 0.66 | 3498.22 | 8 | {"200":8} |
| POST /api/reviews | 8 | 0 | 0.61 | 0.78 | 0.78 | 0.75 | 2857.02 | 8 | {"201":8} |
| GET /api/messages | 8 | 0 | 0.51 | 0.8 | 0.8 | 0.78 | 3367.42 | 8 | {"200":8} |
| POST /api/messages | 8 | 0 | 0.53 | 0.59 | 0.59 | 0.57 | 3479.71 | 8 | {"201":8} |
| GET /api/notifications | 8 | 0 | 0.48 | 0.54 | 0.54 | 0.52 | 3965.39 | 8 | {"200":8} |
| POST /api/notifications | 8 | 0 | 0.67 | 1.14 | 1.14 | 1.11 | 2432.97 | 8 | {"201":8} |
| POST /api/uploads | 8 | 0 | 1.06 | 3.5 | 3.5 | 3.48 | 1008.98 | 8 | {"201":8} |
| GET /api/search?q=marketplace%20payments%20review | 8 | 0 | 0.65 | 1.27 | 1.27 | 1.25 | 2522 | 8 | {"200":8} |
| GET /api/admin/metrics | 8 | 0 | 0.54 | 1.14 | 1.14 | 1.12 | 2786 | 8 | {"200":8} |

