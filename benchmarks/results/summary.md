# Benchmark Results - 5/18/2026, 6:03:12 PM

**Target:** http://localhost:3000

| Endpoint | Method | p50 (ms) | p95 (ms) | p99 (ms) | RPS | Error % |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| /health | GET | 1 | undefined | 3 | 7079 | 0.00 |
| /api/jobs | GET | 26 | undefined | 50 | 383 | 0.00 |
| /api/search | GET | 1 | undefined | 3 | 6370 | 0.00 |
| /api/auth/login | POST | 151 | undefined | 200 | 65 | 0.00 |
