# API Benchmark Report

- Generated: 2026-05-20T11:46:14.777Z
- Mode: full
- Target: http://127.0.0.1:40615
- Requests: 105
- Total error rate: 0%
- Max p99 latency: 32.07ms

## Environment

- Node.js: v26.1.0
- Platform: Linux 7.0.9-arch1-1 x64
- CPU: Intel(R) Core(TM) Ultra 5 226V
- Logical CPUs: 8
- Memory: 15531MB total, 10325MB free at start
- Network: loopback when BENCHMARK_TARGET_URL is unset

## Endpoint Metrics

| Endpoint | Method | Path | Requests | p50 ms | p95 ms | p99 ms | p95 TTFB ms | Sustained RPS | Peak RPS | Error Rate |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| health | GET | `/health` | 5 | 4.18 | 32.07 | 32.07 | 31.32 | 134.89 | 134.89 | 0% |
| auth-register | POST | `/api/auth/register` | 5 | 3.3 | 8.3 | 8.3 | 8.21 | 394.34 | 394.34 | 0% |
| auth-login | POST | `/api/auth/login` | 5 | 2.03 | 2.45 | 2.45 | 2.38 | 786.8 | 786.8 | 0% |
| auth-oauth-callback | GET | `/api/auth/oauth/github/callback` | 5 | 1.35 | 1.67 | 1.67 | 1.62 | 1303.64 | 1303.64 | 0% |
| auth-refresh | POST | `/api/auth/refresh` | 5 | 1.3 | 1.45 | 1.45 | 1.4 | 1437.18 | 1437.18 | 0% |
| users-list | GET | `/api/users` | 5 | 1.05 | 1.3 | 1.3 | 1.25 | 1640.77 | 1640.77 | 0% |
| users-create | POST | `/api/users` | 5 | 1.29 | 1.6 | 1.6 | 1.54 | 1403.61 | 1403.61 | 0% |
| jobs-list | GET | `/api/jobs` | 5 | 0.89 | 1.02 | 1.02 | 0.98 | 2019.54 | 2019.54 | 0% |
| jobs-create | POST | `/api/jobs` | 5 | 1.41 | 1.72 | 1.72 | 1.66 | 1119.55 | 1119.55 | 0% |
| proposals-list | GET | `/api/proposals` | 5 | 1.03 | 1.08 | 1.08 | 1.04 | 1910.47 | 1910.47 | 0% |
| proposals-create | POST | `/api/proposals` | 5 | 1.06 | 1.28 | 1.28 | 1.25 | 1690.64 | 1690.64 | 0% |
| payments-create | POST | `/api/payments` | 5 | 1.18 | 1.38 | 1.38 | 1.33 | 1590.02 | 1590.02 | 0% |
| reviews-list | GET | `/api/reviews` | 5 | 0.91 | 1 | 1 | 0.95 | 1923.12 | 1923.12 | 0% |
| reviews-create | POST | `/api/reviews` | 5 | 1.67 | 1.7 | 1.7 | 1.65 | 1223.03 | 1223.03 | 0% |
| messages-list | GET | `/api/messages` | 5 | 0.85 | 1.09 | 1.09 | 1.03 | 2119.93 | 2119.93 | 0% |
| messages-create | POST | `/api/messages` | 5 | 1.07 | 1.31 | 1.31 | 1.28 | 1693.47 | 1693.47 | 0% |
| notifications-list | GET | `/api/notifications` | 5 | 0.99 | 2.15 | 2.15 | 2.11 | 1379.91 | 1379.91 | 0% |
| notifications-create | POST | `/api/notifications` | 5 | 1.06 | 1.46 | 1.46 | 1.43 | 1622.52 | 1622.52 | 0% |
| uploads-create | POST | `/api/uploads` | 5 | 1.88 | 5.1 | 5.1 | 5.05 | 575.85 | 575.85 | 0% |
| search | GET | `/api/search?q=performance%20engineer` | 5 | 0.93 | 1.69 | 1.69 | 1.65 | 1561.16 | 1561.16 | 0% |
| admin-metrics | GET | `/api/admin/metrics` | 5 | 1.36 | 1.94 | 1.94 | 1.9 | 1272.14 | 1272.14 | 0% |

## Threshold Violations

None
