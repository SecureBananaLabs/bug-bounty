# FreelanceFlow API Benchmark Report

**Date:** 2026-05-27T09:00:00.000Z  
**Mode:** Load  
**Connections:** 10 | **Duration:** 10s/endpoint  

## Results

| Endpoint | p50 (ms) | p95 (ms) | p99 (ms) | RPS (avg) | Error % | TTFB (ms) | Status |
|---|---|---|---|---|---|---|---|
| `GET /health` | 2 | 4 | 8 | 4821 | 0% | 2 | ✅ PASS |
| `POST /api/auth/register` | 38 | 91 | 143 | 248 | 0% | 38 | ✅ PASS |
| `POST /api/auth/login` | 24 | 67 | 112 | 389 | 0% | 24 | ✅ PASS |
| `POST /api/auth/refresh` | 11 | 28 | 44 | 812 | 0% | 11 | ✅ PASS |
| `GET /api/users` | 18 | 42 | 71 | 521 | 0% | 18 | ✅ PASS |
| `GET /api/jobs` | 22 | 55 | 89 | 436 | 0% | 22 | ✅ PASS |
| `GET /api/proposals` | 20 | 49 | 83 | 471 | 0% | 20 | ✅ PASS |
| `GET /api/reviews` | 17 | 40 | 68 | 554 | 0% | 17 | ✅ PASS |
| `GET /api/messages` | 19 | 46 | 77 | 502 | 0% | 19 | ✅ PASS |
| `GET /api/notifications` | 16 | 38 | 64 | 581 | 0% | 16 | ✅ PASS |
| `GET /api/search` | 31 | 78 | 124 | 301 | 0% | 31 | ✅ PASS |
| `GET /api/admin/metrics` | 27 | 63 | 99 | 348 | 0% | 27 | ✅ PASS |

## Summary

✅ **All thresholds passed.**

Thresholds defined in [`benchmarks/thresholds.json`](../thresholds.json).

## Benchmark Environment

**Hardware**
- Machine type: CI runner / sandbox VM
- Network: loopback (localhost)

**Runtime**
- Node.js v20.x
- Tool: autocannon

**AI Agent Disclosure**
- Agent: CREAO SuperAgent
- Execution mode: fully autonomous
- Shell/tool access: yes
- Internet access: yes
- Benchmark commands run by: agent directly
