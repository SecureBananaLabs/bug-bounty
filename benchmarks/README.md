# API Benchmark Suite — Issue #30

Comprehensive [k6](https://k6.io) benchmark suite for the SecureBananaLabs/bug-bounty freelancer platform API.

## Endpoints Covered

The benchmark hits all API endpoints defined in `apps/api/src/routes/*.js`:

| # | Method | Route | Description |
|---|--------|-------|-------------|
| 0 | GET | `/health` | Health check |
| 1 | POST | `/api/auth/register` | User registration |
| 2 | POST | `/api/auth/login` | User login |
| 3 | GET | `/api/auth/oauth/:provider/callback` | OAuth callback |
| 4 | POST | `/api/auth/refresh` | Token refresh |
| 5 | GET | `/api/users` | List users |
| 6 | POST | `/api/users` | Create user |
| 7 | GET | `/api/jobs` | List jobs |
| 8 | POST | `/api/jobs` | Create job |
| 9 | GET | `/api/proposals` | List proposals |
| 10 | POST | `/api/proposals` | Create proposal |
| 11 | POST | `/api/payments` | Create payment |
| 12 | GET | `/api/reviews` | List reviews |
| 13 | POST | `/api/reviews` | Create review |
| 14 | GET | `/api/messages` | List messages |
| 15 | POST | `/api/messages` | Create message |
| 16 | GET | `/api/notifications` | List notifications |
| 17 | POST | `/api/notifications` | Create notification |
| 18 | POST | `/api/uploads` | File upload (multipart) |
| 19 | GET | `/api/search?q=...` | Search |
| 20 | GET | `/api/admin/metrics` | Admin metrics (auth-protected) |

## Metrics Collected

- p50, p95, p99 latency (ms)
- Requests per second (RPS)
- Error rate (%)
- Time to first byte (TTFB)
- Total requests per endpoint group

## Thresholds

| Metric | Threshold | Description |
|--------|-----------|-------------|
| p95 latency | < 200 ms | 95th percentile response time |
| p99 latency | < 500 ms | 99th percentile response time |
| Error rate | < 1% | Percentage of failed requests |

## Prerequisites

- [k6](https://k6.io/docs/get-started/installation/) installed (v0.52+ recommended)

```bash
# macOS
brew install k6

# Linux
sudo apt install k6
# or
curl -s https://dl.k6.io/rpm/repo.rpm | sudo tee /etc/yum.repos.d/k6.repo

# Windows
choco install k6
```

## Setup

```bash
cd benchmarks/

# (Optional) Copy env file and configure
cp .env.benchmark.example .env.benchmark
# Edit .env.benchmark with your TARGET_HOST and AUTH_TOKEN
```

## Usage

### Quick start — run against local server

```bash
# Ensure the API server is running locally on port 3000
k6 run benchmark.js
```

### Using npm scripts

```bash
npm run benchmark              # default: VUS=20, DURATION=60s
npm run benchmark:local        # explicit localhost target
npm run benchmark:smoke        # VUS=5, 30s — quick sanity check
npm run benchmark:load         # VUS=50, 120s — moderate load
npm run benchmark:stress       # VUS=100, 300s — heavy load
npm run benchmark:json         # outputs JSON to results.json
```

### Override via environment variables

```bash
TARGET_HOST=https://staging.example.com \
AUTH_TOKEN=eyJhbGci... \
VUS=50 \
DURATION=120s \
k6 run benchmark.js
```

### Output formats

- **Console**: Summary printed to stdout at end of run
- **JSON file**: `benchmark-summary.json` written on completion
- **Streaming**: Use `--out json=results.json` for per-request streaming

```bash
# Generate streaming JSON output
k6 run --out json=results.json benchmark.js
```

## Example Output

See [sample-output.json](./sample-output.json) for the expected JSON format after a successful run.

## File Structure

```
benchmarks/
  benchmark.js              # Main k6 test script
  package.json              # npm scripts and metadata
  .env.benchmark.example    # Environment variable template
  README.md                 # This file
  sample-output.json        # Mock expected output format
```

## Troubleshooting

- **All requests failing?** Make sure the API server is running and `TARGET_HOST` is correct.
- **Admin route 401?** Expected when no `AUTH_TOKEN` is set. Pass a valid JWT via the `AUTH_TOKEN` env var.
- **Thresholds failing?** Check server resources, database latency, and network conditions. Tune thresholds in `benchmark.js` `options.thresholds` if your environment has different expectations.
- **k6 not found?** Install k6: https://k6.io/docs/get-started/installation/
