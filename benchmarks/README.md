# API Benchmark Suite

Autocannon-based benchmark suite for all FreelanceFlow API endpoints. Measures p50/p95/p99 latency, RPS, error rate, and TTFB.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure target (optional)
cp .env.benchmark.template .env.benchmark
# Edit .env.benchmark to set BENCHMARK_HOST

# 3. Run full benchmark
npm run benchmark

# 4. Run CI smoke test (lightweight)
npm run benchmark:smoke
```

## What it Tests

All `/api/` endpoints are benchmarked:

| Group | Endpoints |
|-------|-----------|
| Auth | register, login, oauth callback, token refresh |
| Users | list, create |
| Jobs | list, create |
| Proposals | list, create |
| Payments | create |
| Reviews | list, create |
| Messages | list, create |
| Notifications | list |
| Search | query |
| Admin | metrics (auth-protected) |
| Health | service check |

## Output

Results are written to `benchmarks/results/`:
- `results.json` — machine-readable full data
- `results.md` — human-readable summary with pass/fail status

## CI Integration

```yaml
# .github/workflows/smoke-benchmark.yml
- name: Smoke Benchmark
  run: npm run benchmark:smoke
```

CI fails if:
- p99 latency exceeds threshold (default: 500ms)
- Error rate exceeds threshold (default: 5%)

Thresholds are configurable in `benchmarks/thresholds.json` and `.env.benchmark`.
