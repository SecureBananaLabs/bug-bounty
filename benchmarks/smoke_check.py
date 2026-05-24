#!/usr/bin/env python3
"""
CI Smoke Benchmark Gate
=======================
Runs a low-concurrency benchmark and checks results against thresholds.json.
Exits non-zero if any endpoint exceeds its p99 latency or error rate threshold.

Usage:
  python benchmarks/smoke_check.py [--base-url URL]
"""

import json
import sys
from pathlib import Path

# Import the benchmark module
sys.path.insert(0, str(Path(__file__).parent))
from api_benchmark import (
    benchmark_endpoint, ENDPOINTS, DEFAULT_BASE_URL,
    DEFAULT_WARMUP, get_auth_token
)


def load_thresholds():
    """Load threshold definitions from thresholds.json."""
    threshold_path = Path(__file__).parent / "thresholds.json"
    if not threshold_path.exists():
        print("⚠ No thresholds.json found — skipping gate check")
        return {}
    with open(threshold_path) as f:
        return json.load(f)


def main():
    import argparse
    parser = argparse.ArgumentParser(description="CI smoke benchmark gate")
    parser.add_argument("--base-url", default=DEFAULT_BASE_URL)
    args = parser.parse_args()

    base_url = args.base_url.rstrip("/")
    thresholds = load_thresholds()

    print("=" * 60)
    print("  Smoke Benchmark Gate (low concurrency)")
    print("=" * 60)
    print(f"  Base URL:     {base_url}")
    print(f"  Duration:     2s per endpoint")
    print(f"  Concurrency:  2 workers")
    print()

    auth_token = get_auth_token(base_url)
    failures = []

    for endpoint in ENDPOINTS:
        name = endpoint["name"]
        print(f"  Testing: {name} ...", end="", flush=True)

        result = benchmark_endpoint(base_url, endpoint, duration_s=2, concurrency=2, auth_token=auth_token)
        d = result.to_dict()

        p99 = d["latency"]["p99_ms"]
        err = d["error_rate_pct"]
        print(f"  p99={p99}ms err={err}%", end="")

        # Check against thresholds
        if name in thresholds:
            t = thresholds[name]
            max_p99 = t.get("p99_latency_ms", float("inf"))
            max_err = t.get("error_rate_pct", 100)

            if p99 > max_p99:
                print(f"  ❌ FAIL (p99 {p99} > {max_p99})")
                failures.append(f"{name}: p99 {p99}ms exceeds threshold {max_p99}ms")
            elif err > max_err:
                print(f"  ❌ FAIL (err {err}% > {max_err}%)")
                failures.append(f"{name}: error rate {err}% exceeds threshold {max_err}%")
            else:
                print(f"  ✓ PASS")
        else:
            print(f"  ⚠ No threshold")

    print()
    print("=" * 60)
    if failures:
        print("  ❌ SMOKE GATE FAILED")
        for f in failures:
            print(f"    - {f}")
        return 1
    else:
        print("  ✓ SMOKE GATE PASSED")
        return 0


if __name__ == "__main__":
    sys.exit(main())
