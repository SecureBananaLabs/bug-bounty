# FreelanceFlow Platform API Benchmark Report

**Execution Timestamp:** Fri, 30 Oct 2026 09:18:07 GMT  
**Concurrency:** 2 | **Duration:** 2s per route | **Status:** ✅ ALL GATES PASSED  

| Endpoint | Method | Req/sec (RPS) | p50 (ms) | p95 (ms) | p99 (ms) | TTFB (ms) | Error Rate (%) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/health` | `GET` | 213.65 | 5.92 | 40.3 | **52.66** | 8.74 | 0% |
| `/api/auth/register` | `POST` | 358.24 | 4.65 | 9.11 | **14.7** | 5.37 | 0% |
| `/api/auth/login` | `POST` | 303.97 | 5.1 | 11.49 | **36.45** | 6.36 | 0% |
| `/api/jobs` | `GET` | 512.01 | 3.29 | 6.94 | **10.03** | 3.73 | 0% |
| `/api/proposals` | `GET` | 627.12 | 2.56 | 5.81 | **9.54** | 3.06 | 0% |
| `/api/users` | `GET` | 621.13 | 2.51 | 6.2 | **9.83** | 3.07 | 0% |
| `/api/payments/intent` | `POST` | 399.89 | 4.3 | 8.32 | **19.64** | 4.85 | 0% |
| `/api/reviews` | `GET` | 628.7 | 2.48 | 6.01 | **8.06** | 3.05 | 0% |
| `/api/messages` | `GET` | 544.62 | 2.8 | 8.03 | **12.84** | 3.49 | 0% |
| `/api/notifications` | `GET` | 388.39 | 3.11 | 11.69 | **45.51** | 4.94 | 0% |
| `/api/search` | `GET` | 348.99 | 3.69 | 11 | **45.03** | 5.41 | 0% |
| `/api/uploads` | `GET` | 689.75 | 2.38 | 5.48 | **6.71** | 2.79 | 0% |
| `/api/admin` | `GET` | 714.15 | 2.29 | 5.19 | **6.84** | 2.69 | 0% |

## Threshold Enforcement
✅ All platform endpoints operated comfortably within p99 SLA thresholds defined in `benchmarks/thresholds.json`.
