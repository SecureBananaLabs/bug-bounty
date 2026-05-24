#!/usr/bin/env python3
"""
Comprehensive API Benchmark Suite for FreelanceFlow Platform
============================================================
Benchmarks all /api/* endpoints and /health with:
  - p50, p95, p99 latency (ms)
  - Requests per second (RPS) — peak and sustained
  - Error rate (%)
  - Time to first byte (TTFB)

Usage:
  python benchmarks/api_benchmark.py [--base-url URL] [--duration SECONDS] [--concurrency N]

Requirements:
  pip install requests statistics (stdlib — no external deps needed for core)
"""

import argparse
import json
import os
import statistics
import sys
import time
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urljoin

try:
    import requests
except ImportError:
    print("ERROR: 'requests' library is required. Install with: pip install requests")
    sys.exit(1)


# ─── Configuration ──────────────────────────────────────────────────────────

DEFAULT_BASE_URL = "http://localhost:3000"
DEFAULT_DURATION = 10          # seconds per endpoint
DEFAULT_CONCURRENCY = 10       # concurrent workers
DEFAULT_WARMUP = 2             # seconds warmup before measurement
RESULTS_DIR = Path(__file__).parent / "results"

# Endpoint definitions with method, path, payload, and auth requirement
ENDPOINTS = [
    # Health check
    {
        "name": "GET /health",
        "method": "GET",
        "path": "/health",
        "auth": False,
        "payload": None,
    },
    # Auth endpoints
    {
        "name": "POST /api/auth/register",
        "method": "POST",
        "path": "/api/auth/register",
        "auth": False,
        "payload": {
            "email": "benchmark_user@example.com",
            "password": "benchmark_password_123",
            "role": "client",
        },
    },
    {
        "name": "POST /api/auth/login",
        "method": "POST",
        "path": "/api/auth/login",
        "auth": False,
        "payload": {
            "email": "benchmark_user@example.com",
            "password": "benchmark_password_123",
        },
    },
    {
        "name": "GET /api/auth/oauth/:provider/callback",
        "method": "GET",
        "path": "/api/auth/oauth/google/callback",
        "auth": False,
        "payload": None,
    },
    {
        "name": "POST /api/auth/refresh",
        "method": "POST",
        "path": "/api/auth/refresh",
        "auth": False,
        "payload": {},
    },
    # User endpoints
    {
        "name": "GET /api/users",
        "method": "GET",
        "path": "/api/users",
        "auth": False,
        "payload": None,
    },
    {
        "name": "POST /api/users",
        "method": "POST",
        "path": "/api/users",
        "auth": False,
        "payload": {
            "email": "newuser@example.com",
            "name": "Benchmark User",
            "role": "freelancer",
        },
    },
    # Job endpoints
    {
        "name": "GET /api/jobs",
        "method": "GET",
        "path": "/api/jobs",
        "auth": False,
        "payload": None,
    },
    {
        "name": "POST /api/jobs",
        "method": "POST",
        "path": "/api/jobs",
        "auth": False,
        "payload": {
            "title": "Benchmark Job",
            "description": "Performance testing job posting",
            "budget": 1000,
            "skills": ["python", "javascript"],
        },
    },
    # Proposal endpoints
    {
        "name": "GET /api/proposals",
        "method": "GET",
        "path": "/api/proposals",
        "auth": False,
        "payload": None,
    },
    {
        "name": "POST /api/proposals",
        "method": "POST",
        "path": "/api/proposals",
        "auth": False,
        "payload": {
            "jobId": "benchmark-job-id",
            "coverLetter": "Benchmark proposal cover letter",
            "price": 500,
        },
    },
    # Payment endpoints
    {
        "name": "POST /api/payments",
        "method": "POST",
        "path": "/api/payments",
        "auth": False,
        "payload": {
            "amount": 100,
            "currency": "USD",
            "recipientId": "benchmark-recipient",
        },
    },
    # Review endpoints
    {
        "name": "GET /api/reviews",
        "method": "GET",
        "path": "/api/reviews",
        "auth": False,
        "payload": None,
    },
    {
        "name": "POST /api/reviews",
        "method": "POST",
        "path": "/api/reviews",
        "auth": False,
        "payload": {
            "targetId": "benchmark-target",
            "rating": 5,
            "comment": "Excellent work on the benchmark project",
        },
    },
    # Message endpoints
    {
        "name": "GET /api/messages",
        "method": "GET",
        "path": "/api/messages",
        "auth": False,
        "payload": None,
    },
    {
        "name": "POST /api/messages",
        "method": "POST",
        "path": "/api/messages",
        "auth": False,
        "payload": {
            "recipientId": "benchmark-recipient",
            "content": "Benchmark message content for load testing",
        },
    },
    # Notification endpoints
    {
        "name": "GET /api/notifications",
        "method": "GET",
        "path": "/api/notifications",
        "auth": False,
        "payload": None,
    },
    {
        "name": "POST /api/notifications",
        "method": "POST",
        "path": "/api/notifications",
        "auth": False,
        "payload": {
            "userId": "benchmark-user",
            "type": "info",
            "message": "Benchmark notification",
        },
    },
    # Upload endpoints
    {
        "name": "POST /api/uploads",
        "method": "POST",
        "path": "/api/uploads",
        "auth": False,
        "payload": None,  # multipart handled separately
        "is_multipart": True,
    },
    # Search endpoints
    {
        "name": "GET /api/search",
        "method": "GET",
        "path": "/api/search?q=benchmark",
        "auth": False,
        "payload": None,
    },
    # Admin endpoints (require auth)
    {
        "name": "GET /api/admin/metrics",
        "method": "GET",
        "path": "/api/admin/metrics",
        "auth": True,
        "payload": None,
    },
]


