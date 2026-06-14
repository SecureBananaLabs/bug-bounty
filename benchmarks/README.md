# API Benchmarks

This directory contains the performance benchmark suite for the platform APIs.

## Benchmark Suite

### Goals
- Establish baseline performance metrics for all `/api/` endpoints
- Measure latency percentiles (p50, p95, p99), throughput, error rates
- Identify performance bottlenecks
- Enable regression tracking across builds

### Scope
- All endpoints under `/api/` are included
- Realistic payload sizes from production schema
- Auth routes tested with benchmark token

### Tool & Setup
Uses [autocannon](https://github.com/mcollina/autocannon) for load testing.

