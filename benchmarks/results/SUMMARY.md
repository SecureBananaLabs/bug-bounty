# API Benchmark Baseline Report

- **Generated At:** 2026-10-23T15:04:29.296Z
- **Mode:** full (120 reqs/endpoint, concurrency 12)

| Endpoint | p50 (ms) | p95 (ms) | p99 (ms) | TTFB p50 (ms) | Sustained RPS | Peak RPS | Error Rate (%) | Gate Status |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `GET /api/health` | 3.62 | 19.42 | 20.92 | 3.59 | 1973.83 | 1973.83 | 0% | PASS |
| `GET /api/bounties` | 3.34 | 12.39 | 13.03 | 3.31 | 2730.61 | 2730.61 | 0% | PASS |
| `POST /api/submissions` | 4.89 | 7.94 | 8.83 | 4.85 | 2262.82 | 2262.82 | 0% | PASS |