# ─── Utility Functions ──────────────────────────────────────────────────────

def percentile(data, p):
    """Calculate the p-th percentile of a sorted list."""
    if not data:
        return 0.0
    sorted_data = sorted(data)
    k = (len(sorted_data) - 1) * (p / 100.0)
    f = int(k)
    c = f + 1
    if c >= len(sorted_data):
        return sorted_data[-1]
    d = k - f
    return sorted_data[f] + d * (sorted_data[c] - sorted_data[f])


def format_ms(ms):
    """Format milliseconds with appropriate precision."""
    if ms < 1:
        return f"{ms:.3f}"
    elif ms < 10:
        return f"{ms:.2f}"
    else:
        return f"{ms:.1f}"


def get_auth_token(base_url):
    """Attempt to get an auth token for protected endpoints."""
    try:
        resp = requests.post(
            f"{base_url}/api/auth/register",
            json={
                "email": f"bench_{int(time.time())}@example.com",
                "password": "benchmark_password_123",
                "role": "admin",
            },
            timeout=5,
        )
        if resp.status_code in (200, 201):
            data = resp.json()
            return data.get("accessToken") or data.get("token") or data.get("data", {}).get("accessToken")
    except Exception:
        pass
    return None


# ─── Benchmark Worker ───────────────────────────────────────────────────────

