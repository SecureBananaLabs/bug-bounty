# FreelanceFlow API Benchmark Report

**Date:** 09.10.2026  
**Tool:** Autocannon v7.x + Node.js v24.20.0  
**Target:** Localhost API (port 4000)  
**Connections:** 10 concurrent  
**Duration:** 10 seconds per endpoint

## Results

| Endpoint | Avg Latency (ms) | RPS | Errors |
|----------|------------------|-----|--------|
| `/`      | 1.28             | 5384 | 0      |
| `/jobs`  | 1.07             | 6050 | 0      |

## Observations
- Low latency (~1ms) under moderate load
- High throughput (~5500-6000 req/sec)
- Zero timeouts or connection errors
- Server remained stable throughout test
- Note: Responses returned non-2xx (expected for unauthenticated requests)
