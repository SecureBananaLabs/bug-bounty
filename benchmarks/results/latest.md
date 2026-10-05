# API Benchmark Summary

- Generated: 2026-06-17T04:37:14.024Z
- Target: `http://127.0.0.1:64541`
- Local server: yes
- Iterations per endpoint: 8
- Concurrency: 4
- Warmup requests per endpoint: 1
- Total measured requests: 168
- Total error rate: 0%
- Node: v25.8.1
- Platform: darwin arm64
- CPU count: 10

| Endpoint | Route | Requests | p50 ms | p95 ms | p99 ms | p95 TTFB ms | Sustained RPS | Error % | Status codes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
health | `GET /health` | 8 | 0.95 | 2.45 | 2.45 | 2.43 | 2841.08 | 0 | 200: 8
auth-register | `POST /api/auth/register` | 8 | 0.89 | 1.5 | 1.5 | 1.49 | 3303.51 | 0 | 201: 8
auth-login | `POST /api/auth/login` | 8 | 0.76 | 0.85 | 0.85 | 0.82 | 4852.41 | 0 | 200: 8
auth-oauth-callback | `GET /api/auth/oauth/github/callback` | 8 | 0.41 | 0.59 | 0.59 | 0.58 | 8109.48 | 0 | 200: 8
auth-refresh | `POST /api/auth/refresh` | 8 | 0.54 | 0.61 | 0.61 | 0.6 | 6509.36 | 0 | 200: 8
users-list | `GET /api/users` | 8 | 0.38 | 0.55 | 0.55 | 0.54 | 8753.14 | 0 | 200: 8
users-create | `POST /api/users` | 8 | 0.44 | 0.56 | 0.56 | 0.55 | 7919.16 | 0 | 201: 8
jobs-list | `GET /api/jobs` | 8 | 0.36 | 0.46 | 0.46 | 0.45 | 9645.33 | 0 | 200: 8
jobs-create | `POST /api/jobs` | 8 | 0.5 | 0.78 | 0.78 | 0.77 | 6085.77 | 0 | 201: 8
proposals-list | `GET /api/proposals` | 8 | 0.35 | 0.54 | 0.54 | 0.53 | 9138.07 | 0 | 200: 8
proposals-create | `POST /api/proposals` | 8 | 0.35 | 0.45 | 0.45 | 0.44 | 9930.18 | 0 | 201: 8
payments-create | `POST /api/payments` | 8 | 0.39 | 0.48 | 0.48 | 0.47 | 8896.3 | 0 | 201: 8
reviews-list | `GET /api/reviews` | 8 | 0.32 | 0.59 | 0.59 | 0.58 | 8118.74 | 0 | 200: 8
reviews-create | `POST /api/reviews` | 8 | 0.45 | 0.51 | 0.51 | 0.48 | 7806.14 | 0 | 201: 8
messages-list | `GET /api/messages` | 8 | 0.34 | 0.47 | 0.47 | 0.46 | 9864.88 | 0 | 200: 8
messages-create | `POST /api/messages` | 8 | 0.41 | 0.47 | 0.47 | 0.46 | 8876.56 | 0 | 201: 8
notifications-list | `GET /api/notifications` | 8 | 0.37 | 0.55 | 0.55 | 0.54 | 8352.55 | 0 | 200: 8
notifications-create | `POST /api/notifications` | 8 | 0.36 | 0.57 | 0.57 | 0.56 | 8300.55 | 0 | 201: 8
uploads-create | `POST /api/uploads` | 8 | 0.73 | 0.89 | 0.89 | 0.88 | 4891.1 | 0 | 201: 8
search-global | `GET /api/search?q=api%20benchmark` | 8 | 0.37 | 0.46 | 0.46 | 0.45 | 9366.77 | 0 | 200: 8
admin-metrics | `GET /api/admin/metrics` | 8 | 0.61 | 0.99 | 0.99 | 0.98 | 5047.85 | 0 | 200: 8