class BenchmarkResult:
    """Collects timing data for a single endpoint benchmark."""

    def __init__(self, name):
        self.name = name
        self.latencies = []       # total request time in ms
        self.ttfbs = []           # time to first byte in ms
        self.errors = 0
        self.successes = 0
        self.status_codes = {}
        self.start_time = None
        self.end_time = None

    def record(self, latency_ms, ttfb_ms, status_code, is_error):
        self.latencies.append(latency_ms)
        self.ttfbs.append(ttfb_ms)
        code_key = str(status_code)
        self.status_codes[code_key] = self.status_codes.get(code_key, 0) + 1
        if is_error:
            self.errors += 1
        else:
            self.successes += 1

    def total_requests(self):
        return self.errors + self.successes

    def to_dict(self):
        total = self.total_requests()
        elapsed = (self.end_time - self.start_time) if self.start_time and self.end_time else 1
        sorted_lat = sorted(self.latencies) if self.latencies else [0]
        sorted_ttfb = sorted(self.ttfbs) if self.ttfbs else [0]

        return {
            "endpoint": self.name,
            "total_requests": total,
            "successful_requests": self.successes,
            "failed_requests": self.errors,
            "error_rate_pct": round((self.errors / total * 100) if total else 0, 2),
            "latency": {
                "p50_ms": round(percentile(sorted_lat, 50), 2),
                "p95_ms": round(percentile(sorted_lat, 95), 2),
                "p99_ms": round(percentile(sorted_lat, 99), 2),
                "min_ms": round(min(sorted_lat), 2) if sorted_lat else 0,
                "max_ms": round(max(sorted_lat), 2) if sorted_lat else 0,
                "mean_ms": round(statistics.mean(sorted_lat), 2) if sorted_lat else 0,
                "stdev_ms": round(statistics.stdev(sorted_lat), 2) if len(sorted_lat) > 1 else 0,
            },
            "ttfb": {
                "p50_ms": round(percentile(sorted_ttfb, 50), 2),
                "p95_ms": round(percentile(sorted_ttfb, 95), 2),
                "p99_ms": round(percentile(sorted_ttfb, 99), 2),
                "min_ms": round(min(sorted_ttfb), 2) if sorted_ttfb else 0,
                "max_ms": round(max(sorted_ttfb), 2) if sorted_ttfb else 0,
                "mean_ms": round(statistics.mean(sorted_ttfb), 2) if sorted_ttfb else 0,
            },
            "throughput": {
                "rps_peak": round(total / elapsed, 2) if elapsed > 0 else 0,
                "total_duration_s": round(elapsed, 2),
            },
            "status_codes": self.status_codes,
        }


def make_request(session, base_url, endpoint, auth_token=None):
    """Execute a single HTTP request and return timing data."""
    url = urljoin(base_url, endpoint["path"])
    method = endpoint["method"]
    headers = {}
    if endpoint.get("auth") and auth_token:
        headers["Authorization"] = f"Bearer {auth_token}"

    payload = endpoint.get("payload")
    is_multipart = endpoint.get("is_multipart", False)

    ttfb_ms = 0
    latency_ms = 0
    status_code = 0
    is_error = False

    try:
        start = time.perf_counter()

        if is_multipart:
            # Simulate a small file upload
            files = {"file": ("bench.txt", b"x" * 1024, "text/plain")}
            resp = session.request(method, url, files=files, headers=headers, timeout=30)
        elif payload is not None:
            resp = session.request(method, url, json=payload, headers=headers, timeout=30)
        else:
            resp = session.request(method, url, headers=headers, timeout=30)

        # Approximate TTFB as time until headers are received (requests doesn't
        # expose true TTFB, so we use elapsed which includes header time)
        ttfb_ms = resp.elapsed.total_seconds() * 1000
        end = time.perf_counter()
        latency_ms = (end - start) * 1000
        status_code = resp.status_code
        is_error = status_code >= 400

    except requests.exceptions.ConnectionError:
        end = time.perf_counter()
        latency_ms = (end - start) * 1000
        status_code = 0
        is_error = True
    except requests.exceptions.Timeout:
        end = time.perf_counter()
        latency_ms = (end - start) * 1000
        status_code = 408
        is_error = True
    except Exception:
        end = time.perf_counter()
        latency_ms = (end - start) * 1000
        status_code = 0
        is_error = True

    return latency_ms, ttfb_ms, status_code, is_error


def benchmark_endpoint(base_url, endpoint, duration_s, concurrency, auth_token=None):
    """Benchmark a single endpoint for the given duration with concurrency."""
    result = BenchmarkResult(endpoint["name"])
    stop_event = threading.Event()

    def worker():
        session = requests.Session()
        while not stop_event.is_set():
            lat, ttfb, code, err = make_request(session, base_url, endpoint, auth_token)
            result.record(lat, ttfb, code, err)

    result.start_time = time.perf_counter()

    with ThreadPoolExecutor(max_workers=concurrency) as executor:
        futures = [executor.submit(worker) for _ in range(concurrency)]
        time.sleep(duration_s)
        stop_event.set()
        for f in as_completed(futures):
            try:
                f.result()
            except Exception:
                pass

    result.end_time = time.perf_counter()
    return result


