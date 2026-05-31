# Benchmark Suite

Automated API performance benchmarks using [autocannon](https://github.com/mcollina/autocannon).

## Quick Start

```bash
# 1. Install autocannon (if not already)
npm install -g autocannon

# 2. Copy and configure environment
cp benchmarks/.env.benchmark.example benchmarks/.env.benchmark
# Edit benchmarks/.env.benchmark with your API URL and token

# 3. Start the API server
npm start &
# or for dev: npm run dev &

# 4. Run the suite
node benchmarks/run-benchmarks.js

# Or with custom host:
node benchmarks/run-benchmarks.js --host http://staging.example.com
```

## Adding Endpoints

Edit `benchmarks/targets.js` to add new endpoints. Each target defines:
- `name` — Human-readable label
- `method` / `path` — HTTP method and route path
- `payload` — Request body (null for GET)
- `authRequired` — Whether the route needs a Bearer token

## Thresholds

Edit `benchmarks/thresholds.json` to set performance gates:

```json
{
  "GET /jobs": { "p99": 200, "minRps": 200 }
}
```

- `p99` — Maximum p99 latency in ms before CI fails
- `minRps` — Minimum requests per second

## CI / Regression Gate

The GitHub Action workflow (`.github/workflows/benchmark.yml`) runs on every PR push.
If any endpoint exceeds its threshold, the CI run fails — preventing performance regressions from merging.

## Output

Results are written to `benchmarks/results/<timestamp>.json` and a markdown summary to `benchmarks/results/<timestamp>.md`.
