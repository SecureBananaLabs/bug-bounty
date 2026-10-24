# API Benchmark Results Summary

Executed on: 2026-10-21T14:27:20.028Z

| Endpoint | Method | Path | p50 (ms) | p95 (ms) | p99 (ms) | Avg TTFB (ms) | RPS | Error Rate (%) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Health Check | GET | `/health` | 3.39 | 51.59 | 102.3 | 10.14 | 272.11 | 0% |
| Auth Register | POST | `/api/auth/register` | 4.31 | 31.2 | 32.89 | 6.91 | 547.95 | 0% |
| Auth Login | POST | `/api/auth/login` | 4.99 | 6.41 | 6.51 | 4.3 | 869.57 | 0% |
| List Users (Auth) | GET | `/api/users` | 2.8 | 4.53 | 5.4 | 2.61 | 1250 | 0% |
| List Jobs | GET | `/api/jobs` | 2.43 | 3.48 | 3.53 | 2.05 | 1666.67 | 0% |
| Create Job (Auth) | POST | `/api/jobs` | 3.65 | 4.79 | 5.16 | 3.28 | 1081.08 | 0% |
| List Proposals (Auth) | GET | `/api/proposals` | 2.4 | 7.34 | 7.68 | 2.51 | 1428.57 | 0% |
| List Payments (Auth) | GET | `/api/payments` | 1.94 | 2.54 | 2.55 | 1.74 | 2000 | 0% |
| List Reviews | GET | `/api/reviews` | 2.28 | 2.71 | 2.78 | 1.91 | 1739.13 | 0% |
| List Messages (Auth) | GET | `/api/messages` | 1.94 | 3.21 | 4.61 | 1.91 | 1739.13 | 0% |
| Notifications (Auth) | GET | `/api/notifications` | 2.19 | 2.54 | 2.56 | 1.82 | 1904.76 | 0% |
| Search API | GET | `/api/search?q=developer` | 2.33 | 4.44 | 4.47 | 2.14 | 1600 | 0% |
| Admin Dashboard (Auth) | GET | `/api/admin` | 2.51 | 7.75 | 9.04 | 2.59 | 1290.32 | 0% |
