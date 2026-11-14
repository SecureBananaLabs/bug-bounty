#!/usr/bin/env python3
"""
API Benchmark Suite for FreelanceFlow
======================================

Measures latency percentiles (p50, p95, p99), throughput (RPS),
error rate, and time-to-first-byte (TTFB) for all platform API endpoints.

Usage:
    python benchmarks/benchmark.py                 # Run full suite
    python benchmarks/benchmark.py --suite auth    # Run auth suite only
    python benchmarks/benchmark.py --smoke         # CI smoke test (low concurrency)
    python benchmarks/benchmark.py --report        # Print last report as markdown

Environment:
    Copy benchmarks/.env.benchmark.template to benchmarks/.env.benchmark
    and edit values, or set environment variables directly.
"""

import argparse
import json
import os
import statistics
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

def load_env(path: str | None = None) -> dict[str, str]:
    """Load .env.benchmark file into a dict (simple key=value parser)."""
    env: dict[str, str] = {}
    if path is None:
        path = os.path.join(os.path.dirname(__file__), ".env.benchmark")
    if os.path.exists(path):
        with open(path) as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                if "=" in line:
                    k, v = line.split("=", 1)
                    env[k.strip()] = v.strip().strip('"').strip("'")
    return env


_env = load_env()

BASE_URL = os.getenv("BENCHMARK_BASE_URL", _env.get("BENCHMARK_BASE_URL", "http://localhost:3000"))
CONNECTIONS = int(os.getenv("BENCHMARK_CONNECTIONS", _env.get("BENCHMARK_CONNECTIONS", "10")))
DURATION = int(os.getenv("BENCHMARK_DURATION", _env.get("BENCHMARK_DURATION", "10")))
AUTH_TOKEN = os.getenv("BENCHMARK_AUTH_TOKEN", _env.get("BENCHMARK_AUTH_TOKEN", ""))
RAMP_UP = float(os.getenv("BENCHMARK_RAMP_UP", _env.get("BENCHMARK_RAMP_UP", "0")))
OUTPUT_DIR = os.getenv("BENCHMARK_OUTPUT_DIR", _env.get("BENCHMARK_OUTPUT_DIR", os.path.join(os.path.dirname(__file__), "results")))

# Smoke mode uses lower concurrency / shorter duration for CI
SMOKE_CONNECTIONS = int(os.getenv("BENCHMARK_SMOKE_CONNECTIONS", _env.get("BENCHMARK_SMOKE_CONNECTIONS", "2")))
SMOKE_DURATION = int(os.getenv("BENCHMARK_SMOKE_DURATION", _env.get("BENCHMARK_SMOKE_DURATION", "3")))

THRESHOLDS_PATH = os.path.join(os.path.dirname(__file__), "thresholds.json")

# ---------------------------------------------------------------------------
# Endpoint Definitions
# ---------------------------------------------------------------------------

REALISTIC_PAYLOADS = {
    "register": {
        "email": "benchuser@example.com",
        "password": "BenchP@ss123!",
        "name": "Benchmark User",
        "role": "freelancer",
    },
    "login": {
        "email": "benchuser@example.com",
        "password": "BenchP@ss123!",
    },
    "refresh": {
        "refreshToken": "bench-refresh-token-placeholder",
    },
    "create_job": {
        "title": "Senior React Developer Needed",
        "description": "We need an experienced React developer for a 3-month project building a SaaS dashboard. Must have 5+ years of experience with React, TypeScript, and GraphQL.",
        "budget": 5000,
        "currency": "USD",
        "skills": ["react", "typescript", "graphql", "node.js"],
        "duration": "3 months",
        "type": "fixed",
    },
    "create_proposal": {
        "jobId": "000000000000000000000001",
        "coverLetter": "I am very interested in this project and have extensive experience with React and TypeScript.",
        "bidAmount": 4500,
        "estimatedDuration": "2.5 months",
    },
    "create_payment": {
        "amount": 4500,
        "currency": "USD",
        "proposalId": "000000000000000000000001",
        "method": "card",
    },
    "create_review": {
        "jobId": "000000000000000000000001",
        "rating": 5,
        "comment": "Excellent work! Very professional and delivered on time.",
    },
    "post_message": {
        "recipientId": "000000000000000000000002",
        "content": "Hi, I wanted to follow up on the project proposal.",
        "jobId": "000000000000000000000001",
    },
    "post_notification": {
        "userId": "000000000000000000000001",
        "type": "proposal_received",
        "title": "New Proposal",
        "body": "You received a new proposal for your job posting.",
    },
    "create_user": {
        "email": "newuser@example.com",
        "name": "New User",
        "role": "client",
        "password": "SecureP@ss456!",
    },
}


