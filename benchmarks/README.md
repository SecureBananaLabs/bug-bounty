# API Benchmarks

Benchmark suite for FreelanceFlow API endpoints using [k6](https://k6.io).

## Prerequisites

- Install [k6](https://k6.io/docs/getting-started/installation/)
- Node.js 18+
- A running instance of the API (local or staging)

## Quick Start

```
# 1. Copy and configure the environment template
cp .env.benchmark .env.benchmark.local
# Edit .env.benchmark.local with your target host and auth token

# 2. Run the full benchmark suite
npm run benchmark

# 3. Run quick smoke test (for CI)
npm run benchmark:smoke
```

## Configuration

Edit `benchmarks/thresholds.json` to set:
- `p99_max_ms`: Maximum acceptable p99 latency (default: 2000ms)
- `max_error_rate`: Maximum acceptable error rate (default: 0.05 = 5%)
- `min_rps`: Minimum acceptable requests per second (default: 50)

## Output

Results are written to `benchmarks/results/` as:
- `*.json` - Machine-readable results
- `*.md` - Human-readable markdown summary

## Endpoints Tested

| Route | Method | Description |
|-------|--------|-------------|
| /api/auth/login | POST | User login |
| /api/auth/register | POST | User registration |
| /api/users/me | GET | Current user profile |
| /api/jobs | GET | List jobs |
| /api/jobs/:id | GET | Get job detail |
| /api/proposals | GET | List proposals |
| /api/messages | GET | List messages |
| /api/notifications | GET | List notifications |
| /api/search?q= | GET | Search |
| /api/reviews | GET | List reviews |
