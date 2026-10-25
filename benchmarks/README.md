# Platform API Benchmark Suite

A baseline performance benchmarking suite covering all platform API endpoints under `/api/` with p50, p95, p99 latency measurement, request throughput (req/s), error rates, and time-to-first-byte (TTFB).

---

## Features

- **Full Coverage of `/api/` Routes**:
  - `GET /health`
  - `POST /api/auth/register` (production-scale schema)
  - `POST /api/auth/login`
  - `GET /api/jobs`
  - `POST /api/jobs` (production schema with title, description, budgetMin/budgetMax, categoryId, skills)
  - `GET /api/users` (authenticated)
  - `GET /api/proposals` (authenticated)
  - `POST /api/payments` (authenticated intent creation)
  - `GET /api/reviews` (authenticated)
  - `GET /api/messages` (authenticated)
  - `GET /api/notifications` (authenticated)
  - `GET /api/search`
  - `GET /api/admin` (admin-authenticated)
- **Dedicated Benchmark JWT**: Signs test tokens matching auth middleware expectations.
- **In-Process Fallback**: Automatically spins up an ephemeral test server instance if the target host is not currently running.
- **Regression Gating**: Configurable thresholds in `thresholds.json` that fail CI smoke builds if p99 latency or error rates exceed targets.
- **Standardized Output**: Produces both `results/benchmark_results.json` and human-readable `results/benchmark_summary.md`.

---

## Quick Start

### 1. Run the Full Benchmark Suite
```bash
npm run benchmark
```
or directly:
```bash
node benchmarks/run_benchmark.js
```

### 2. Run Fast CI Smoke Benchmark
```bash
npm run benchmark:smoke
```

### 3. Target a Remote Host or Specific Port
Copy `.env.benchmark` or pass environment variables:
```bash
TARGET_HOST=http://staging.internal:4000 npm run benchmark
```

---

## Regression Gate Thresholds (`thresholds.json`)

The regression gate fails with a non-zero exit code if any endpoint exceeds the configured limits:
- Global Max p99 Latency: `250ms`
- Global Max Error Rate: `2.0%`
- Specific Endpoint Constraints:
  - `/health`: p99 < 50ms, 0% error
  - `/api/jobs`: p99 < 200ms
  - `/api/users`: p99 < 200ms
  - `/api/search`: p99 < 250ms
