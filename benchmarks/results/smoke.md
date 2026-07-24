# API Benchmark Summary

Generated: 2026-05-22T12:54:04.091Z
Mode: `smoke`
Target: `local app`

## Results

| Gate | Endpoint | Status | p50 | p95 | p99 | p95 TTFB | RPS | Error Rate | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| pass | GET /health | 200 | 2 ms | 4 ms | 4 ms | 4 ms | 324.26 | 0% | - |
| pass | POST /api/auth/register | 201 | 3 ms | 4 ms | 4 ms | 3 ms | 328.28 | 0% | - |
| pass | POST /api/auth/login | 200 | 2 ms | 3 ms | 3 ms | 2 ms | 401.47 | 0% | - |
| pass | GET /api/auth/oauth/github/callback | 200 | 1 ms | 2 ms | 2 ms | 1 ms | 653.1 | 0% | - |
| pass | POST /api/auth/refresh | 200 | 2 ms | 2 ms | 2 ms | 2 ms | 454.09 | 0% | - |
| pass | GET /api/users | 200 | 1 ms | 1 ms | 1 ms | 1 ms | 762.81 | 0% | - |
| pass | POST /api/users | 201 | 2 ms | 2 ms | 2 ms | 2 ms | 558.04 | 0% | - |
| pass | GET /api/jobs | 200 | 1 ms | 1 ms | 1 ms | 1 ms | 875.7 | 0% | - |
| pass | POST /api/jobs | 201 | 2 ms | 2 ms | 2 ms | 2 ms | 598.69 | 0% | - |
| pass | GET /api/proposals | 200 | 2 ms | 3 ms | 3 ms | 2 ms | 425.43 | 0% | - |
| pass | POST /api/proposals | 201 | 1 ms | 1 ms | 1 ms | 1 ms | 691.8 | 0% | - |
| pass | POST /api/payments | 201 | 1 ms | 1 ms | 1 ms | 1 ms | 752.56 | 0% | - |
| pass | GET /api/reviews | 200 | 1 ms | 1 ms | 1 ms | 1 ms | 1111.36 | 0% | - |
| pass | POST /api/reviews | 201 | 1 ms | 2 ms | 2 ms | 2 ms | 538.5 | 0% | - |
| pass | GET /api/messages | 200 | 1 ms | 1 ms | 1 ms | 1 ms | 1117.63 | 0% | - |
| pass | POST /api/messages | 201 | 1 ms | 1 ms | 1 ms | 1 ms | 853.39 | 0% | - |
| pass | GET /api/notifications | 200 | 1 ms | 2 ms | 2 ms | 1 ms | 783.15 | 0% | - |
| pass | POST /api/notifications | 201 | 1 ms | 1 ms | 1 ms | 1 ms | 770.86 | 0% | - |
| pass | POST /api/uploads | 201 | 2 ms | 6 ms | 6 ms | 6 ms | 243.97 | 0% | - |
| pass | GET /api/search?q=benchmark | 200 | 1 ms | 2 ms | 2 ms | 2 ms | 670.35 | 0% | - |
| pass | GET /api/admin/metrics | 200 | 2 ms | 2 ms | 2 ms | 2 ms | 504.08 | 0% | - |

## Benchmark Environment

- Node.js: v20.20.2
- Platform: win32 x64
- CPU: 13th Gen Intel(R) Core(TM) i5-13500H
- Cores: 16
- Total memory: 16088 MB

Synthetic payloads only. No production data, secrets, payment credentials, or live external APIs are used.