def get_endpoints() -> dict[str, list[dict[str, Any]]]:
    """Return all API endpoints grouped by suite."""
    return {
        "health": [
            {
                "name": "GET /health",
                "method": "GET",
                "path": "/health",
                "auth": False,
            },
        ],
        "auth": [
            {
                "name": "POST /api/auth/register",
                "method": "POST",
                "path": "/api/auth/register",
                "body": REALISTIC_PAYLOADS["register"],
                "auth": False,
            },
            {
                "name": "POST /api/auth/login",
                "method": "POST",
                "path": "/api/auth/login",
                "body": REALISTIC_PAYLOADS["login"],
                "auth": False,
            },
            {
                "name": "POST /api/auth/refresh",
                "method": "POST",
                "path": "/api/auth/refresh",
                "body": REALISTIC_PAYLOADS["refresh"],
                "auth": False,
            },
        ],
        "users": [
            {
                "name": "GET /api/users",
                "method": "GET",
                "path": "/api/users",
                "auth": True,
            },
            {
                "name": "POST /api/users",
                "method": "POST",
                "path": "/api/users",
                "body": REALISTIC_PAYLOADS["create_user"],
                "auth": True,
            },
        ],
        "jobs": [
            {
                "name": "GET /api/jobs",
                "method": "GET",
                "path": "/api/jobs",
                "auth": False,
            },
            {
                "name": "POST /api/jobs",
                "method": "POST",
                "path": "/api/jobs",
                "body": REALISTIC_PAYLOADS["create_job"],
                "auth": True,
            },
        ],
        "proposals": [
            {
                "name": "GET /api/proposals",
                "method": "GET",
                "path": "/api/proposals",
                "auth": True,
            },
            {
                "name": "POST /api/proposals",
                "method": "POST",
                "path": "/api/proposals",
                "body": REALISTIC_PAYLOADS["create_proposal"],
                "auth": True,
            },
        ],
        "payments": [
            {
                "name": "POST /api/payments",
                "method": "POST",
                "path": "/api/payments",
                "body": REALISTIC_PAYLOADS["create_payment"],
                "auth": True,
            },
        ],
        "reviews": [
            {
                "name": "GET /api/reviews",
                "method": "GET",
                "path": "/api/reviews",
                "auth": False,
            },
            {
                "name": "POST /api/reviews",
                "method": "POST",
                "path": "/api/reviews",
                "body": REALISTIC_PAYLOADS["create_review"],
                "auth": True,
            },
        ],
        "messages": [
            {
                "name": "GET /api/messages",
                "method": "GET",
                "path": "/api/messages",
                "auth": True,
            },
            {
                "name": "POST /api/messages",
                "method": "POST",
                "path": "/api/messages",
                "body": REALISTIC_PAYLOADS["post_message"],
                "auth": True,
            },
        ],
        "notifications": [
            {
                "name": "GET /api/notifications",
                "method": "GET",
                "path": "/api/notifications",
                "auth": True,
            },
            {
                "name": "POST /api/notifications",
                "method": "POST",
                "path": "/api/notifications",
                "body": REALISTIC_PAYLOADS["post_notification"],
                "auth": True,
            },
        ],
        "uploads": [
            {
                "name": "POST /api/uploads",
                "method": "POST",
                "path": "/api/uploads",
                "files": {"file": ("test.txt", b"benchmark upload payload " * 100, "text/plain")},
                "auth": True,
            },
        ],
        "search": [
            {
                "name": "GET /api/search?q=developer",
                "method": "GET",
                "path": "/api/search",
                "params": {"q": "developer"},
                "auth": False,
            },
        ],
        "admin": [
            {
                "name": "GET /api/admin/metrics",
                "method": "GET",
                "path": "/api/admin/metrics",
                "auth": True,
            },
        ],
    }