# ─── Markdown Report Generator ──────────────────────────────────────────────

def generate_markdown_report(results, metadata):
    """Generate a human-readable markdown summary of benchmark results."""
    lines = []
    lines.append("# API Benchmark Report")
    lines.append("")
    lines.append(f"**Generated:** {metadata['timestamp']}")
    lines.append(f"**Base URL:** {metadata['base_url']}")
    lines.append(f"**Duration per endpoint:** {metadata['duration']}s")
    lines.append(f"**Concurrency:** {metadata['concurrency']}")
    lines.append("")
    lines.append("---")
    lines.append("")
    lines.append("## Environment")
    lines.append("")
    lines.append(f"- **OS:** {metadata.get('os', 'unknown')}")
    lines.append(f"- **Python:** {metadata.get('python_version', 'unknown')}")
    lines.append(f"- **Machine:** {metadata.get('machine', 'unknown')}")
    lines.append("")
    lines.append("---")
    lines.append("")
    lines.append("## Results Summary")
    lines.append("")
    lines.append("| Endpoint | Req/s | p50 (ms) | p95 (ms) | p99 (ms) | TTFB p50 (ms) | Error Rate |")
    lines.append("|----------|-------|----------|----------|----------|---------------|------------|")

    for r in results:
        d = r.to_dict()
        lines.append(
            f"| {d['endpoint']} "
            f"| {d['throughput']['rps_peak']} "
            f"| {d['latency']['p50_ms']} "
            f"| {d['latency']['p95_ms']} "
            f"| {d['latency']['p99_ms']} "
            f"| {d['ttfb']['p50_ms']} "
            f"| {d['error_rate_pct']}% |"
        )

    lines.append("")
    lines.append("---")
    lines.append("")

    # Detailed per-endpoint breakdown
    lines.append("## Detailed Results")
    lines.append("")

    for r in results:
        d = r.to_dict()
        lines.append(f"### {d['endpoint']}")
        lines.append("")
        lines.append(f"- **Total Requests:** {d['total_requests']}")
        lines.append(f"- **Successful:** {d['successful_requests']}")
        lines.append(f"- **Failed:** {d['failed_requests']}")
        lines.append(f"- **Error Rate:** {d['error_rate_pct']}%")
        lines.append("")
        lines.append("**Latency:**")
        lines.append(f"  - p50: {d['latency']['p50_ms']} ms")
        lines.append(f"  - p95: {d['latency']['p95_ms']} ms")
        lines.append(f"  - p99: {d['latency']['p99_ms']} ms")
        lines.append(f"  - min: {d['latency']['min_ms']} ms")
        lines.append(f"  - max: {d['latency']['max_ms']} ms")
        lines.append(f"  - mean: {d['latency']['mean_ms']} ms")
        lines.append(f"  - stdev: {d['latency']['stdev_ms']} ms")
        lines.append("")
        lines.append("**TTFB:**")
        lines.append(f"  - p50: {d['ttfb']['p50_ms']} ms")
        lines.append(f"  - p95: {d['ttfb']['p95_ms']} ms")
        lines.append(f"  - p99: {d['ttfb']['p99_ms']} ms")
        lines.append("")
        lines.append(f"**Throughput:** {d['throughput']['rps_peak']} req/s over {d['throughput']['total_duration_s']}s")
        lines.append("")
        lines.append(f"**Status Codes:** {d['status_codes']}")
        lines.append("")

    return "\n".join(lines)


