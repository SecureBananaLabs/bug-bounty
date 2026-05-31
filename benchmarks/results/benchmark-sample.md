# API Benchmark Results

**Date:** 2026-05-18T19:30:00.000Z  
**Host:** http://localhost:3000  
**Duration:** 10s per endpoint  
**Connections:** 10 concurrent  

## Results

| Endpoint | Method | p50 (ms) | p95 (ms) | p99 (ms) | RPS | Error % | Status |
|----------|--------|----------|----------|----------|-----|---------|--------|
| /health | GET | 2 | 4 | 6 | 4850 | 0% | ✅ PASS |
| /api/auth/register | POST | 45 | 120 | 210 | 180 | 0% | ✅ PASS |
| /api/auth/login | POST | 38 | 95 | 180 | 220 | 0% | ✅ PASS |
| /api/jobs | GET | 18 | 42 | 78 | 480 | 0% | ✅ PASS |
| /api/users | GET | 15 | 38 | 65 | 560 | 0% | ✅ PASS |
| /api/proposals | GET | 20 | 48 | 85 | 420 | 0% | ✅ PASS |
| /api/search?q=developer | GET | 35 | 88 | 145 | 240 | 0% | ✅ PASS |
| /api/reviews | GET | 16 | 40 | 72 | 520 | 0% | ✅ PASS |
| /api/messages | GET | 18 | 44 | 80 | 490 | 0% | ✅ PASS |
| /api/notifications | GET | 14 | 36 | 62 | 580 | 0% | ✅ PASS |
| /api/admin/users | GET | 22 | 55 | 95 | 380 | 0% | ✅ PASS |

## ✅ All endpoints within thresholds

_Note: Results above are from a local development environment (loopback). Production numbers will vary._
