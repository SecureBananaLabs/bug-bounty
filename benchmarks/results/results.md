# Benchmark Results Summary

Generated on 2026-05-29T10:02:03.126Z

| Endpoint | Method | p50 (ms) | p95 (ms) | p99 (ms) | Avg TTFB (ms) | RPS | Error Rate (%) |
|---|---|---|---|---|---|---|---|
| Health Endpoint | GET /health | 0.29 | 0.69 | 1.26 | 0.38 | 12673.5 | 0% |
| Auth Register | POST /api/auth/register | 1.7 | 3.56 | 4.05 | 2.13 | 2333 | 0% |
| Auth Login | POST /api/auth/login | 1.59 | 3.24 | 3.53 | 2.02 | 2458.5 | 0% |
| Create Payment Intent | POST /api/payments | 0.34 | 0.73 | 1.19 | 0.44 | 11229 | 0% |
| Admin Metrics | GET /api/admin/metrics | 1.59 | 3.27 | 4.48 | 2.09 | 2380.5 | 0% |

*Threshold check: P99 latency limit is **150ms***
