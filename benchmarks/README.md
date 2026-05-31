# Benchmarks

API benchmark suite using [autocannon](https://github.com/mcollina/autocannon).

## Usage

```bash
# Run full benchmark suite
npm run benchmark

# Results are written to:
#   benchmarks/results/benchmark-results.json
#   benchmarks/results/benchmark-summary.md
```

## Configuration

Thresholds in `thresholds.json`:

| Metric | Default | Description |
|--------|---------|-------------|
| `p99` | 500 ms | Max acceptable p99 latency |
| `errorRate` | 1% | Max acceptable error rate |
| `minRps` | 50 | Minimum requests per second |

## Configuration File

Copy `.env.benchmark` to `.env` and adjust:

```bash
cp benchmarks/.env.benchmark benchmarks/.env
```

## Endpoints Covered

All 21 API endpoints under `/api/` are benchmarked (see `ENDPOINTS` array in `benchmark.js`), including:

- Public routes (GET + POST)
- Auth-protected route (GET /api/admin/metrics) using a pre-generated JWT
- File upload (POST /api/uploads) — benchmarked without actual file payload

## Notes

- **TTFB**: autocannon does not natively report Time To First Byte. If needed, use `curl -w "@curl-format.txt"` or a dedicated tool like `httpstat`.
- **p95**: autocannon reports p50, p75, and p99 by default. p95 is estimated as `avg(p75, p99)`.
- **Rate limiter**: automatically disabled when `BENCHMARK=1` is set.
- **CI**: a smoke benchmark runs on every PR via `.github/workflows/benchmark.yml`.

## Adding Endpoints

Edit `ENDPOINTS` array in `benchmark.js`. Each entry:

```js
{
  method: "GET",
  path: "/api/example",
  auth: false,        // true if needs JWT
  body: { ... }       // for POST endpoints
}
```
