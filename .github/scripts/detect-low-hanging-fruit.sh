#!/bin/bash

# Low Hanging Fruit Detection Script
# Recursively scans the repository for common low hanging fruit issues

set -e

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO_ROOT"

echo "🔍 Scanning for low hanging fruit issues..."

# Track findings
FINDINGS=()

# Check for TODO/FIXME comments in source code
echo "Checking for TODO/FIXME comments..."
TODO_FILES=$(grep -r -n "TODO\|FIXME" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" apps/ packages/ 2>/dev/null || true)
if [ -n "$TODO_FILES" ]; then
    FINDINGS+=("Found TODO/FIXME comments that may indicate incomplete features:")
    FINDINGS+=("$TODO_FILES")
fi

# Check for console.log statements in production code
echo "Checking for console.log statements..."
CONSOLE_LOGS=$(grep -r -n "console\.log" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" apps/ packages/ 2>/dev/null | grep -v "test\|spec\|\\.d\\.ts" || true)
if [ -n "$CONSOLE_LOGS" ]; then
    FINDINGS+=("Found console.log statements in production code:")
    FINDINGS+=("$CONSOLE_LOGS")
fi

# Check for empty catch blocks
echo "Checking for empty catch blocks..."
EMPTY_CATCH=$(grep -r -n "catch.*{[^a-zA-Z]*}" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" apps/ packages/ 2>/dev/null || true)
if [ -n "$EMPTY_CATCH" ]; then
    FINDINGS+=("Found potentially empty catch blocks:")
    FINDINGS+=("$EMPTY_CATCH")
fi

# Check for hardcoded secrets patterns
echo "Checking for hardcoded secrets..."
SECRETS=$(grep -r -n "password\|secret\|api_key\|apikey\|token" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" apps/ packages/ 2>/dev/null | grep -v "process\.env\|// " || true)
if [ -n "$SECRETS" ]; then
    FINDINGS+=("Found potential hardcoded secrets:")
    FINDINGS+=("$SECRETS")
fi

# Check for missing error handling in async functions
echo "Checking for missing error handling..."
ASYNC_NO_CATCH=$(grep -r -n "await " --include="*.ts" --include="*.tsx" apps/ packages/ 2>/dev/null | grep -v "try\|catch\|await.*\.catch" || true)
if [ -n "$ASYNC_NO_CATCH" ]; then
    FINDINGS+=("Found async/await without explicit error handling:")
    FINDINGS+=("$ASYNC_NO_CATCH")
fi

# Output findings
if [ ${#FINDINGS[@]} -gt 0 ]; then
    echo ""
    echo "📋 Low Hanging Fruit Findings:"
    echo "=============================="
    for finding in "${FINDINGS[@]}"; do
        echo "$finding"
    done
    echo "=============================="
    exit 0
else
    echo "✅ No low hanging fruit issues detected."
    exit 0
fi