# API Performance Benchmark Report

**Execution Date**: `2026-10-12T08:14:01.894Z`
**Target Host**: `http://127.0.0.1:65460` | **Node Version**: `v24.16.0` | **Smoke Gate**: `PASSED ✅`

## Performance Metrics

| Method | Endpoint | Req/s (RPS) | p50 (ms) | p95 (ms) | p99 (ms) | TTFB (ms) | Error Rate (%) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/health` | **1181.2** | 3.31 | 22.43 | 23.6 | 5.75 | 0% |
| `POST` | `/api/auth/register` | **1144.9** | 4.65 | 19.5 | 19.59 | 6.25 | 0% |
| `POST` | `/api/auth/login` | **1546.8** | 4.64 | 5.7 | 5.78 | 4.43 | 0% |
| `GET` | `/api/jobs` | **2621.4** | 2.58 | 3.15 | 3.23 | 2.49 | 0% |
| `POST` | `/api/jobs` | **1965.6** | 3.39 | 4.24 | 4.28 | 3.35 | 0% |
| `GET` | `/api/users` | **2792.3** | 2.24 | 3.32 | 3.36 | 2.33 | 0% |
| `GET` | `/api/proposals` | **2757.5** | 2.08 | 3.55 | 3.66 | 2.29 | 0% |
| `POST` | `/api/payments` | **1835.3** | 3.78 | 4.83 | 4.99 | 3.52 | 0% |
| `GET` | `/api/reviews` | **2293.4** | 2.41 | 4.67 | 5.59 | 2.74 | 0% |
| `GET` | `/api/messages` | **3360.5** | 2.03 | 2.45 | 2.48 | 1.98 | 0% |
| `GET` | `/api/notifications` | **3252.6** | 2.1 | 2.74 | 2.81 | 2.06 | 0% |
| `GET` | `/api/search?q=developer` | **2905.7** | 2.32 | 4.4 | 4.51 | 2.36 | 0% |
| `GET` | `/api/admin` | **3670.5** | 1.85 | 2.39 | 2.44 | 1.82 | 0% |

> **Regression Gate**: All measured endpoints satisfy thresholds defined in `benchmarks/thresholds.json`.