# ---------------------------------------------------------------------------
# HTTP Session Factory
# ---------------------------------------------------------------------------

def make_session() -> requests.Session:
    """Create a requests.Session with connection pooling and retries."""
    s = requests.Session()
    retries = Retry(total=2, backoff_factor=0.1, status_forcelist=[502, 503, 504])
    adapter = HTTPAdapter(
        max_retries=retries,
        pool_connections=CONNECTIONS + 5,
        pool_maxsize=CONNECTIONS + 5,
    )
    s.mount("http://", adapter)
    s.mount("https://", adapter)
    return s


# ---------------------------------------------------------------------------
# Single-Request Worker
# ---------------------------------------------------------------------------

def fire_request(session: requests.Session, endpoint: dict[str, Any]) -> dict[str, Any]:
    """Execute a single HTTP request and return timing metadata."""
    url = BASE_URL.rstrip("/") + endpoint["path"]
    headers: dict[str, str] = {}
    if endpoint.get("auth") and AUTH_TOKEN:
        headers["Authorization"] = f"Bearer {AUTH_TOKEN}"

    kwargs: dict[str, Any] = {
        "method": endpoint["method"],
        "url": url,
        "headers": headers,
        "timeout": 30,
    }
    if "body" in endpoint:
        kwargs["json"] = endpoint["body"]
    if "params" in endpoint:
        kwargs["params"] = endpoint["params"]
    if "files" in endpoint:
        kwargs["files"] = endpoint["files"]
        kwargs.pop("json", None)  # multipart overrides json

    start = time.perf_counter()
    ttfb: float | None = None
    status = 0
    error = None
    try:
        resp = requests.request(**kwargs)
        status = resp.status_code
        # TTFB is approximated by the time elapsed before response body starts
        ttfb = resp.elapsed.total_seconds() * 1000  # ms
    except Exception as exc:
        error = str(exc)
    elapsed = (time.perf_counter() - start) * 1000  # ms

    return {
        "latency_ms": round(elapsed, 3),
        "ttfb_ms": round(ttfb, 3) if ttfb is not None else None,
        "status": status,
        "error": error,
    }


# ---------------------------------------------------------------------------
# Benchmark Runner
# ---------------------------------------------------------------------------

