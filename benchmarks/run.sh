#!/usr/bin/env bash
set -euo pipefail

# ---------------------------------------------------------------------------
# Benchmark runner for FreelanceFlow API
# Prerequisites: k6 (https://k6.io/docs/get-started/installation/)
# ---------------------------------------------------------------------------

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$PROJECT_ROOT/benchmarks/.env.benchmark"

# Load environment variables
if [ -f "$ENV_FILE" ]; then
  # shellcheck source=/dev/null
  source "$ENV_FILE"
fi

BASE_URL="${BASE_URL:-http://localhost:4000}"
BENCHMARK_TOKEN="${BENCHMARK_TOKEN:-}"
RESULTS_DIR="$PROJECT_ROOT/benchmarks/results"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p "$RESULTS_DIR"

echo "============================================================"
echo " FreelanceFlow API Benchmark Suite"
echo " Target: $BASE_URL"
echo " Time:   $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "============================================================"
echo ""

# Check that the server is reachable
echo "Checking server health..."
if ! curl -sf --noproxy '*' --max-time 5 "$BASE_URL/health" > /dev/null 2>&1; then
  echo "ERROR: Server at $BASE_URL is not reachable. Start it first with 'npm run dev' from apps/api/"
  exit 1
fi
echo "Server is healthy."
echo ""

# Run k6 benchmark
echo "Running benchmark suite..."
k6 run \
  --env BASE_URL="$BASE_URL" \
  --env BENCHMARK_TOKEN="$BENCHMARK_TOKEN" \
  --out json="$RESULTS_DIR/result_${TIMESTAMP}.json" \
  "$SCRIPT_DIR/k6/benchmark.js"

# Copy latest results
if [ -f "$RESULTS_DIR/latest.json" ]; then
  cp "$RESULTS_DIR/latest.json" "$RESULTS_DIR/result_${TIMESTAMP}_summary.json"
  echo ""
  echo "Results saved to:"
  echo "  JSON: $RESULTS_DIR/result_${TIMESTAMP}_summary.json"
  echo "  Markdown: $RESULTS_DIR/latest.md"
  echo ""
  if command -v bat &> /dev/null; then
    bat "$RESULTS_DIR/latest.md"
  else
    cat "$RESULTS_DIR/latest.md"
  fi
fi
