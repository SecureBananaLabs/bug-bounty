"""API Endpoint Latency & Throughput Benchmark Suite (Issue #30 Bounty Solution).

Measures p50, p95, p99 latency (ms), Time-To-First-Byte (TTFB), Requests Per Second (RPS),
and error rate across `/api/` endpoints using concurrent workers and outputs a reproducible
Markdown and JSON regression report.
"""

from __future__ import annotations

import concurrent.futures
import json
import math
import statistics
import time
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any, Dict, List, Optional


def percentile(sorted_values: List[float], pct: float) -> float:
    """Compute exact percentile from a sorted list of floats."""
    if not sorted_values:
        return 0.0
    k = (len(sorted_values) - 1) * (pct / 100.0)
    f = math.floor(k)
    c = math.ceil(k)
    if f == c:
        return round(sorted_values[int(k)], 3)
    return round(sorted_values[f] * (c - k) + sorted_values[c] * (k - f), 3)


def probe_single_request(
    url: str,
    method: str = "GET",
    headers: Optional[Dict[str, str]] = None,
    payload: Optional[bytes] = None,
    timeout: float = 5.0,
) -> Dict[str, Any]:
    """Execute one HTTP request and record TTFB and total latency in ms."""
    req = urllib.request.Request(url, data=payload, headers=headers or {}, method=method)
    start = time.perf_counter()
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            first_byte = resp.read(1)
            ttfb_ms = (time.perf_counter() - start) * 1000.0
            _ = first_byte + resp.read()
            total_ms = (time.perf_counter() - start) * 1000.0
            return {
                "ok": 200 <= resp.status < 400,
                "status": resp.status,
                "ttfb_ms": ttfb_ms,
                "latency_ms": total_ms,
            }
    except urllib.error.HTTPError as exc:
        elapsed = (time.perf_counter() - start) * 1000.0
        return {"ok": False, "status": exc.code, "ttfb_ms": elapsed, "latency_ms": elapsed}
    except Exception:
        elapsed = (time.perf_counter() - start) * 1000.0
        return {"ok": False, "status": 0, "ttfb_ms": elapsed, "latency_ms": elapsed}


def benchmark_endpoint(
    url: str,
    total_requests: int = 50,
    concurrency: int = 10,
    method: str = "GET",
    auth_token: Optional[str] = None,
) -> Dict[str, Any]:
    """Run concurrent load against an endpoint and compute p50/p95/p99, TTFB, RPS, and error rate."""
    headers = {"User-Agent": "APIBenchmarkSuite/1.0"}
    if auth_token:
        headers["Authorization"] = f"Bearer {auth_token}"

    wall_start = time.perf_counter()
    with concurrent.futures.ThreadPoolExecutor(max_workers=concurrency) as pool:
        futures = [
            pool.submit(probe_single_request, url, method, headers)
            for _ in range(total_requests)
        ]
        results = [f.result() for f in futures]
    wall_seconds = max(time.perf_counter() - wall_start, 1e-6)

    latencies = sorted(r["latency_ms"] for r in results)
    ttfbs = sorted(r["ttfb_ms"] for r in results)
    errors = sum(1 for r in results if not r["ok"])

    return {
        "endpoint": url,
        "method": method,
        "requests": total_requests,
        "concurrency": concurrency,
        "p50_ms": percentile(latencies, 50),
        "p95_ms": percentile(latencies, 95),
        "p99_ms": percentile(latencies, 99),
        "mean_ttfb_ms": round(statistics.mean(ttfbs), 3) if ttfbs else 0.0,
        "rps": round(total_requests / wall_seconds, 2),
        "error_rate_pct": round((errors / max(total_requests, 1)) * 100.0, 2),
    }


def render_markdown_report(metrics: List[Dict[str, Any]], output_path: Path) -> str:
    """Write a reproducible Markdown regression report table."""
    lines = [
        "# API Endpoint Latency & Throughput Benchmark Report",
        "",
        "| Endpoint | Method | Req | p50 (ms) | p95 (ms) | p99 (ms) | Mean TTFB (ms) | RPS | Error % |",
        "| :--- | :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
    ]
    for m in metrics:
        lines.append(
            f"| `{m['endpoint']}` | `{m['method']}` | {m['requests']} | "
            f"{m['p50_ms']} | {m['p95_ms']} | {m['p99_ms']} | {m['mean_ttfb_ms']} | "
            f"{m['rps']} | {m['error_rate_pct']}% |"
        )
    content = "\n".join(lines) + "\n"
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(content, encoding="utf-8")
    return content