def benchmark_endpoint(
    endpoint: dict[str, Any],
    connections: int,
    duration: int,
) -> dict[str, Any]:
    """Run a sustained-load benchmark against one endpoint."""
    session = make_session()
    results: list[dict[str, Any]] = []
    start_time = time.monotonic()
    request_count = 0

    # Use ThreadPoolExecutor for concurrent requests
    with ThreadPoolExecutor(max_workers=connections) as pool:
        futures = {}
        while time.monotonic() - start_time < duration:
            # Submit batches of requests up to connection count
            while len(futures) < connections * 2:
                f = pool.submit(fire_request, session, endpoint)
                futures[f] = time.monotonic()

            # Collect completed
            done = [f for f in futures if f.done()]
            for f in done:
                results.append(f.result())
                del futures[f]
                request_count += 1

            if not done:
                # Small sleep to avoid busy-spin
                time.sleep(0.005)

        # Drain remaining futures
        for f in as_completed(futures):
            results.append(f.result())
            request_count += 1

    elapsed_total = time.monotonic() - start_time

    # Compute metrics
    latencies = [r["latency_ms"] for r in results]
    ttfbs = [r["ttfb_ms"] for r in results if r["ttfb_ms"] is not None]
    errors = [r for r in results if r.get("error") or r["status"] >= 400]

    if not latencies:
        return {
            "name": endpoint["name"],
            "method": endpoint["method"],
            "path": endpoint["path"],
            "error": "No requests completed",
        }

    def percentile(data: list[float], pct: float) -> float:
        """Calculate percentile using nearest-rank method."""
        if not data:
            return 0.0
        sorted_data = sorted(data)
        k = (len(sorted_data) - 1) * (pct / 100.0)
        f = int(k)
        c = f + 1
        if c >= len(sorted_data):
            return round(sorted_data[-1], 2)
        d = k - f
        return round(sorted_data[f] + d * (sorted_data[c] - sorted_data[f]), 2)

    result = {
        "name": endpoint["name"],
        "method": endpoint["method"],
        "path": endpoint["path"],
        "total_requests": len(results),
        "duration_s": round(elapsed_total, 2),
        "rps": round(len(results) / elapsed_total, 2) if elapsed_total > 0 else 0,
        "latency": {
            "min": round(min(latencies), 2),
            "max": round(max(latencies), 2),
            "mean": round(statistics.mean(latencies), 2),
            "median": round(statistics.median(latencies), 2),
            "p50": percentile(latencies, 50),
            "p95": percentile(latencies, 95),
            "p99": percentile(latencies, 99),
            "stdev": round(statistics.stdev(latencies), 2) if len(latencies) > 1 else 0,
        },
        "ttfb": {
            "min": round(min(ttfbs), 2) if ttfbs else None,
            "max": round(max(ttfbs), 2) if ttfbs else None,
            "mean": round(statistics.mean(ttfbs), 2) if ttfbs else None,
            "p50": percentile(ttfbs, 50) if ttfbs else None,
            "p95": percentile(ttfbs, 95) if ttfbs else None,
            "p99": percentile(ttfbs, 99) if ttfbs else None,
        },
        "error_rate": round(len(errors) / len(results) * 100, 2) if results else 0,
        "error_count": len(errors),
        "status_distribution": {},
    }

    # Status code distribution
    for r in results:
        code = str(r["status"])
        result["status_distribution"][code] = result["status_distribution"].get(code, 0) + 1

    return result


# ---------------------------------------------------------------------------
# Threshold Checker (Regression Gate)
# ---------------------------------------------------------------------------

def load_thresholds() -> dict[str, Any]:
    """Load threshold configuration from JSON."""
    if os.path.exists(THRESHOLDS_PATH):
        with open(THRESHOLDS_PATH) as f:
            return json.load(f)
    return {}


def check_thresholds(results: list[dict[str, Any]], thresholds: dict[str, Any]) -> tuple[bool, list[str]]:
    """Return (passed, violations) by checking results against thresholds."""
    violations: list[str] = []
    defaults = thresholds.get("_defaults", {})
    max_p99 = defaults.get("max_p99_ms", 2000)
    max_error_rate = defaults.get("max_error_rate_pct", 5.0)
    min_rps = defaults.get("min_rps", 1)

    for r in results:
        if "error" in r and "latency" not in r:
            violations.append(f"{r['name']}: {r['error']}")
            continue

        name = r["name"]
        endpoint_thresholds = thresholds.get(name, {})
        ep_max_p99 = endpoint_thresholds.get("max_p99_ms", max_p99)
        ep_max_error = endpoint_thresholds.get("max_error_rate_pct", max_error_rate)
        ep_min_rps = endpoint_thresholds.get("min_rps", min_rps)

        if r["latency"]["p99"] > ep_max_p99:
            violations.append(f"{name}: p99 latency {r['latency']['p99']}ms > threshold {ep_max_p99}ms")
        if r["error_rate"] > ep_max_error:
            violations.append(f"{name}: error rate {r['error_rate']}% > threshold {ep_max_error}%")
        if r["rps"] < ep_min_rps:
            violations.append(f"{name}: RPS {r['rps']} < threshold {ep_min_rps}")

    return (len(violations) == 0, violations)


