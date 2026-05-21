# 📊 API Performance Benchmark Summary

This report compiles real-time, sandbox-derived performance diagnostics for the Freelance Flow API server.

### 🛠️ Execution Context
- **Date/Time:** `2026-05-21T18:00:45.617Z`
- **Concurrency (Simulated Clients):** `2`
- **Target Host:** `http://localhost:4000`
- **Execution Mode:** `Smoke Concurrency (CI Gate)`

### 📈 Performance Metrics Ledger

| Endpoint | Method | p50 (ms) | p95 (ms) | p99 (ms) | Avg RPS | Error Rate (%) | TTFB (ms) | Threshold | Status |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Health Check** `/health` | `GET` | 1 | 0 | **14** | 781.0 | 0% | 40.81 | 200ms | 🟢 **PASSED** |
| **User Register** `/api/auth/register` | `POST` | 7 | 0 | **16** | 242.0 | 0% | 10.72 | 250ms | 🟢 **PASSED** |
| **User Login** `/api/auth/login` | `POST` | 6 | 0 | **20** | 248.0 | 0% | 8.4 | 250ms | 🟢 **PASSED** |
| **Token Refresh** `/api/auth/refresh` | `POST` | 6 | 0 | **12** | 300.0 | 0% | 7.6 | 100ms | 🟢 **PASSED** |
| **OAuth Callback** `/api/auth/oauth/github/callback` | `GET` | 1 | 0 | **8** | 1063.0 | 0% | 3.53 | 100ms | 🟢 **PASSED** |
| **Get Users List** `/api/users` | `GET` | 32 | 0 | **63** | 59.0 | 0% | 14.19 | 150ms | 🟢 **PASSED** |
| **Create User** `/api/users` | `POST` | 2 | 0 | **5** | 871.0 | 0% | 8.12 | 150ms | 🟢 **PASSED** |
| **Get Jobs List** `/api/jobs` | `GET` | 76 | 0 | **119** | 24.0 | 0% | 54.5 | 150ms | 🟢 **PASSED** |
| **Create Job Listing** `/api/jobs` | `POST` | 1 | 0 | **4** | 962.0 | 0% | 58.96 | 150ms | 🟢 **PASSED** |
| **Get Proposals** `/api/proposals` | `GET` | 46 | 0 | **63** | 43.0 | 0% | 16.5 | 150ms | 🟢 **PASSED** |
| **Create Proposal** `/api/proposals` | `POST` | 2 | 0 | **5** | 850.0 | 0% | 31.36 | 150ms | 🟢 **PASSED** |
| **Create Payment Intent** `/api/payments` | `POST` | 1 | 0 | **5** | 974.0 | 0% | 3.16 | 150ms | 🟢 **PASSED** |
| **Get Reviews** `/api/reviews` | `GET` | 36 | 0 | **66** | 55.0 | 0% | 25.69 | 150ms | 🟢 **PASSED** |
| **Create Review** `/api/reviews` | `POST` | 2 | 0 | **4** | 828.0 | 0% | 18.95 | 150ms | 🟢 **PASSED** |
| **Get Messages List** `/api/messages` | `GET` | 41 | 0 | **62** | 49.0 | 0% | 20.14 | 150ms | 🟢 **PASSED** |
| **Send Message** `/api/messages` | `POST` | 1 | 0 | **3** | 986.0 | 0% | 21.21 | 150ms | 🟢 **PASSED** |
| **Get Notifications** `/api/notifications` | `GET` | 48 | 0 | **75** | 41.0 | 0% | 26.23 | 150ms | 🟢 **PASSED** |
| **Create Notification** `/api/notifications` | `POST` | 2 | 0 | **5** | 840.0 | 0% | 40.3 | 150ms | 🟢 **PASSED** |
| **Global Search** `/api/search?q=autocannon` | `GET` | 1 | 0 | **9** | 1038.0 | 0% | 5.06 | 200ms | 🟢 **PASSED** |
| **Multipart File Upload** `/api/uploads` | `POST` | 3 | 0 | **32** | 349.0 | 0% | 21.61 | 200ms | 🟢 **PASSED** |
| **Admin Metrics (Auth Required)** `/api/admin/metrics` | `GET` | 5 | 0 | **16** | 317.0 | 0% | 8.31 | 200ms | 🟢 **PASSED** |

*Threshold evaluations are performed against the p99 latency metric to track extreme outliers and regressions.*
