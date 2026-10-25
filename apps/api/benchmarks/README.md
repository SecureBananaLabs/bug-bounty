# API Benchmarks

This directory contains the benchmark suite for the FreelanceFlow API.

## Setup

1. Install dependencies:
   ```bash
   npm install autocannon
   ```

2. Copy the environment template:
   ```bash
   cp .env.benchmark .env.benchmark.local
   ```

3. Configure your environment in `.env.benchmark.local`

## Running Benchmarks

### Basic run:
```bash
node benchmarks/benchmark.js
```

### With threshold checking:
```bash
node benchmarks/benchmark.js --check-thresholds
```

### Against a specific URL:
```bash
BENCHMARK_URL=http://localhost:3001 node benchmarks/benchmark.js
```

### Via npm script:
```bash
npm run benchmark
```

## Results

Results are saved in two formats:
- **JSON**: `results/benchmark-{timestamp}.json` - Raw data for programmatic use
- **Markdown**: `results/benchmark-{timestamp}.md` - Human-readable report

## Thresholds

Thresholds are defined in `thresholds.json`. The CI pipeline will fail if any endpoint exceeds its p99 latency threshold.

To modify thresholds, edit `thresholds.json`:
```json
{
  "Endpoint Name": {
    "p99": 500
  }
}
```

## Metrics Captured

Each benchmark captures:
- **p50, p95, p99 latency** (ms)
- **Requests per second** (average and total)
- **Error rate** (%)
- **Time to first byte** (TTFB)

## CI Integration

Add to your CI pipeline:
```yaml
- name: Run benchmarks
  run: npm run benchmark -- --check-thresholds
```
