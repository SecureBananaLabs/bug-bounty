#!/usr/bin/env python3
"""
API Benchmark Suite - Python (httpx) Alternative
Run when k6 is not available.

Usage:
    pip install httpx
    python3 benchmark.py
    python3 benchmark.py --base-url http://localhost:3000 --token YOUR_TOKEN
    python3 benchmark.py --vus 5 --duration 30
"""

import argparse
import asyncio
import json
import statistics
import sys
import time
import httpx
from datetime import datetime

BASE_URL = "http://localhost:3000"
AUTH_TOKEN = ""

# Test endpoints configuration
ENDPOINTS = [
    # (name, method, path, payload)
    ("health", "GET", "/health", None, False),
    ("auth_register", "POST", "/api/auth/register",
     lambda: {"email": f"bench_{int(time.time()*1000)}@test.com", "password": "Bench123!", "name": "Bench User"}, False),
    ("auth_login", "POST", "/api/auth/login",
     lambda: {"email": f"bench_{int(time.time()*1000)}@test.com", "password": "Bench123!"}, False),
    ("users_list", "GET", "/api/users", None, True),
    ("jobs_list", "GET", "/api/jobs", None, True),
    ("proposals_list", "GET", "/api/proposals", None, True),
    ("reviews_list", "GET", "/api/reviews", None, True),
    ("messages_list", "GET", "/api/messages", None, True),
    ("notifications_list", "GET", "/api/notifications", None, True),
    ("search", "GET", "/api/search?q=developer&limit=10", None, True),
    ("jobs_create", "POST", "/api/jobs",
     {"title": "Bench Senior Dev", "description": "Test job", "budget": 5000, "skills": ["Python"]}, True),
    ("proposals_create", "POST", "/api/proposals",
     {"jobId": "test-id", "coverLetter": "I can help!", "proposedRate": 100}, True),
    ("payments_create", "POST", "/api/payments",
     {"amount": 500, "currency": "USD", "description": "Test"}, True),
    ("reviews_create", "POST", "/api/reviews",
     {"targetUserId": "user-id", "rating": 5, "comment": "Great!"}, True),
    ("messages_send", "POST", "/api/messages",
     {"recipientId": "user-id", "subject": "Hi", "body": "Test message"}, True),
    ("admin_metrics", "GET", "/api/admin/metrics", None, True),
]

if AUTH_TOKEN:
    ENDPOINTS.append(("admin_metrics", "GET", "/api/admin/metrics", None, True))


