# API Benchmark Suite

This benchmark suite exercises the platform API endpoints with realistic sample payloads and records latency, throughput, error rate, and time-to-first-byte data.

## Setup

1. Start the API locally:

   ```bash
   npm run start -w apps/api
   ```

2. Copy the benchmark environment template:

   ```bash
   cp .env.benchmark.example .env.benchmark
   ```

3. Edit `.env.benchmark` if needed:

   - `BENCHMARK_BASE_URL` defaults to `http://127.0.0.1:4000`.
   - `BENCHMARK_TOKEN` is optional and is used for auth-protected routes such as `/api/admin/metrics`.
   - `BENCHMARK_CONNECTIONS` and `BENCHMARK_DURATION_SECONDS` control load.
   - `BENCHMARK_DISABLE_RATE_LIMIT=1` should also be set on the API process for repeatable local load tests.

4. Start the API with benchmark rate-limit bypass for local load testing:

   ```bash
   BENCHMARK_DISABLE_RATE_LIMIT=1 npm run start -w apps/api
   ```

5. Generate a local admin token if you want to include auth-protected routes:

   ```bash
   export BENCHMARK_TOKEN=$(node -e "const jwt = require('jsonwebtoken'); console.log(jwt.sign({ sub: 'benchmark-admin', role: 'admin' }, process.env.JWT_SECRET || 'development-secret', { expiresIn: '15m' }));")
   ```

6. Run the suite:

   ```bash
   npm run benchmark
   ```

## Output

Each run writes:

- `benchmarks/results/latest.json`
- `benchmarks/results/latest.md`

## CI Smoke Mode

The GitHub Actions smoke job runs with low concurrency and short duration by setting:

```bash
BENCHMARK_SMOKE=1
BENCHMARK_CONNECTIONS=1
BENCHMARK_DURATION_SECONDS=3
```

It also creates a short-lived admin JWT so protected routes are measured instead of skipped.
The API process is started with `BENCHMARK_DISABLE_RATE_LIMIT=1` so the smoke test measures endpoint handling instead of the global limiter.

Thresholds are stored in `benchmarks/thresholds.json` and are intentionally reviewable.
