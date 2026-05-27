# API Benchmark Summary

Mode: smoke
Target: local Express app
Generated: 2026-05-27T03:36:36.599Z
Iterations per endpoint: 3
Concurrency per endpoint: 1

| Endpoint | Method | Requests | Error % | Sustained RPS | p50 | p95 | p99 | TTFB p95 | Gate |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| health | GET /health | 3 | 0 | 173.57 | 1.19 ms | 15.42 ms | 15.42 ms | 15 ms | pass |
| auth register | POST /api/auth/register | 3 | 0 | 513.67 | 0.85 ms | 4.32 ms | 4.32 ms | 4.26 ms | pass |
| auth login | POST /api/auth/login | 3 | 0 | 1803.2 | 0.52 ms | 0.59 ms | 0.59 ms | 0.55 ms | pass |
| auth oauth callback | GET /api/auth/oauth/github/callback | 3 | 0 | 2537 | 0.34 ms | 0.54 ms | 0.54 ms | 0.5 ms | pass |
| auth refresh | POST /api/auth/refresh | 3 | 0 | 2515.2 | 0.39 ms | 0.41 ms | 0.41 ms | 0.38 ms | pass |
| users list | GET /api/users | 3 | 0 | 3000 | 0.22 ms | 0.24 ms | 0.24 ms | 0.22 ms | pass |
| users create | POST /api/users | 3 | 0 | 2883.58 | 0.35 ms | 0.37 ms | 0.37 ms | 0.35 ms | pass |
| jobs list | GET /api/jobs | 3 | 0 | 3000 | 0.28 ms | 0.29 ms | 0.29 ms | 0.26 ms | pass |
| jobs create | POST /api/jobs | 3 | 0 | 2627.45 | 0.34 ms | 0.49 ms | 0.49 ms | 0.46 ms | pass |
| proposals list | GET /api/proposals | 3 | 0 | 3000 | 0.2 ms | 0.21 ms | 0.21 ms | 0.19 ms | pass |
| proposals create | POST /api/proposals | 3 | 0 | 3000 | 0.29 ms | 0.31 ms | 0.31 ms | 0.29 ms | pass |
| payments create | POST /api/payments | 3 | 0 | 3000 | 0.25 ms | 0.27 ms | 0.27 ms | 0.24 ms | pass |
| reviews list | GET /api/reviews | 3 | 0 | 3000 | 0.23 ms | 0.23 ms | 0.23 ms | 0.21 ms | pass |
| reviews create | POST /api/reviews | 3 | 0 | 3000 | 0.25 ms | 0.25 ms | 0.25 ms | 0.23 ms | pass |
| messages list | GET /api/messages | 3 | 0 | 3000 | 0.21 ms | 0.22 ms | 0.22 ms | 0.2 ms | pass |
| messages create | POST /api/messages | 3 | 0 | 2116.28 | 0.4 ms | 0.66 ms | 0.66 ms | 0.63 ms | pass |
| notifications list | GET /api/notifications | 3 | 0 | 3000 | 0.21 ms | 0.22 ms | 0.22 ms | 0.2 ms | pass |
| notifications create | POST /api/notifications | 3 | 0 | 3000 | 0.24 ms | 0.25 ms | 0.25 ms | 0.23 ms | pass |
| uploads create | POST /api/uploads | 3 | 0 | 976.06 | 0.48 ms | 1.98 ms | 1.98 ms | 1.96 ms | pass |
| search query | GET /api/search?q=freelance | 3 | 0 | 3000 | 0.24 ms | 0.52 ms | 0.52 ms | 0.5 ms | pass |
| admin metrics | GET /api/admin/metrics | 3 | 0 | 2700.37 | 0.28 ms | 0.55 ms | 0.55 ms | 0.53 ms | pass |
