# API Benchmark Report

- **Target Host:** `http://localhost:4000`
- **Timestamp:** `2026-10-19T23:58:12.410Z`
- **Concurrency:** `10`

| Endpoint | p50 (ms) | p95 (ms) | p99 (ms) | TTFB p50 (ms) | Sustained RPS | Peak RPS | Error Rate (%) |
|---|---:|---:|---:|---:|---:|---:|---:|
| `GET /health` | 3.53 | 11.24 | 59.53 | 3.53 | 606.46 | 2621.64 | 100% |
| `POST /api/auth/login` | 3.41 | 4.98 | 5.95 | 3.41 | 1836.25 | 2414.34 | 100% |
| `GET /api/users/me` | 2.11 | 2.63 | 2.74 | 2.11 | 2789.46 | 2950 | 100% |
| `GET /api/jobs?page=1&limit=20` | 2.32 | 3.76 | 4.08 | 2.32 | 2590.41 | 2901.65 | 100% |
| `GET /api/proposals` | 2.34 | 3.94 | 4.17 | 2.34 | 2456.95 | 3014.09 | 100% |
| `GET /api/payments` | 2.41 | 9.67 | 9.88 | 2.41 | 2007.44 | 3058.84 | 100% |
| `GET /api/reviews` | 2.3 | 3.31 | 3.52 | 2.3 | 2700.08 | 3167.25 | 100% |
| `GET /api/messages` | 1.94 | 2.31 | 2.42 | 1.94 | 3166.96 | 3257.05 | 100% |
| `GET /api/notifications` | 2.11 | 2.46 | 2.56 | 2.11 | 3003.25 | 3119.55 | 100% |
| `GET /api/uploads` | 2.39 | 3.15 | 3.29 | 2.39 | 2746.14 | 3066.87 | 100% |
| `GET /api/search?q=typescript` | 2.41 | 4.68 | 4.87 | 2.41 | 2302.65 | 2891.49 | 100% |
| `GET /api/admin/stats` | 2.21 | 4.25 | 4.45 | 2.21 | 2556.96 | 3077.39 | 100% |
