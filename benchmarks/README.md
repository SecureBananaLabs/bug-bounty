# FreelanceFlow API Benchmark Suite

Benchmark all API endpoints under `/api/` for latency (p50, p95, p99), throughput (RPS), and error rate.

## Quick Start

```bash
# 1. Install dependencies
cd benchmarks && npm install

# 2. Start the API server (in another terminal)
cd apps/api && npm start

# 3. Run the full benchmark suite
npm run benchmark

# 4. Run CI smoke test (light load + threshold checks)
npm run benchmark:ci
```

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `TARGET` | `http://localhost:4000` | Target API server URL |
| `BENCHMARK_TOKEN` | — | Bearer token for auth-protected endpoints |

Set these via environment or edit `config.json`.

### `config.json`

- `endpoints` — Array of endpoint definitions (method, path, body, auth flag)
- `concurrency` / `duration` — Full benchmark load settings
- `ciConcurrency` / `ciDuration` — CI smoke test settings

### `thresholds.json`

Stores maximum acceptable p99 latency and error rate per endpoint. CI mode fails if any threshold is exceeded.

## Output

Results are written to `benchmarks/results/`:

| File | Format | Description |
|------|--------|-------------|
| `latest.json` | JSON | Machine-readable metrics |
| `latest.md` | Markdown | Human-readable summary table |
| `benchmark-<timestamp>.json` | JSON | Timestamped archive |

## Adding a New Endpoint

Add an entry to `config.json`:

```json
{
  "method": "GET",
  "path": "/api/your-endpoint",
  "description": "Description of the endpoint",
  "auth": false,
  "skipInCi": false,
  "body": null
}
```

## Requirements

- Node.js 18+
- API server running (local or remote)
- npm (`npm install` in `/benchmarks`)
