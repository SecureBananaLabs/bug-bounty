# FreelanceFlow API Benchmarks

Complete performance benchmarking suite for the FreelanceFlow API.
Built with [k6](https://grafana.com/docs/k6/) for the Bug Bounty [#30](https://github.com/SecureBananaLabs/bug-bounty/issues/30).

## Quick Start

### Prerequisites
- [k6](https://grafana.com/docs/k6/latest/get-started/installation/) (`brew install k6` / `choco install k6`)
- Node.js 22+
- Docker (optional, for containerized runs)

### 1. Start the API

```bash
npm install --workspace=apps/api
PORT=4000 JWT_SECRET=local-secret node apps/api/src/server.js
```

### 2. Run benchmarks

```bash
# Smoke test (verify everything works)
make bench-smoke

# Full load test (50 VUs, 60s)
make bench

# Stress test (find breaking point)
make bench-stress

# Via Docker (zero local deps)
make bench-docker
```

### 3. View report

```bash
make bench-report
# → http://localhost:8080
```

## Benchmark Types

| Type | Command | VUs | Duration | Purpose |
|------|---------|-----|----------|---------|
| **Smoke** | `make bench-smoke` | 1 | 1 iter | Sanity check — are all endpoints responding? |
| **Load** | `make bench` | 50 | 60s | Standard benchmark — p50/p95/p99, RPS, error rate |
| **Stress** | `make bench-stress` | up to 500 | 2.5 min | Find saturation point and max RPS |

## CI Integration

### On Push to `main`
- Full load test runs automatically
- Results saved to `benchmarks/results/history/`
- Dashboard updated at `benchmarks/results/index.html`

### On Pull Request
- Benchmark runs on both PR branch and `main`
- Performance diff posted as PR comment
- Regression warning if p95 latency increases >50ms

## Configuration

| Env variable | Default | Description |
|-------------|---------|-------------|
| `BASE_URL` | `http://localhost:4000` | API base URL |
| `VUS` | `50` | Virtual users |
| `DURATION` | `60s` | Test duration |
| `MAX_VUS` | `500` | Max VUs for stress test |

## Historical Data

Benchmark results are stored in `benchmarks/results/history/` with ISO timestamp directories.
Each run contains:
- `summary.json` — structured metrics (p50, p95, p99, RPS, error rate)
- `console.log` — full k6 output

Only the 50 most recent runs are kept.

## Thresholds

The benchmark enforces these thresholds:

| Metric | Threshold | Action |
|--------|-----------|--------|
| HTTP duration p50 | < 200ms | ❌ Fail if exceeded |
| HTTP duration p95 | < 500ms | ❌ Fail if exceeded |
| HTTP duration p99 | < 1000ms | ❌ Fail if exceeded |
| Request failure rate | < 1% | ❌ Fail if exceeded |
| PR p95 regression | < 50ms | ⚠️ Warn, don't block |
| PR p95 regression | > 50ms | ⚠️ Block recommendation |
