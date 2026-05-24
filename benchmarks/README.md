# Benchmarks

API performance benchmarking suite for FreelanceFlow.

## Setup

```bash
# Install autocannon
npm install -g autocannon

# Or use npx
npx autocannon --help
```

## Running Benchmarks

```bash
# Run all benchmarks
npm run benchmark

# Or directly
node benchmarks/run.js
```

## Output

- JSON results: `benchmarks/results/<endpoint>-<timestamp>.json`
- Markdown summary: `benchmarks/results/summary.md`
- Thresholds: `benchmarks/thresholds.json`
