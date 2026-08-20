# API Benchmark Report

Generated: 2026-05-30T09:57:24.625Z
Mode: full
Target: http://127.0.0.1:48047
Started in-process: yes
Duration per endpoint: 3s
Concurrency: 4
Max requests per endpoint: 6

## Summary

- Endpoints covered: 21
- Total samples: 126
- Aggregate RPS: 42
- Peak RPS sum: 126
- Error rate: 0%

## Endpoints

| Group | Method | Path | Samples | Elapsed s | RPS | Peak RPS | p50 ms | p95 ms | p99 ms | TTFB p95 ms | Error % | Statuses |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| health | GET | `/health` | 6 | 0.011 | 2 | 6 | 7.091 | 7.841 | 7.841 | 7.718 | 0% | 200:6 |
| auth | POST | `/api/auth/register` | 6 | 0.009 | 2 | 6 | 5.051 | 6.448 | 6.448 | 6.393 | 0% | 201:6 |
| auth | POST | `/api/auth/login` | 6 | 0.005 | 2 | 6 | 2.632 | 3.24 | 3.24 | 3.192 | 0% | 200:6 |
| auth | GET | `/api/auth/oauth/github/callback?code=benchmark-code` | 6 | 0.004 | 2 | 6 | 1.863 | 2.286 | 2.286 | 2.223 | 0% | 200:6 |
| auth | POST | `/api/auth/refresh` | 6 | 0.004 | 2 | 6 | 2.336 | 2.913 | 2.913 | 2.852 | 0% | 200:6 |
| users | GET | `/api/users` | 6 | 0.003 | 2 | 6 | 1.234 | 1.644 | 1.644 | 1.599 | 0% | 200:6 |
| users | POST | `/api/users` | 6 | 0.005 | 2 | 6 | 2.284 | 3.124 | 3.124 | 3.081 | 0% | 201:6 |
| jobs | GET | `/api/jobs` | 6 | 0.003 | 2 | 6 | 1.23 | 1.616 | 1.616 | 1.576 | 0% | 200:6 |
| jobs | POST | `/api/jobs` | 6 | 0.003 | 2 | 6 | 1.742 | 2.236 | 2.236 | 2.197 | 0% | 201:6 |
| proposals | GET | `/api/proposals` | 6 | 0.002 | 2 | 6 | 1.169 | 1.528 | 1.528 | 1.49 | 0% | 200:6 |
| proposals | POST | `/api/proposals` | 6 | 0.003 | 2 | 6 | 1.656 | 2.193 | 2.193 | 2.151 | 0% | 201:6 |
| payments | POST | `/api/payments` | 6 | 0.003 | 2 | 6 | 1.567 | 2.151 | 2.151 | 2.112 | 0% | 201:6 |
| reviews | GET | `/api/reviews` | 6 | 0.004 | 2 | 6 | 1.603 | 2.16 | 2.16 | 2.103 | 0% | 200:6 |
| reviews | POST | `/api/reviews` | 6 | 0.003 | 2 | 6 | 1.753 | 2.371 | 2.371 | 2.333 | 0% | 201:6 |
| messages | GET | `/api/messages` | 6 | 0.002 | 2 | 6 | 1.189 | 1.542 | 1.542 | 1.488 | 0% | 200:6 |
| messages | POST | `/api/messages` | 6 | 0.003 | 2 | 6 | 1.589 | 2.101 | 2.101 | 2.064 | 0% | 201:6 |
| notifications | GET | `/api/notifications` | 6 | 0.002 | 2 | 6 | 1.112 | 1.508 | 1.508 | 1.465 | 0% | 200:6 |
| notifications | POST | `/api/notifications` | 6 | 0.003 | 2 | 6 | 1.442 | 1.977 | 1.977 | 1.941 | 0% | 201:6 |
| uploads | POST | `/api/uploads` | 6 | 0.007 | 2 | 6 | 3.857 | 4.467 | 4.467 | 4.423 | 0% | 201:6 |
| search | GET | `/api/search?q=benchmark` | 6 | 0.003 | 2 | 6 | 1.293 | 1.688 | 1.688 | 1.649 | 0% | 200:6 |
| admin | GET | `/api/admin/metrics` | 6 | 0.003 | 2 | 6 | 1.765 | 2.101 | 2.101 | 2.06 | 0% | 200:6 |

## Thresholds

All active thresholds passed.

## Environment

- Platform: Windows_NT 10.0.26200 x64
- CPU count: 16
- CPU model: AMD Ryzen 7 5800X 8-Core Processor
- Total memory: 15.93 GiB
- Free memory at start: 6.43 GiB
- Node.js: v24.15.0
