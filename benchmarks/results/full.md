# API Benchmark Summary

Generated: 2026-05-22T12:54:04.229Z
Mode: `full`
Target: `local app`

## Results

| Gate | Endpoint | Status | p50 | p95 | p99 | p95 TTFB | RPS | Error Rate | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| pass | GET /health | 200 | 2 ms | 4 ms | 4 ms | 4 ms | 462.65 | 0% | - |
| pass | POST /api/auth/register | 201 | 3 ms | 3 ms | 3 ms | 3 ms | 351.4 | 0% | - |
| pass | POST /api/auth/login | 200 | 3 ms | 3 ms | 3 ms | 3 ms | 350.66 | 0% | - |
| pass | GET /api/auth/oauth/github/callback | 200 | 2 ms | 2 ms | 2 ms | 2 ms | 572.1 | 0% | - |
| pass | POST /api/auth/refresh | 200 | 2 ms | 3 ms | 3 ms | 3 ms | 421.86 | 0% | - |
| pass | GET /api/users | 200 | 1 ms | 1 ms | 1 ms | 1 ms | 887.78 | 0% | - |
| pass | POST /api/users | 201 | 1 ms | 2 ms | 2 ms | 2 ms | 687.35 | 0% | - |
| pass | GET /api/jobs | 200 | 1 ms | 1 ms | 1 ms | 1 ms | 1233.68 | 0% | - |
| pass | POST /api/jobs | 201 | 1 ms | 2 ms | 2 ms | 2 ms | 710.39 | 0% | - |
| pass | GET /api/proposals | 200 | 1 ms | 1 ms | 1 ms | 1 ms | 1317.28 | 0% | - |
| pass | POST /api/proposals | 201 | 1 ms | 1 ms | 1 ms | 1 ms | 1010.51 | 0% | - |
| pass | POST /api/payments | 201 | 1 ms | 1 ms | 1 ms | 1 ms | 950.68 | 0% | - |
| pass | GET /api/reviews | 200 | 1 ms | 1 ms | 1 ms | 1 ms | 1334.97 | 0% | - |
| pass | POST /api/reviews | 201 | 1 ms | 2 ms | 2 ms | 2 ms | 813.7 | 0% | - |
| pass | GET /api/messages | 200 | 1 ms | 1 ms | 1 ms | 1 ms | 1342.1 | 0% | - |
| pass | POST /api/messages | 201 | 1 ms | 1 ms | 1 ms | 1 ms | 1139.03 | 0% | - |
| pass | GET /api/notifications | 200 | 1 ms | 1 ms | 1 ms | 1 ms | 1514.46 | 0% | - |
| pass | POST /api/notifications | 201 | 1 ms | 1 ms | 1 ms | 1 ms | 1060.63 | 0% | - |
| pass | POST /api/uploads | 201 | 2 ms | 6 ms | 6 ms | 6 ms | 402.18 | 0% | - |
| pass | GET /api/search?q=benchmark | 200 | 1 ms | 2 ms | 2 ms | 1 ms | 1110.52 | 0% | - |
| pass | GET /api/admin/metrics | 200 | 2 ms | 2 ms | 2 ms | 2 ms | 631.58 | 0% | - |

## Benchmark Environment

- Node.js: v20.20.2
- Platform: win32 x64
- CPU: 13th Gen Intel(R) Core(TM) i5-13500H
- Cores: 16
- Total memory: 16088 MB

Synthetic payloads only. No production data, secrets, payment credentials, or live external APIs are used.
