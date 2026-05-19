# API Benchmark Suite
Autocannon-based benchmark for all FreelanceFlow API endpoints.
## Quick Start
```bash
npm install && npm run benchmark
npm run benchmark:smoke  # CI smoke test
```
Measures p50/p95/p99 latency, RPS, error rate for all /api/ endpoints.
Output: benchmarks/results/results.json + results.md
