#!/bin/bash
# Wrapper for running benchmarks
# Usage: ./benchmarks/run.sh [--quick]

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR/.."

if [ ! -d "node_modules/autocannon" ]; then
  echo "Installing autocannon..."
  npm install --save-dev autocannon 2>/dev/null
fi

NODE_ENV=benchmark node benchmarks/runner.js "$@"