class Stats:
    def __init__(self):
        self.latencies = []
        self.errors = 0
        self.total = 0
    
    def add(self, latency_ms, success=True):
        self.latencies.append(latency_ms)
        self.total += 1
        if not success:
            self.errors += 1
    
    @property
    def p50(self):
        return sorted(self.latencies)[len(self.latencies) // 2] if self.latencies else 0
    
    @property
    def p95(self):
        if not self.latencies:
            return 0
        sorted_lat = sorted(self.latencies)
        idx = int(len(sorted_lat) * 0.95)
        return sorted_lat[min(idx, len(sorted_lat)-1)]
    
    @property
    def p99(self):
        if not self.latencies:
            return 0
        sorted_lat = sorted(self.latencies)
        idx = int(len(sorted_lat) * 0.99)
        return sorted_lat[min(idx, len(sorted_lat)-1)]
    
    @property
    def avg(self):
        return statistics.mean(self.latencies) if self.latencies else 0
    
    @property
    def error_rate(self):
        return (self.errors / self.total * 100) if self.total else 0


async def run_benchmark(base_url: str, vus: int, duration: int):
    """Run benchmark with virtual users for specified duration."""
    all_stats = {}
    
    async def worker(worker_id):
        async with httpx.AsyncClient(base_url=base_url, timeout=30.0) as client:
            end_time = time.time() + duration
            while time.time() < end_time:
                for name, method, path, payload_factory, needs_auth in ENDPOINTS:
                    if time.time() >= end_time:
                        break
                    
                    headers = {"Content-Type": "application/json"}
                    if needs_auth and AUTH_TOKEN:
                        headers["Authorization"] = f"Bearer {AUTH_TOKEN}"
                    
                    payload = payload_factory() if callable(payload_factory) else payload_factory
                    
                    try:
                        start = time.time()
                        if method == "GET":
                            resp = await client.get(path, headers=headers)
                        else:
                            resp = await client.post(path, json=payload, headers=headers)
                        latency = (time.time() - start) * 1000
                        
                        if name not in all_stats:
                            all_stats[name] = Stats()
                        all_stats[name].add(latency, resp.status < 500)
                    except Exception:
                        if name not in all_stats:
                            all_stats[name] = Stats()
                        all_stats[name].add(9999, False)
    
    workers = [worker(i) for i in range(vus)]
    await asyncio.gather(*workers)
    return all_stats


def print_report(stats: dict, duration: int):
    """Print formatted benchmark report."""
    total_req = sum(s.total for s in stats.values())
    total_err = sum(s.errors for s in stats.values())
    overall_rps = total_req / duration if duration > 0 else 0
    
    print()
    print("╔══════════════════════════════════════════════════════════════════════╗")
    print(f"║  API Benchmark Report                     {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}  ║")
    print(f"║  Total requests: {total_req:<6d} | Errors: {total_err:<5d} | RPS: {overall_rps:.1f}    ║")
    print("╠══════════════════════════════════════════════════════════════════════╣")
    print(f"║  {'Endpoint':25s} {'P50(ms)':>8s} {'P95(ms)':>8s} {'P99(ms)':>8s} {'Err%':>6s} {'Req':>6s} ║")
    print("╠══════════════════════════════════════════════════════════════════════╣")
    
    for name in sorted(stats.keys()):
        s = stats[name]
        color = ""
        reset = ""
        if s.p95 < 500:
            color = "\033[32m"  # green
        elif s.p95 < 2000:
            color = "\033[33m"  # yellow
        else:
            color = "\033[31m"  # red
        reset = "\033[0m"
        
        print(f"║ {color}{name:25s} {s.p50:>7.0f}ms {s.p95:>7.0f}ms {s.p99:>7.0f}ms "
              f"{s.error_rate:>5.1f}% {s.total:>5d}{reset} ║")
    
    print("╚══════════════════════════════════════════════════════════════════════╝")
    print()
    
    # Summary
    if total_req > 0:
        print(f"📊 Summary:")
        print(f"   Total requests: {total_req}")
        print(f"   Errors: {total_err} ({total_err/total_req*100:.1f}%)")
        print(f"   Throughput: {overall_rps:.1f} req/s")
        print(f"   Duration: {duration}s with multi VUs")
        print()
        
        # Bottleneck detection
        slow = [(n, s) for n, s in stats.items() if s.p95 > 2000]
        if slow:
            print(f"⚠️  Bottlenecks detected (P95 > 2s):")
            for name, s in sorted(slow, key=lambda x: -x[1].p95):
                print(f"   🔴 {name}: P95={s.p95:.0f}ms, AVG={s.avg:.0f}ms, errors={s.error_rate:.1f}%")
        else:
            print(f"✅ No significant bottlenecks detected (all P95 < 2s)")


def main():
    parser = argparse.ArgumentParser(description="API Benchmark Suite")
    parser.add_argument("--base-url", default=BASE_URL, help="API base URL")
    parser.add_argument("--token", default="", help="Auth token for protected routes")
    parser.add_argument("--vus", type=int, default=5, help="Virtual users (default: 5)")
    parser.add_argument("--duration", type=int, default=20, help="Duration in seconds (default: 20)")
    parser.add_argument("--json", action="store_true", help="Output raw JSON report")
    args = parser.parse_args()
    
    global BASE_URL, AUTH_TOKEN
    BASE_URL = args.base_url
    AUTH_TOKEN = args.token
    
    print(f"🚀 API Benchmark Suite")
    print(f"   Target: {BASE_URL}")
    print(f"   Virtual Users: {args.vus}")
    print(f"   Duration: {args.duration}s")
    print(f"   Auth: {'Yes' if AUTH_TOKEN else 'No'}")
    print(f"   Endpoints: {len(ENDPOINTS)}")
    print()
    print(f"Running benchmark...")
    
    stats = asyncio.run(run_benchmark(BASE_URL, args.vus, args.duration))
    
    if args.json:
        report = {}
        for name, s in stats.items():
            report[name] = {
                "p50_ms": round(s.p50, 1),
                "p95_ms": round(s.p95, 1),
                "p99_ms": round(s.p99, 1),
                "avg_ms": round(s.avg, 1),
                "error_rate_pct": round(s.error_rate, 1),
                "total_requests": s.total,
                "errors": s.errors,
            }
        report["_meta"] = {
            "target": BASE_URL,
            "vus": args.vus,
            "duration": args.duration,
            "total_requests": sum(s.total for s in stats.values()),
            "timestamp": datetime.utcnow().isoformat(),
        }
        print(json.dumps(report, indent=2))
    else:
        print_report(stats, args.duration)


if __name__ == "__main__":
    main()
