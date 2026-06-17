#!/bin/sh
set -e
# Start the API server in background
node apps/api/src/server.js &
SERVER_PID=$!
sleep 2

# Run smoke benchmark (low concurrency, short duration)
BENCHMARK_SMOKE=true BENCHMARK_HOST=http://localhost:4000 node benchmarks/run.js
EXIT_CODE=$?

kill $SERVER_PID 2>/dev/null || true
exit $EXIT_CODE
