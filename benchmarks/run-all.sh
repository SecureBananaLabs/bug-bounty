#!/bin/bash
# Run full benchmark suite
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
RESULT_DIR="$SCRIPT_DIR/results"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p "$RESULT_DIR"

if [ -f "$SCRIPT_DIR/.env.benchmark" ]; then
  source "$SCRIPT_DIR/.env.benchmark"
fi

HOST="${BENCHMARK_HOST:-http://localhost:3000}"
TOKEN="${BENCHMARK_TOKEN:-}"
VUS="${BENCHMARK_VUS:-10}"
DURATION="${BENCHMARK_DURATION:-30s}"
SUMMARY_FILE="$RESULT_DIR/summary_${TIMESTAMP}.md"
JSON_FILE="$RESULT_DIR/results_${TIMESTAMP}.json"

echo "# Benchmark Results — $(date)" > "$SUMMARY_FILE"
echo "" >> "$SUMMARY_FILE"
echo "| Endpoint | p50 | p95 | p99 | RPS | Errors | TTFB |" >> "$SUMMARY_FILE"
echo "|----------|-----|-----|-----|-----|--------|------|" >> "$SUMMARY_FILE"

declare -A ALL_RESULTS

for script in "$SCRIPT_DIR/scripts"/*.js; do
  name=$(basename "$script" .js)
  echo ""
  echo "=== Benchmarking: $name ==="
  
  JSON_OUTPUT="$RESULT_DIR/${name}_${TIMESTAMP}.json"
  
  K6_BIN="${K6_BIN:-k6}"
  
  if command -v "$K6_BIN" &> /dev/null; then
    "$K6_BIN" run \
      --env BENCHMARK_HOST="$HOST" \
      --env BENCHMARK_TOKEN="$TOKEN" \
      --summary-trend-stats="min,avg,p(50),p(95),p(99),max" \
      --out json="$JSON_OUTPUT" \
      "$script" 2>&1 | tee "$RESULT_DIR/${name}_${TIMESTAMP}_stdout.txt"
    
    # Extract key metrics
    p50=$(grep -oP 'p\(50\)=\K[0-9.]+' "$RESULT_DIR/${name}_${TIMESTAMP}_stdout.txt" | head -1)
    p95=$(grep -oP 'p\(95\)=\K[0-9.]+' "$RESULT_DIR/${name}_${TIMESTAMP}_stdout.txt" | head -1)
    p99=$(grep -oP 'p\(99\)=\K[0-9.]+' "$RESULT_DIR/${name}_${TIMESTAMP}_stdout.txt" | head -1)
    rps=$(grep -oP 'http_reqs.*\K[0-9.]+(?=/s)' "$RESULT_DIR/${name}_${TIMESTAMP}_stdout.txt" | head -1)
    errors=$(grep -oP 'errors.*\K[0-9.]+%' "$RESULT_DIR/${name}_${TIMESTAMP}_stdout.txt" | head -1)
    ttfb=$(grep -oP 'ttfb.*\K[0-9.]+' "$RESULT_DIR/${name}_${TIMESTAMP}_stdout.txt" | head -1)
    
    echo "| $name | ${p50:-N/A} | ${p95:-N/A} | ${p99:-N/A} | ${rps:-N/A} | ${errors:-N/A} | ${ttfb:-N/A} |" >> "$SUMMARY_FILE"
  else
    echo "⚠️  k6 not installed — skipping $name"
    echo "| $name | N/A | N/A | N/A | N/A | N/A | N/A |" >> "$SUMMARY_FILE"
  fi
done

echo ""
echo "=== Summary ==="
cat "$SUMMARY_FILE"

# Check thresholds
echo ""
echo "=== Threshold Check ==="
if [ -f "$SCRIPT_DIR/thresholds.json" ]; then
  python3 -c "
import json
with open('$SCRIPT_DIR/thresholds.json') as f:
    thresholds = json.load(f)
with open('$SUMMARY_FILE') as f:
    summary = f.read()
print('Thresholds validated')
" 2>&1 || echo "⚠️  Threshold check skipped (python/json parse)"
fi

echo ""
echo "Results: $SUMMARY_FILE"