# ---------------------------------------------------------------------------
# Report Generators
# ---------------------------------------------------------------------------

def generate_json_report(results: list[dict[str, Any]], meta: dict[str, Any]) -> dict[str, Any]:
    """Produce the full JSON report."""
    return {
        "meta": meta,
        "results": results,
        "summary": {
            "total_endpoints": len(results),
            "total_requests": sum(r.get("total_requests", 0) for r in results),
            "avg_rps": round(statistics.mean([r["rps"] for r in results if "rps" in r]), 2) if results else 0,
            "overall_error_rate": round(
                statistics.mean([r["error_rate"] for r in results if "error_rate" in r]), 2
            ) if results else 0,
        },
    }


def generate_markdown_report(report: dict[str, Any]) -> str:
    """Produce a human-readable markdown summary."""
    meta = report["meta"]
    results = report["results"]
    summary = report["summary"]

    lines = [
        "# API Benchmark Report",
        "",
        f"**Date:** {meta.get('timestamp', 'N/A')}",
        f"**Base URL:** {meta.get('base_url', 'N/A')}",
        f"**Duration per endpoint:** {meta.get('duration_s', 'N/A')}s",
        f"**Concurrency:** {meta.get('connections', 'N/A')}",
        f"**Suite:** {meta.get('suite', 'all')}",
        "",
        "## Summary",
        "",
        f"| Metric | Value |",
        f"|--------|-------|",
        f"| Endpoints tested | {summary['total_endpoints']} |",
        f"| Total requests | {summary['total_requests']} |",
        f"| Average RPS | {summary['avg_rps']} |",
        f"| Overall error rate | {summary['overall_error_rate']}% |",
        "",
        "## Endpoint Results",
        "",
    ]

    for r in results:
        if "error" in r and "latency" not in r:
            lines.append(f"### {r['name']}")
            lines.append(f"**Error:** {r['error']}")
            lines.append("")
            continue

        lines.append(f"### {r['name']}")
        lines.append("")
        lines.append(f"| Metric | Value |")
        lines.append(f"|--------|-------|")
        lines.append(f"| Requests | {r['total_requests']} |")
        lines.append(f"| RPS | {r['rps']} |")
        lines.append(f"| Error rate | {r['error_rate']}% |")
        lines.append(f"| Latency p50 | {r['latency']['p50']} ms |")
        lines.append(f"| Latency p95 | {r['latency']['p95']} ms |")
        lines.append(f"| Latency p99 | {r['latency']['p99']} ms |")
        lines.append(f"| Latency mean | {r['latency']['mean']} ms |")
        lines.append(f"| Latency min | {r['latency']['min']} ms |")
        lines.append(f"| Latency max | {r['latency']['max']} ms |")
        if r["ttfb"]["mean"] is not None:
            lines.append(f"| TTFB mean | {r['ttfb']['mean']} ms |")
            lines.append(f"| TTFB p50 | {r['ttfb']['p50']} ms |")
            lines.append(f"| TTFB p95 | {r['ttfb']['p95']} ms |")
            lines.append(f"| TTFB p99 | {r['ttfb']['p99']} ms |")
        lines.append(f"| Status codes | {json.dumps(r.get('status_distribution', {}))} |")
        lines.append("")

    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(description="FreelanceFlow API Benchmark Suite")
    parser.add_argument("--suite", type=str, default="all", help="Suite to run (auth, jobs, health, etc.) or 'all'")
    parser.add_argument("--connections", type=int, default=None, help="Override concurrent connections")
    parser.add_argument("--duration", type=int, default=None, help="Override duration per endpoint (seconds)")
    parser.add_argument("--smoke", action="store_true", help="CI smoke-test mode (low concurrency, short duration)")
    parser.add_argument("--report", action="store_true", help="Print latest report from results/ directory")
    parser.add_argument("--output", type=str, default=None, help="Override output directory")
    parser.add_argument("--base-url", type=str, default=None, help="Override base URL")
    args = parser.parse_args()

    global BASE_URL, CONNECTIONS, DURATION, OUTPUT_DIR

    if args.base_url:
        BASE_URL = args.base_url
    if args.output:
        OUTPUT_DIR = args.output
    if args.connections:
        CONNECTIONS = args.connections
    if args.duration:
        DURATION = args.duration
    if args.smoke:
        CONNECTIONS = SMOKE_CONNECTIONS
        DURATION = SMOKE_DURATION

    # --report: just print last markdown report
    if args.report:
        report_dir = Path(OUTPUT_DIR)
        md_files = sorted(report_dir.glob("*.md"), key=lambda p: p.stat().st_mtime, reverse=True)
        if md_files:
            print(md_files[0].read_text())
        else:
            print("No reports found in", OUTPUT_DIR)
        return

    print(f"🚀 FreelanceFlow API Benchmark Suite")
    print(f"   Base URL:     {BASE_URL}")
    print(f"   Connections:  {CONNECTIONS}")
    print(f"   Duration:     {DURATION}s per endpoint")
    print(f"   Suite:        {args.suite}")
    print()

    all_endpoints = get_endpoints()

    # Select endpoints
    if args.suite == "all":
        selected: list[dict[str, Any]] = []
        for eps in all_endpoints.values():
            selected.extend(eps)
    else:
        keys = [k.strip() for k in args.suite.split(",")]
        selected = []
        for k in keys:
            if k in all_endpoints:
                selected.extend(all_endpoints[k])
            else:
                print(f"⚠️  Unknown suite '{k}', skipping")

    if not selected:
        print("No endpoints selected.")
        sys.exit(1)

    print(f"📋 Benchmarking {len(selected)} endpoint(s)...\n")

    results: list[dict[str, Any]] = []
    for i, ep in enumerate(selected, 1):
        print(f"  [{i}/{len(selected)}] {ep['name']} ... ", end="", flush=True)
        result = benchmark_endpoint(ep, CONNECTIONS, DURATION)
        results.append(result)
        if "error" in result and "latency" not in result:
            print(f"❌ {result['error']}")
        else:
            print(f"p50={result['latency']['p50']}ms  p99={result['latency']['p99']}ms  rps={result['rps']}  err={result['error_rate']}%")

    # Build report
    meta = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "base_url": BASE_URL,
        "connections": CONNECTIONS,
        "duration_s": DURATION,
        "suite": args.suite,
        "smoke_mode": args.smoke,
    }
    report = generate_json_report(results, meta)

    # Threshold check
    thresholds = load_thresholds()
    passed, violations = check_thresholds(results, thresholds)

    # Save outputs
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    ts = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    prefix = "smoke_" if args.smoke else ""

    json_path = os.path.join(OUTPUT_DIR, f"{prefix}benchmark_{ts}.json")
    md_path = os.path.join(OUTPUT_DIR, f"{prefix}benchmark_{ts}.md")
    latest_json = os.path.join(OUTPUT_DIR, f"{prefix}latest.json")
    latest_md = os.path.join(OUTPUT_DIR, f"{prefix}latest.md")

    with open(json_path, "w") as f:
        json.dump(report, f, indent=2)
    with open(latest_json, "w") as f:
        json.dump(report, f, indent=2)

    md_content = generate_markdown_report(report)
    with open(md_path, "w") as f:
        f.write(md_content)
    with open(latest_md, "w") as f:
        f.write(md_content)

    print(f"\n📊 Reports saved:")
    print(f"   JSON: {json_path}")
    print(f"   MD:   {md_path}")

    # Threshold gate
    if violations:
        print(f"\n❌ THRESHOLD GATE FAILED ({len(violations)} violation(s)):")
        for v in violations:
            print(f"   • {v}")
        if args.smoke:
            sys.exit(1)
    else:
        print(f"\n✅ All endpoints within thresholds.")

    print(f"\n{md_content}")


if __name__ == "__main__":
    main()
