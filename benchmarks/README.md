# Benchmark Suite

This directory contains the API benchmark suite for the FreelanceFlow monorepo.

## Quick Start

```bash
# Install dependencies
npm install autocannon --save-dev

# Run benchmarks
npm run benchmark
```

## Configuration

Set these environment variables before running:

```bash
export BENCHMARK_HOST=http://localhost:3001  # Default
export BENCHMARK_HOST=https://staging-api.example.com  # Or staging
```

## Running Benchmarks

### Full Suite

```bash
npm run benchmark
```

### Single Endpoint

```bash
node benchmarks/api-benchmark.js
```

### With Custom Target

```bash
BENCHMARK_HOST=http://localhost:4000 npm run benchmark
```

## Output

Results are saved to `/benchmarks/results/`:
- `benchmark-YYYY-MM-DD.json` - Full JSON report
- `benchmark-YYYY-MM-DD.md` - Human-readable markdown summary

## Thresholds

Performance thresholds are defined in `thresholds.json`:

| Metric | Threshold | Description |
|--------|-----------|-------------|
| p99 | < 500ms | 99th percentile latency |
| Error Rate | < 1% | Error rate under load |
| RPS | > 100 | Minimum requests/second |

## Metrics Explained

- **p50**: Median latency (50th percentile)
- **p95**: 95th percentile latency
- **p99**: 99th percentile latency (our primary SLA metric)
- **RPS**: Requests per second the endpoint can handle
- **Error Rate**: Percentage of failed requests
- **TTFB**: Time to first byte

## CI Integration

The CI runs a smoke benchmark on every PR:

```yaml
# .github/workflows/benchmark.yml
- name: Run smoke benchmark
  run: npm run benchmark:smoke
```

If p99 exceeds the threshold, the build fails.

## Benchmark Environment Disclosure

When submitting benchmark results, include:

```markdown
### Benchmark Environment
- **CPU:** [model & cores]
- **RAM:** [total & available]
- **Network:** [Ethernet/WiFi/loopback]
- **Machine:** [local/cloud VM/CI runner]
- **Node.js:** [version]
- **Other processes:** [any significant concurrent workloads]
```

## License

MIT

