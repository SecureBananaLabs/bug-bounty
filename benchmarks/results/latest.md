# API Benchmark Summary

Mode: smoke
Target: local Express app
Generated: 2026-05-27T08:23:05.133Z
Iterations per endpoint: 3
Concurrency per endpoint: 1

| Endpoint | Method | Requests | Error % | Sustained RPS | p50 | p95 | p99 | TTFB p95 | Gate |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| health | GET /health | 3 | 0 | 174.67 | 1.35 ms | 15.13 ms | 15.13 ms | 14.67 ms | pass |
| auth register | POST /api/auth/register | 3 | 0 | 425.88 | 0.84 ms | 5.54 ms | 5.54 ms | 5.48 ms | pass |
| auth login | POST /api/auth/login | 3 | 0 | 1850.57 | 0.51 ms | 0.58 ms | 0.58 ms | 0.54 ms | pass |
| auth oauth callback | GET /api/auth/oauth/github/callback | 3 | 0 | 2566.93 | 0.34 ms | 0.53 ms | 0.53 ms | 0.5 ms | pass |
| auth refresh | POST /api/auth/refresh | 3 | 0 | 2546.33 | 0.4 ms | 0.4 ms | 0.4 ms | 0.37 ms | pass |
| users list | GET /api/users | 3 | 0 | 3000 | 0.3 ms | 0.31 ms | 0.31 ms | 0.29 ms | pass |
| users create | POST /api/users | 3 | 0 | 2578.89 | 0.37 ms | 0.45 ms | 0.45 ms | 0.42 ms | pass |
| jobs list | GET /api/jobs | 3 | 0 | 3000 | 0.27 ms | 0.29 ms | 0.29 ms | 0.26 ms | pass |
| jobs create | POST /api/jobs | 3 | 0 | 2482.67 | 0.36 ms | 0.48 ms | 0.48 ms | 0.45 ms | pass |
| proposals list | GET /api/proposals | 3 | 0 | 3000 | 0.19 ms | 0.23 ms | 0.23 ms | 0.21 ms | pass |
| proposals create | POST /api/proposals | 3 | 0 | 2769.12 | 0.36 ms | 0.39 ms | 0.39 ms | 0.37 ms | pass |
| payments create | POST /api/payments | 3 | 0 | 3000 | 0.31 ms | 0.33 ms | 0.33 ms | 0.31 ms | pass |
| reviews list | GET /api/reviews | 3 | 0 | 3000 | 0.2 ms | 0.25 ms | 0.25 ms | 0.23 ms | pass |
| reviews create | POST /api/reviews | 3 | 0 | 3000 | 0.25 ms | 0.25 ms | 0.25 ms | 0.23 ms | pass |
| messages list | GET /api/messages | 3 | 0 | 3000 | 0.2 ms | 0.21 ms | 0.21 ms | 0.2 ms | pass |
| messages create | POST /api/messages | 3 | 0 | 2215.25 | 0.41 ms | 0.63 ms | 0.63 ms | 0.61 ms | pass |
| notifications list | GET /api/notifications | 3 | 0 | 3000 | 0.22 ms | 0.22 ms | 0.22 ms | 0.21 ms | pass |
| notifications create | POST /api/notifications | 3 | 0 | 3000 | 0.26 ms | 0.26 ms | 0.26 ms | 0.24 ms | pass |
| uploads create | POST /api/uploads | 3 | 0 | 931.33 | 0.5 ms | 2.09 ms | 2.09 ms | 2.07 ms | pass |
| search query | GET /api/search?q=freelance | 3 | 0 | 3000 | 0.24 ms | 0.52 ms | 0.52 ms | 0.5 ms | pass |
| admin metrics | GET /api/admin/metrics | 3 | 0 | 2732.86 | 0.28 ms | 0.55 ms | 0.55 ms | 0.53 ms | pass |