# ─── Main ───────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Benchmark all API endpoints")
    parser.add_argument("--base-url", default=os.environ.get("BENCHMARK_URL", DEFAULT_BASE_URL),
                        help=f"Base URL of the API (default: {DEFAULT_BASE_URL})")
    parser.add_argument("--duration", type=int, default=int(os.environ.get("BENCHMARK_DURATION", DEFAULT_DURATION)),
                        help=f"Duration in seconds per endpoint (default: {DEFAULT_DURATION})")
    parser.add_argument("--concurrency", type=int, default=int(os.environ.get("BENCHMARK_CONCURRENCY", DEFAULT_CONCURRENCY)),
                        help=f"Number of concurrent workers (default: {DEFAULT_CONCURRENCY})")
    parser.add_argument("--output-dir", default=str(RESULTS_DIR),
                        help=f"Directory to write results (default: {RESULTS_DIR})")
    parser.add_argument("--smoke", action="store_true",
                        help="Smoke mode: low concurrency, short duration for CI")
    args = parser.parse_args()

    if args.smoke:
        args.duration = min(args.duration, 2)
        args.concurrency = min(args.concurrency, 2)

    base_url = args.base_url.rstrip("/")
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    print(f"=" * 70)
    print(f"  API Benchmark Suite — FreelanceFlow Platform")
    print(f"=" * 70)
    print(f"  Base URL:     {base_url}")
    print(f"  Duration:     {args.duration}s per endpoint")
    print(f"  Concurrency:  {args.concurrency} workers")
    print(f"  Endpoints:    {len(ENDPOINTS)}")
    print(f"=" * 70)
    print()

    # Attempt to get auth token for protected endpoints
    auth_token = get_auth_token(base_url)
    if auth_token:
        print("  ✓ Auth token obtained for protected endpoints")
    else:
        print("  ⚠ No auth token — admin/metrics may return 401")
    print()

    # Collect metadata
    metadata = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "base_url": base_url,
        "duration": args.duration,
        "concurrency": args.concurrency,
        "os": f"{sys.platform}",
        "python_version": sys.version.split()[0],
        "machine": os.uname().machine if hasattr(os, 'uname') else 'unknown',
        "smoke_mode": args.smoke,
    }

    results = []

    for i, endpoint in enumerate(ENDPOINTS, 1):
        print(f"  [{i}/{len(ENDPOINTS)}] Benchmarking: {endpoint['name']} ...", end="", flush=True)
        result = benchmark_endpoint(
            base_url, endpoint, args.duration, args.concurrency, auth_token
        )
        d = result.to_dict()
        print(f"  {d['throughput']['rps_peak']} req/s | p99={d['latency']['p99_ms']}ms | err={d['error_rate_pct']}%")
        results.append(result)

    # Generate outputs
    print()
    print(f"  Writing results to {output_dir}/")

    # JSON output
    json_output = {
        "metadata": metadata,
        "results": [r.to_dict() for r in results],
    }
    json_path = output_dir / "benchmark_results.json"
    with open(json_path, "w") as f:
        json.dump(json_output, f, indent=2)
    print(f"    → {json_path}")

    # Markdown output
    md_report = generate_markdown_report(results, metadata)
    md_path = output_dir / "benchmark_results.md"
    with open(md_path, "w") as f:
        f.write(md_report)
    print(f"    → {md_path}")

    print()
    print(f"=" * 70)
    print(f"  Benchmark Complete!")
    print(f"=" * 70)

    # Print summary table
    print()
    print(f"  {'Endpoint':<40} {'RPS':>8} {'p50':>8} {'p95':>8} {'p99':>8} {'TTFB':>8} {'Err%':>8}")
    print(f"  {'-'*40} {'-'*8} {'-'*8} {'-'*8} {'-'*8} {'-'*8} {'-'*8}")
    for r in results:
        d = r.to_dict()
        name = d['endpoint'][:40]
        print(f"  {name:<40} {d['throughput']['rps_peak']:>8} "
              f"{d['latency']['p50_ms']:>7}ms {d['latency']['p95_ms']:>7}ms "
              f"{d['latency']['p99_ms']:>7}ms {d['ttfb']['p50_ms']:>7}ms "
              f"{d['error_rate_pct']:>7}%")
    print()

    return 0


if __name__ == "__main__":
    sys.exit(main())
