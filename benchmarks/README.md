# Benchmark Suite

Performance benchmark suite for the FreelanceFlow API using [k6](https://k6.io/).

## Prerequisites

Install k6 following the [official instructions](https://k6.io/docs/get-started/installation/).

```bash
# macOS
brew install k6

# Linux
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg \
  --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415B3641D6D9FF8B7E5CE3F227CC
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" \
  | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

## Setup

1. Copy the environment template and configure:

```bash
cp benchmarks/.env.benchmark benchmarks/.env.benchmark
# Edit .env.benchmark with your target URL and auth token
```

2. Start the API server:

```bash
cd apps/api && npm run dev
```

## Running Benchmarks

```bash
# Run the full benchmark suite
npm run benchmark

# Or directly:
./benchmarks/run.sh
```

## What's Measured

The suite benchmarks all API endpoints across three scenarios:

| Scenario | Description | VUs | Duration |
|----------|-------------|-----|----------|
| **Public endpoints** | Health, jobs, users, search, reviews | 20 | ~50s |
| **Auth endpoints** | Register, login, refresh | 10 | ~40s |
| **Protected endpoints** | Proposals, messages, notifications, payments, admin | 10 | ~40s |

### Metrics captured per endpoint

- **p50, p95, p99 latency** (ms)
- **Requests per second** (peak and sustained)
- **Error rate** (%)
- **Time to first byte** (TTFB)

## Output

Results are written to `benchmarks/results/`:

- `latest.json` — Full k6 output in JSON format
- `latest.md` — Human-readable markdown summary
- `result_<timestamp>.json` — Timestamped copy of each run

## Regression Gates

Thresholds are defined in `benchmarks/thresholds.json`:

```json
{
  "p99_latency_ms": 500,
  "error_rate_percent": 5,
  "min_rps": 50
}
```

The benchmark will fail if:
- p99 latency exceeds the configured threshold
- Error rate exceeds the configured percentage
- Sustained RPS falls below the minimum

## CI Integration

For CI smoke tests (low concurrency, fast), set environment variables:

```bash
BASE_URL=http://localhost:4000 npm run benchmark
```

The k6 exit code will be non-zero if any threshold is violated, making it suitable for CI pipelines.
