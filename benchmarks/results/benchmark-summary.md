# Benchmark Summary

**Date:** 2026-05-17T10:24:07.618Z
**Tool:** autocannon (10 connections, 10s duration)
**Target:** http://localhost:4001

## Per-Endpoint Results

| Endpoint | Method | p50 | p95 | p99 | Avg RPS | Errors |
|----------|--------|-----|-----|-----|---------|--------|
| GET /health ✅ | GET | 2.00 ms | 4.00 ms | 5.00 ms | 3 408 | 0 |
| POST /api/auth/register ✅ | POST | 3.00 ms | 5.00 ms | 6.00 ms | 2 939 | 0 |
| POST /api/auth/login ✅ | POST | 2.00 ms | 5.00 ms | 6.00 ms | 3 026 | 0 |
| POST /api/auth/refresh ✅ | POST | 2.00 ms | 7.00 ms | 11.00 ms | 3 190 | 0 |
| GET /api/auth/oauth/google/callback ✅ | GET | 2.00 ms | 7.00 ms | 10.00 ms | 3 203 | 0 |
| GET /api/users ✅ | GET | 2.00 ms | 7.00 ms | 11.00 ms | 3 178 | 0 |
| POST /api/users ✅ | POST | 3.00 ms | 5.00 ms | 6.00 ms | 2 508 | 0 |
| GET /api/jobs ✅ | GET | 2.00 ms | 7.00 ms | 10.00 ms | 3 195 | 0 |
| POST /api/jobs ✅ | POST | 3.00 ms | 5.00 ms | 6.00 ms | 2 480 | 0 |
| GET /api/proposals ✅ | GET | 2.00 ms | 7.00 ms | 10.00 ms | 3 180 | 0 |
| POST /api/proposals ✅ | POST | 3.00 ms | 5.00 ms | 6.00 ms | 2 523 | 0 |
| POST /api/payments ✅ | POST | 3.00 ms | 5.00 ms | 6.00 ms | 2 559 | 0 |
| GET /api/reviews ✅ | GET | 2.00 ms | 7.00 ms | 10.00 ms | 3 181 | 0 |
| POST /api/reviews ✅ | POST | 3.00 ms | 5.00 ms | 6.00 ms | 2 523 | 0 |
| GET /api/messages ✅ | GET | 3.00 ms | 7.00 ms | 10.00 ms | 3 163 | 0 |
| POST /api/messages ✅ | POST | 3.00 ms | 5.00 ms | 6.00 ms | 2 516 | 0 |
| GET /api/notifications ✅ | GET | 3.00 ms | 7.00 ms | 11.00 ms | 3 137 | 0 |
| POST /api/notifications ✅ | POST | 4.00 ms | 5.00 ms | 6.00 ms | 2 395 | 0 |
| POST /api/uploads ✅ | POST | 3.00 ms | 8.00 ms | 13.00 ms | 3 024 | 0 |
| GET /api/search ✅ | GET | 3.00 ms | 8.00 ms | 13.00 ms | 3 067 | 0 |
| GET /api/admin/metrics ✅ | GET | 3.00 ms | 8.00 ms | 12.00 ms | 3 003 | 0 |

## Thresholds

| Metric | Threshold | Status |
|--------|-----------|--------|
| p99 latency | ≤ 500 ms | ✅ Pass |
| Error rate | ≤ 1% | ✅ Pass |
| Min RPS | ≥ 50 | ✅ Pass |

## Environment

- **Node.js:** v20.18.1
- **Platform:** win32
- **Architecture:** x64