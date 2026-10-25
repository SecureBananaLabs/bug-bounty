# 📊 API Benchmark Summary Report

> **Execution Mode:** `Smoke Test (CI)`  
> **Timestamp:** `2026-10-16T15:52:36.227Z`  
> **Target Host:** `http://localhost:3000`  
> **Overall Status:** 🟢 **PASSED (Within Regression Thresholds)**

| Endpoint | Method | Req/s (Sustained) | Peak Req/s | Latency p50 | Latency p95 | Latency p99 | TTFB p99 | Error Rate | Status |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `/api/health` | `GET` | 520.77 | 595 | 8.43ms | 13.69ms | **24.85ms** | 24.78ms | 0% | 🟢 PASS |
| `/api/auth/login` | `POST` | 3501.83 | 4238 | 0.9ms | 3.04ms | **5.9ms** | 5.86ms | 0% | 🟢 PASS |
| `/api/items` | `GET` | 491.19 | 518 | 9.36ms | 17.81ms | **23.03ms** | 22.92ms | 0% | 🟢 PASS |

### 🛡️ Threshold Enforcement Details

- **`/api/health`**: p99 observed: **24.85ms** (limit: `50ms`), Error rate: **0%** (limit: `0%`)
- **`/api/auth/login`**: p99 observed: **5.9ms** (limit: `400ms`), Error rate: **0%** (limit: `2%`)
- **`/api/items`**: p99 observed: **23.03ms** (limit: `250ms`), Error rate: **0%** (limit: `0.5%`)
