# API Benchmark Results

**Date:** 2026-05-27 13:06:26 UTC
**Target:** http://localhost:4000
**Tool:** autocannon
**Node:** v22.22.2

## Smoke (10conn×10s×1pipe)

| Endpoint | p50 | p95 | p99 | Avg | Max | Req/s | Throughput | Error% |
|----------|----:|----:|----:|----:|----:|-----:|----------:|------:|
| Admin Metrics | 0ms | 0ms | 1ms | 0.07ms | 4ms | 17350 | 14.16MB/s | 0% |
| Create Job | 0ms | 1ms | 1ms | 0.13ms | 5ms | 15332 | 12.53MB/s | 0% |
| Health | 0ms | 0ms | 1ms | 0.07ms | 7ms | 17248 | 14.08MB/s | 0% |
| List Jobs | 0ms | 0ms | 1ms | 0.06ms | 3ms | 17554 | 14.33MB/s | 0% |
| List Users | 0ms | 0ms | 1ms | 0.07ms | 8ms | 17277 | 14.10MB/s | 0% |
| Login | 0ms | 1ms | 1ms | 0.13ms | 6ms | 15395 | 12.58MB/s | 0% |
| Messages | 0ms | 0ms | 1ms | 0.07ms | 3ms | 17306 | 14.13MB/s | 0% |
| Notifications | 0ms | 0ms | 1ms | 0.07ms | 4ms | 17282 | 14.11MB/s | 0% |
| Proposals | 0ms | 0ms | 1ms | 0.08ms | 3ms | 17165 | 14.01MB/s | 0% |
| Register | 0ms | 1ms | 1ms | 0.13ms | 4ms | 15511 | 12.68MB/s | 0% |
| Reviews | 0ms | 0ms | 1ms | 0.07ms | 4ms | 17339 | 14.15MB/s | 0% |
| Search | 0ms | 0ms | 1ms | 0.07ms | 3ms | 17523 | 14.31MB/s | 0% |

## Moderate Load (50conn×20s×2pipe)

| Endpoint | p50 | p95 | p99 | Avg | Max | Req/s | Throughput | Error% |
|----------|----:|----:|----:|----:|----:|-----:|----------:|------:|
| Load Health | 6ms | 7ms | 10ms | 6.5ms | 70ms | 14220 | 13.80MB/s | 0% |
| Load Jobs | 7ms | 8ms | 10ms | 6.94ms | 142ms | 13410 | 15.18MB/s | 0% |

## Config
| Param | Smoke | Load |
|-------|------|------|
| Connections | 10 | 50 |
| Duration | 10s | 20s |
| Pipelining | 1 | 2 |
| CPU | 32 cores |
| RAM | 62.6 GB |
| Store | In-memory (no DB) |

## Summary
- All endpoints <1ms p50 under smoke; ~6ms under moderate load
- Throughput: ~17K req/s (GET), ~15K req/s (POST)
- Real error rate: 0% across all tests
- Baseline for CI regression detection (thresholds.json)

## CI Gate
p99 > 200ms or error > 1% → fail.
