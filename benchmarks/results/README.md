# API Benchmark Results (20/05/2026, 02:29:55)

| Endpoint | Method | Path | p50 (ms) | p95 (ms) | p99 (ms) | RPS | Error Rate (%) | TTFB (ms) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **health** | GET | `/health` | 9 | undefined | 22 | 1847 | 0.00% | 45.65 |
| **auth_register** | POST | `/api/auth/register` | 61 | undefined | 235 | 266.67 | 0.00% | 25.93 |
| **auth_login** | POST | `/api/auth/login` | 35 | undefined | 81 | 526.67 | 0.00% | 6.34 |
| **auth_refresh** | POST | `/api/auth/refresh` | 41 | undefined | 135 | 380 | 0.00% | 12.10 |
| **users_list** | GET | `/api/users` | 9 | undefined | 26 | 1960.34 | 0.00% | 10.95 |
| **users_create** | POST | `/api/users` | 10 | undefined | 29 | 1800 | 0.00% | 5.39 |
| **jobs_list** | GET | `/api/jobs` | 9 | undefined | 34 | 1973.67 | 0.00% | 5.06 |
| **jobs_create** | POST | `/api/jobs` | 11 | undefined | 47 | 1313.34 | 0.00% | 6.96 |
| **proposals_list** | GET | `/api/proposals` | 14 | undefined | 54 | 1206.67 | 0.00% | 11.09 |
| **proposals_create** | POST | `/api/proposals` | 11 | undefined | 46 | 1534.34 | 0.00% | 14.05 |
| **payments_create** | POST | `/api/payments` | 10 | undefined | 23 | 1840.34 | 0.00% | 3.20 |
| **reviews_list** | GET | `/api/reviews` | 8 | undefined | 15 | 2240.67 | 0.00% | 8.73 |
| **reviews_create** | POST | `/api/reviews` | 11 | undefined | 34 | 1566.67 | 0.00% | 4.37 |
| **messages_list** | GET | `/api/messages` | 9 | undefined | 21 | 1887 | 0.00% | 4.98 |
| **messages_create** | POST | `/api/messages` | 10 | undefined | 26 | 1746.67 | 0.00% | 4.79 |
| **notifications_list** | GET | `/api/notifications` | 10 | undefined | 46 | 1673.34 | 0.00% | 4.50 |
| **notifications_create** | POST | `/api/notifications` | 9 | undefined | 15 | 2073.67 | 0.00% | 6.65 |
| **uploads_create** | POST | `/api/uploads` | 12 | undefined | 27 | 1513.34 | 0.00% | 19.83 |
| **search** | GET | `/api/search?q=bench` | 8 | undefined | 31 | 1967 | 0.00% | 6.71 |
| **admin_metrics** | GET | `/api/admin/metrics` | 31 | undefined | 76 | 600 | 0.00% | 7.73 |
