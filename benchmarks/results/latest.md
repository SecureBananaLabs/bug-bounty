# API Benchmark Summary

- Mode: full
- Target: local ephemeral Express server
- Started: 2026-05-19T01:46:53.321Z
- Requests per endpoint: 6
- Concurrency: 4
- Thresholds: p99 <= 1500ms, error rate <= 0.05

## Environment

- CPU: Apple M2
- Logical cores: 8
- Total memory: 8 GiB
- Free memory at start: 106 MiB
- Platform: darwin 25.4.0 arm64
- Node.js: v24.14.1

## Results

| Endpoint | p50 | p95 | p99 | TTFB p95 | Sustained RPS | Peak RPS | Error Rate | Status |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| POST /api/auth/register | 19.35ms | 28.12ms | 28.12ms | 27.73ms | 182.58 | 6 | 0 | PASS |
| POST /api/auth/login | 3ms | 3.3ms | 3.3ms | 3.25ms | 1201.52 | 6 | 0 | PASS |
| GET /api/auth/oauth/github/callback | 1.21ms | 1.39ms | 1.39ms | 1.35ms | 2769.71 | 6 | 0 | PASS |
| POST /api/auth/refresh | 1.33ms | 1.71ms | 1.71ms | 1.68ms | 2374 | 6 | 0 | PASS |
| GET /api/users | 0.89ms | 1.18ms | 1.18ms | 1.15ms | 3455.23 | 6 | 0 | PASS |
| POST /api/users | 1.23ms | 1.66ms | 1.66ms | 1.63ms | 2554.64 | 6 | 0 | PASS |
| GET /api/jobs | 0.76ms | 0.96ms | 0.96ms | 0.94ms | 4055.65 | 6 | 0 | PASS |
| POST /api/jobs | 1.42ms | 1.61ms | 1.61ms | 1.58ms | 1940.65 | 6 | 0 | PASS |
| GET /api/proposals | 0.76ms | 0.94ms | 0.94ms | 0.92ms | 4211.88 | 6 | 0 | PASS |
| POST /api/proposals | 0.9ms | 1.19ms | 1.19ms | 1.17ms | 3424.09 | 6 | 0 | PASS |
| POST /api/payments | 0.87ms | 1.12ms | 1.12ms | 1.1ms | 3692.88 | 6 | 0 | PASS |
| GET /api/reviews | 0.64ms | 0.81ms | 0.81ms | 0.79ms | 4500.85 | 6 | 0 | PASS |
| POST /api/reviews | 0.79ms | 1.02ms | 1.02ms | 1ms | 4042.67 | 6 | 0 | PASS |
| GET /api/messages | 0.74ms | 0.84ms | 0.84ms | 0.82ms | 4261.61 | 6 | 0 | PASS |
| POST /api/messages | 0.89ms | 1.16ms | 1.16ms | 1.13ms | 3201.92 | 6 | 0 | PASS |
| GET /api/notifications | 1.55ms | 1.79ms | 1.79ms | 1.75ms | 2490.14 | 6 | 0 | PASS |
| POST /api/notifications | 1ms | 1.23ms | 1.23ms | 1.21ms | 3295.12 | 6 | 0 | PASS |
| POST /api/uploads | 4.34ms | 4.64ms | 4.64ms | 4.6ms | 984.46 | 6 | 0 | PASS |
| GET /api/search?q=benchmark | 1.17ms | 1.35ms | 1.35ms | 1.33ms | 3184.64 | 6 | 0 | PASS |
| GET /api/admin/metrics | 1.43ms | 1.64ms | 1.64ms | 1.6ms | 2632.3 | 6 | 0 | PASS |

Overall: PASS

