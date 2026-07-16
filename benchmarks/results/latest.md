# API Benchmark Report

- Generated: 2026-06-01T06:59:18.158Z
- Mode: full
- Target: local
- Endpoints: 21
- Requests per endpoint: 5
- Concurrency: 2
- Duration: 78.43 ms
- Runtime: Node.js v26.0.0
- OS: Darwin 25.5.0 arm64
- CPU: Apple M4 Pro (12 logical cores)
- Total memory: 24576 MB
- Free memory at start: 889 MB

## Results

Endpoint | Requests | p50 ms | p95 ms | p99 ms | TTFB p95 ms | Sustained RPS | Peak RPS | Error % | Statuses
--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---
GET /health | 5 | 2.98 | 28.06 | 28.06 | 27.39 | 158.27 | 5 | 0 | `{"200":5}`
POST /api/auth/register | 5 | 2.58 | 6.31 | 6.31 | 6.25 | 516.54 | 5 | 0 | `{"201":5}`
POST /api/auth/login | 5 | 1.06 | 1.35 | 1.35 | 1.32 | 1736.59 | 5 | 0 | `{"200":5}`
GET /api/auth/oauth/github/callback | 5 | 0.72 | 0.85 | 0.85 | 0.82 | 2503.91 | 5 | 0 | `{"200":5}`
POST /api/auth/refresh | 5 | 0.81 | 0.9 | 0.9 | 0.86 | 2397.7 | 5 | 0 | `{"200":5}`
GET /api/users | 5 | 0.67 | 0.81 | 0.81 | 0.75 | 2703.68 | 5 | 0 | `{"200":5}`
POST /api/users | 5 | 0.57 | 0.73 | 0.73 | 0.7 | 3054.13 | 5 | 0 | `{"201":5}`
GET /api/jobs | 5 | 0.39 | 0.48 | 0.48 | 0.46 | 4286.63 | 5 | 0 | `{"200":5}`
POST /api/jobs | 5 | 0.88 | 1.14 | 1.14 | 1.11 | 1863.35 | 5 | 0 | `{"201":5}`
GET /api/proposals | 5 | 0.53 | 2.06 | 2.06 | 2.04 | 1719 | 5 | 0 | `{"200":5}`
POST /api/proposals | 5 | 0.56 | 0.75 | 0.75 | 0.72 | 3134.71 | 5 | 0 | `{"201":5}`
POST /api/payments | 5 | 0.61 | 0.63 | 0.63 | 0.61 | 3357.68 | 5 | 0 | `{"201":5}`
GET /api/reviews | 5 | 0.35 | 0.42 | 0.42 | 0.41 | 5157.74 | 5 | 0 | `{"200":5}`
POST /api/reviews | 5 | 0.55 | 0.78 | 0.78 | 0.75 | 3258.92 | 5 | 0 | `{"201":5}`
GET /api/messages | 5 | 0.4 | 0.45 | 0.45 | 0.42 | 4374.3 | 5 | 0 | `{"200":5}`
POST /api/messages | 5 | 0.51 | 0.78 | 0.78 | 0.76 | 3245.7 | 5 | 0 | `{"201":5}`
GET /api/notifications | 5 | 0.41 | 1.08 | 1.08 | 1.06 | 2906.13 | 5 | 0 | `{"200":5}`
POST /api/notifications | 5 | 0.49 | 0.64 | 0.64 | 0.62 | 3687.77 | 5 | 0 | `{"201":5}`
POST /api/uploads | 5 | 0.98 | 3.39 | 3.39 | 3.36 | 960.28 | 5 | 0 | `{"201":5}`
GET /api/search | 5 | 0.44 | 0.8 | 0.8 | 0.78 | 3385.14 | 5 | 0 | `{"200":5}`
GET /api/admin/metrics | 5 | 0.47 | 0.91 | 0.91 | 0.89 | 3080.16 | 5 | 0 | `{"200":5}`

## Thresholds

No threshold failures.
