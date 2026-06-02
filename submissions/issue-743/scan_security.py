#!/usr/bin/env python3
"""
Low Hanging Fruit Security Scanner
Bounty: Issue #743 - $700
SecureBananaLabs Bug Bounty Program

Scans a target domain for:
1. Missing HTTP security headers (HSTS, X-Frame-Options, CSP, etc.)
2. Exposed .git/config or .env files
3. Open S3 buckets or Azure blob containers
Bonus: Subdomain takeover detection via built-in vulnerable service list

Generates an HTML report with traffic-light color scheme.
"""

import argparse
import concurrent.futures
import json
import os
import re
import socket
import sys
import urllib.parse
from datetime import datetime
from http.client import HTTPSConnection, HTTPConnection
from typing import Dict, List, Optional, Tuple


# ─── Configuration ───────────────────────────────────────────────────────────

SECURITY_HEADERS = {
    "Strict-Transport-Security": {
        "description": "HTTP Strict Transport Security (HSTS)",
        "severity": "high",
        "expected": "must include max-age directive",
    },
    "X-Frame-Options": {
        "description": "Clickjacking Protection",
        "severity": "medium",
        "expected": "DENY or SAMEORIGIN",
    },
    "X-Content-Type-Options": {
        "description": "MIME-type sniffing protection",
        "severity": "medium",
        "expected": "nosniff",
    },
    "Content-Security-Policy": {
        "description": "Content Security Policy",
        "severity": "high",
        "expected": "should be configured",
    },
    "X-XSS-Protection": {
        "description": "Cross-Site Scripting filter",
        "severity": "low",
        "expected": "1; mode=block",
    },
    "Referrer-Policy": {
        "description": "Referrer Policy",
        "severity": "low",
        "expected": "should be configured",
    },
    "Permissions-Policy": {
        "description": "Permissions Policy (Feature Policy)",
        "severity": "low",
        "expected": "should be configured",
    },
    "Access-Control-Allow-Origin": {
        "description": "CORS header (check for wildcard)",
        "severity": "medium",
        "expected": "not '*'",
    },
}

EXPOSED_PATHS = [
    "/.git/config",
    "/.env",
    "/.gitignore",
    "/.DS_Store",
    "/wp-config.php",
    "/config.php",
    "/backup.sql",
    "/.aws/credentials",
    "/admin/",
    "/robots.txt",
    "/sitemap.xml",
    "/crossdomain.xml",
    "/clientaccesspolicy.xml",
    "/.htaccess",
    "/config.json",
    "/dump.sql",
    "/database.yml",
    "/.svn/entries",
    "/.git/HEAD",
]

# Subdomain takeover vulnerable services
SUBDOMAIN_TAKEOVER_SERVICES = {
    "aws.s3": {"cname": [".s3.amazonaws.com", ".s3-website"], "fingerprint": "NoSuchBucket"},
    "aws.s3.us-east-1": {"cname": [".s3.us-east-1.amazonaws.com"], "fingerprint": "NoSuchBucket"},
    "aws.cloudfront": {"cname": [".cloudfront.net"], "fingerprint": "XNotFound"},
    "azure.trafficmanager": {"cname": [".trafficmanager.net"], "fingerprint": "404 Not Found"},
    "azure.cloudapp": {"cname": [".cloudapp.net"], "fingerprint": "404 Not Found"},
    "azure.blob": {"cname": [".blob.core.windows.net"], "fingerprint": "The specified blob does not exist"},
    "gcp.storage": {"cname": [".storage.googleapis.com"], "fingerprint": "NoSuchBucket"},
    "gcp.appspot": {"cname": [".appspot.com"], "fingerprint": "404 Not Found"},
    "heroku": {"cname": [".herokuapp.com", ".herokudns.com"], "fingerprint": "There's nothing here, yet"},
    "github.pages": {"cname": [".github.io"], "fingerprint": "404 Not Found"},
    "gitlab.pages": {"cname": [".gitlab.io"], "fingerprint": "The page you're looking for could not be found"},
    "shopify": {"cname": [".myshopify.com"], "fingerprint": "Sorry, this shop is currently unavailable"},
    "squarespace": {"cname": [".squarespace.com"], "fingerprint": "No Such Site"},
    "wordpress": {"cname": [".wordpress.com"], "fingerprint": "Do you want to register"},
    "fastly": {"cname": [".fastly.net"], "fingerprint": "Fastly error: unknown domain"},
    "cloudflare": {"cname": [".cloudflare.com"], "fingerprint": "There is no website configured"},
    "statuspage": {"cname": [".statuspage.io"], "fingerprint": "404 Not Found"},
    "readme.io": {"cname": [".readme.io"], "fingerprint": "Project doesn't exist"},
    "tumblr": {"cname": [".tumblr.com"], "fingerprint": "There's nothing here"},
    "surge.sh": {"cname": [".surge.sh"], "fingerprint": "project not found"},
    "bitbucket": {"cname": [".bitbucket.io"], "fingerprint": "Repository not found"},
    "intercom": {"cname": [".custom.intercom.io"], "fingerprint": "This domain is not configured"},
    "zendesk": {"cname": [".zendesk.com"], "fingerprint": "Help Center Closed"},
    "freshdesk": {"cname": [".freshdesk.com"], "fingerprint": "Page Not Found"},
    "atlassian": {"cname": [".atlassian.net"], "fingerprint": "The site is not configured"},
    "cargo": {"cname": [".cargocollective.com"], "fingerprint": "404 Not Found"},
    "fly.io": {"cname": [".fly.dev"], "fingerprint": "404 Not Found"},
    "netlify": {"cname": [".netlify.app"], "fingerprint": "Not Found - Request ID:"},
    "vercel": {"cname": [".vercel.app"], "fingerprint": "The deployment could not be found"},
    "render": {"cname": [".onrender.com"], "fingerprint": "Render 404"},
    "pantheon": {"cname": [".pantheonsite.io"], "fingerprint": "The gods are wrathful"},
    "helpscout": {"cname": [".helpscoutdocs.com"], "fingerprint": "No site found"},
    "teamtailor": {"cname": [".teamtailor.com"], "fingerprint": "There is no company"},
    "worksites": {"cname": [".worksites.com"], "fingerprint": "has no site at this address"},
    "unbounce": {"cname": [".unbouncepages.com"], "fingerprint": "The page you requested was not found"},
    "strikingly": {"cname": [".strikingly.com", ".strikinglydns.com"], "fingerprint": "page not found"},
    "simplebooklet": {"cname": [".simplebooklet.com"], "fingerprint": "Simplebooklet not found"},
    "uservoice": {"cname": [".uservoice.com"], "fingerprint": "This UserVoice subdomain is currently available"},
    "surge": {"cname": [".surge.sh"], "fingerprint": "project not found"},
    "tictail": {"cname": [".tictail.com"], "fingerprint": "The page you were looking for doesn't exist"},
    "webflow": {"cname": [".webflow.io"], "fingerprint": "The page you are looking for doesn't exist"},
}

CLOUD_STORAGE_BUCKETS = [
    # AWS S3
    {"name": "{target}-assets", "url": "https://{target}-assets.s3.amazonaws.com", "provider": "AWS S3"},
    {"name": "{target}-backup", "url": "https://{target}-backup.s3.amazonaws.com", "provider": "AWS S3"},
    {"name": "{target}-data", "url": "https://{target}-data.s3.amazonaws.com", "provider": "AWS S3"},
    {"name": "{target}-files", "url": "https://{target}-files.s3.amazonaws.com", "provider": "AWS S3"},
    {"name": "{target}-public", "url": "https://{target}-public.s3.amazonaws.com", "provider": "AWS S3"},
    {"name": "{target}-uploads", "url": "https://{target}-uploads.s3.amazonaws.com", "provider": "AWS S3"},
    {"name": "{target}-static", "url": "https://{target}-static.s3.amazonaws.com", "provider": "AWS S3"},
    {"name": "{target}-media", "url": "https://{target}-media.s3.amazonaws.com", "provider": "AWS S3"},
    {"name": "{target}-dev", "url": "https://{target}-dev.s3.amazonaws.com", "provider": "AWS S3"},
    {"name": "{target}-staging", "url": "https://{target}-staging.s3.amazonaws.com", "provider": "AWS S3"},
    {"name": "{target}-prod", "url": "https://{target}-prod.s3.amazonaws.com", "provider": "AWS S3"},
    {"name": "{target}-test", "url": "https://{target}-test.s3.amazonaws.com", "provider": "AWS S3"},
    # Azure Blob
    {"name": "{target}", "url": "https://{target}.blob.core.windows.net", "provider": "Azure Blob"},
    {"name": "{target}assets", "url": "https://{target}assets.blob.core.windows.net", "provider": "Azure Blob"},
    {"name": "{target}backup", "url": "https://{target}backup.blob.core.windows.net", "provider": "Azure Blob"},
    {"name": "{target}data", "url": "https://{target}data.blob.core.windows.net", "provider": "Azure Blob"},
    {"name": "{target}files", "url": "https://{target}files.blob.core.windows.net", "provider": "Azure Blob"},
    {"name": "{target}public", "url": "https://{target}public.blob.core.windows.net", "provider": "Azure Blob"},
    {"name": "{target}uploads", "url": "https://{target}uploads.blob.core.windows.net", "provider": "Azure Blob"},
    {"name": "{target}static", "url": "https://{target}static.blob.core.windows.net", "provider": "Azure Blob"},
    # GCP Storage
    {"name": "{target}-bucket", "url": "https://storage.googleapis.com/{target}-bucket", "provider": "GCP Storage"},
    {"name": "{target}-storage", "url": "https://storage.googleapis.com/{target}-storage", "provider": "GCP Storage"},
]


# ─── Core Scanner Logic ──────────────────────────────────────────────────────

class ScanResult:
    """Represents a single finding from the scan."""

    def __init__(
        self,
        check_type: str,
        severity: str,
        title: str,
        description: str,
        recommendation: str = "",
        details: str = "",
    ):
        self.check_type = check_type
        self.severity = severity  # "high", "medium", "low", "info"
        self.title = title
        self.description = description
        self.recommendation = recommendation
        self.details = details
        self.timestamp = datetime.utcnow().isoformat() + "Z"

    def to_dict(self) -> Dict:
        return {
            "check_type": self.check_type,
            "severity": self.severity,
            "title": self.title,
            "description": self.description,
            "recommendation": self.recommendation,
            "details": self.details,
            "timestamp": self.timestamp,
        }


class SecurityScanner:
    """Main scanner class that runs all checks against a target domain."""

    def __init__(self, target: str, threads: int = 10, timeout: int = 10):
        self.target = target.strip().lower()
        # Normalize target: strip protocol and trailing slash
        self.target = re.sub(r"^https?://", "", self.target).rstrip("/")
        self.threads = threads
        self.timeout = timeout
        self.results: List[ScanResult] = []
        self.start_time = datetime.utcnow()

    def run(self) -> List[ScanResult]:
        """Run all security checks and return results."""
        print(f"\n{'='*60}")
        print(f"🔍 Scanning target: {self.target}")
        print(f"{'='*60}\n")

        self._check_security_headers()
        self._check_exposed_paths()
        self._check_cloud_storage()
        self._check_subdomain_takeover()
        self._check_ssl_tls()

        return self.results

    # ── Check 1: HTTP Security Headers ──────────────────────────────────

    def _check_security_headers(self):
        """Check for missing HTTP security headers."""
        print("[1/4] Checking HTTP security headers...")

        try:
            conn = HTTPSConnection(self.target, timeout=self.timeout)
            conn.request("GET", "/", headers={"User-Agent": "SBL-Scanner/1.0"})
            response = conn.getresponse()
            headers = {k.lower(): v for k, v in response.getheaders()}

            for header, info in SECURITY_HEADERS.items():
                header_lower = header.lower()
                if header_lower not in headers:
                    self.results.append(ScanResult(
                        check_type="security_header",
                        severity=info["severity"],
                        title=f"Missing: {info['description']}",
                        description=f"The HTTP header '{header}' is not present in the response.",
                        recommendation=f"Add '{header}: {info['expected']}' to your server configuration.",
                        details=f"Expected: {info['expected']}",
                    ))
                elif header_lower == "access-control-allow-origin":
                    value = headers[header_lower]
                    if value.strip() == "*":
                        self.results.append(ScanResult(
                            check_type="security_header",
                            severity="medium",
                            title="CORS wildcard allowed",
                            description="Access-Control-Allow-Origin is set to '*' allowing any origin.",
                            recommendation="Restrict CORS to specific trusted origins.",
                            details=f"Current value: {value}",
                        ))

            conn.close()
        except Exception as e:
            self.results.append(ScanResult(
                check_type="connectivity",
                severity="high",
                title="Failed to connect",
                description=f"Could not connect to {self.target} over HTTPS.",
                recommendation="Verify the domain is reachable and serves HTTPS.",
                details=str(e),
            ))

    # ── Check 2: Exposed Sensitive Paths ───────────────────────────────

    def _check_exposed_paths(self):
        """Check for exposed sensitive files and directories."""
        print("[2/4] Checking for exposed sensitive paths...")

        def _check_path(path: str) -> Optional[ScanResult]:
            try:
                conn = HTTPSConnection(self.target, timeout=self.timeout)
                conn.request("GET", path, headers={"User-Agent": "SBL-Scanner/1.0"})
                response = conn.getresponse()
                status = response.status
                body = response.read(500).decode("utf-8", errors="replace")
                conn.close()

                # 200 or 403 with content might indicate exposure
                if status == 200 and len(body) > 10:
                    # Check if it's actually the app's 404 page
                    if "404" not in body[:200] and "not found" not in body[:200].lower():
                        return ScanResult(
                            check_type="exposed_path",
                            severity="high" if any(
                                ext in path for ext in [".git", ".env", ".svn", ".aws", "config"]
                            ) else "medium",
                            title=f"Exposed: {path}",
                            description=f"Path '{path}' returned HTTP {status} with content.",
                            recommendation=f"Restrict access to '{path}' or remove it from the public web root.",
                            details=f"Returned {len(body)} bytes, HTTP {status}",
                        )
                elif status == 403:
                    # 403 might indicate the file exists but access is denied
                    return ScanResult(
                        check_type="exposed_path",
                        severity="low",
                        title=f"Access denied: {path}",
                        description=f"Path '{path}' returned HTTP 403 (Forbidden). File may exist.",
                        recommendation=f"Verify whether '{path}' should be publicly accessible.",
                        details="HTTP 403 Forbidden",
                    )
            except Exception:
                pass
            return None

        with concurrent.futures.ThreadPoolExecutor(max_workers=self.threads) as executor:
            futures = {executor.submit(_check_path, p): p for p in EXPOSED_PATHS}
            for future in concurrent.futures.as_completed(futures):
                result = future.result()
                if result:
                    self.results.append(result)

    # ── Check 3: Cloud Storage Buckets ─────────────────────────────────

    def _check_cloud_storage(self):
        """Check for open/accessible cloud storage buckets."""
        print("[3/4] Checking cloud storage buckets...")
        sanitized = re.sub(r"[^a-zA-Z0-9\-]", "", self.target.split(".")[0])

        def _check_bucket(bucket_info: Dict) -> Optional[ScanResult]:
            url = bucket_info["url"].replace("{target}", sanitized)
            bucket_name = bucket_info["name"].replace("{target}", sanitized)
            provider = bucket_info["provider"]

            try:
                conn = HTTPSConnection(
                    urllib.parse.urlparse(url).hostname,
                    timeout=self.timeout,
                )
                conn.request("GET", urllib.parse.urlparse(url).path or "/",
                             headers={"User-Agent": "SBL-Scanner/1.0"})
                response = conn.getresponse()
                status = response.status
                body = response.read(500).decode("utf-8", errors="replace")
                conn.close()

                s3_fingerprints = ["NoSuchBucket", "The specified bucket does not exist",
                                   "The specified blob does not exist"]
                is_open = status in (200, 301, 302, 307, 403) and \
                    not any(f in body for f in s3_fingerprints)

                if status == 200:
                    return ScanResult(
                        check_type="open_storage",
                        severity="high",
                        title=f"Open bucket: {bucket_name} ({provider})",
                        description=f"Storage bucket '{bucket_name}' is publicly accessible and listing contents.",
                        recommendation="Restrict bucket access with proper IAM policies and block public access.",
                        details=f"URL: {url}, HTTP {status}",
                    )
                elif status == 403 and "AccessDenied" not in body:
                    return ScanResult(
                        check_type="open_storage",
                        severity="medium",
                        title=f"Potentially open: {bucket_name} ({provider})",
                        description=f"Storage bucket '{bucket_name}' returned HTTP 403 but may exist.",
                        recommendation=f"Verify bucket '{bucket_name}' access controls.",
                        details=f"URL: {url}, HTTP {status}",
                    )
            except Exception:
                pass
            return None

        with concurrent.futures.ThreadPoolExecutor(max_workers=self.threads) as executor:
            futures = {executor.submit(_check_bucket, b): b for b in CLOUD_STORAGE_BUCKETS}
            for future in concurrent.futures.as_completed(futures):
                result = future.result()
                if result:
                    self.results.append(result)

    # ── Check 4: Subdomain Takeover ───────────────────────────────────

    def _check_subdomain_takeover(self):
        """Check for potential subdomain takeover vulnerabilities."""
        print("[4/4] Checking subdomain takeover vulnerabilities...")

        # Check common subdomains for CNAME records pointing to vulnerable services
        common_subdomains = [
            "www", "api", "dev", "staging", "admin", "blog", "mail", "cdn",
            "app", "test", "beta", "docs", "help", "support", "status",
            "images", "static", "assets", "media", "m", "mobile", "shop",
            "store", "community", "forum", "wiki", "dashboard", "portal",
            "api-dev", "api-staging", "admin-dev", "console",
        ]

        def _check_subdomain(sub: str) -> Optional[ScanResult]:
            fqdn = f"{sub}.{self.target}"
            try:
                answers = socket.gethostbyname_ex(fqdn)
                # Check CNAME records
                cname = answers[0] if answers[0] else ""
                aliases = answers[1]

                all_names = [cname] + aliases
                for name in all_names:
                    name_lower = name.lower()
                    for service_name, service_info in SUBDOMAIN_TAKEOVER_SERVICES.items():
                        for cname_pattern in service_info["cname"]:
                            if cname_pattern in name_lower:
                                # This subdomain points to a known cloud service
                                # Check if it's actually vulnerable
                                try:
                                    conn = HTTPSConnection(fqdn, timeout=self.timeout)
                                    conn.request("GET", "/",
                                                 headers={"User-Agent": "SBL-Scanner/1.0"})
                                    response = conn.getresponse()
                                    body = response.read(1000).decode("utf-8", errors="replace")
                                    conn.close()

                                    if service_info["fingerprint"].lower() in body.lower():
                                        return ScanResult(
                                            check_type="subdomain_takeover",
                                            severity="high",
                                            title=f"VULNERABLE: {fqdn}",
                                            description=(
                                                f"Subdomain '{fqdn}' has a CNAME to {name_lower} "
                                                f"(provisioned by {service_name}) and the service "
                                                f"returns the unclaimed fingerprint "
                                                f"'{service_info['fingerprint']}'."
                                            ),
                                            recommendation=(
                                                f"Either claim the {service_name} resource or remove "
                                                f"the CNAME record for {fqdn}."
                                            ),
                                            details=f"CNAME -> {name_lower} | Fingerprint: {service_info['fingerprint']}",
                                        )
                                except Exception:
                                    pass
                            break
            except (socket.gaierror, socket.herror):
                pass
            except Exception:
                pass
            return None

        with concurrent.futures.ThreadPoolExecutor(max_workers=self.threads) as executor:
            futures = {executor.submit(_check_subdomain, s): s for s in common_subdomains}
            for future in concurrent.futures.as_completed(futures):
                result = future.result()
                if result:
                    self.results.append(result)

    # ── Bonus: SSL/TLS Check ──────────────────────────────────────────

    def _check_ssl_tls(self):
        """Basic SSL/TLS certificate check."""
        try:
            import ssl
            context = ssl.create_default_context()
            with socket.create_connection((self.target, 443), timeout=self.timeout) as sock:
                with context.wrap_socket(sock, server_hostname=self.target) as ssock:
                    cert = ssock.getpeercert()
                    if cert:
                        # Check expiration
                        from datetime import datetime as dt
                        not_after = cert.get("notAfter", "")
                        if not_after:
                            expiry = dt.strptime(not_after, "%b %d %H:%M:%S %Y %Z")
                            days_left = (expiry - dt.utcnow()).days
                            if days_left < 0:
                                self.results.append(ScanResult(
                                    check_type="ssl",
                                    severity="high",
                                    title="SSL certificate EXPIRED",
                                    description=f"Certificate expired {abs(days_left)} days ago.",
                                    recommendation="Renew the SSL certificate immediately.",
                                    details=f"Expired: {not_after}",
                                ))
                            elif days_left < 30:
                                self.results.append(ScanResult(
                                    check_type="ssl",
                                    severity="medium",
                                    title=f"SSL certificate expiring soon ({days_left} days)",
                                    description=f"Certificate expires in {days_left} days.",
                                    recommendation="Renew the SSL certificate before it expires.",
                                    details=f"Expires: {not_after}",
                                ))
                            else:
                                self.results.append(ScanResult(
                                    check_type="ssl",
                                    severity="info",
                                    title="SSL certificate OK",
                                    description=f"Certificate valid for {days_left} more days.",
                                    recommendation="No action needed.",
                                    details=f"Expires: {not_after}",
                                ))

                        # Check SANs
                        san_count = len(cert.get("subjectAltName", ()))
                        if san_count > 10:
                            self.results.append(ScanResult(
                                check_type="ssl",
                                severity="low",
                                title=f"Many SAN entries ({san_count})",
                                description=f"Certificate has {san_count} Subject Alternative Names.",
                                recommendation="Consider splitting certificates to reduce attack surface.",
                                details=f"SAN count: {san_count}",
                            ))
        except Exception:
            pass

    # ── Report Generation ──────────────────────────────────────────────

    def generate_html_report(self, output_path: str = "") -> str:
        """Generate a color-coded HTML report."""
        high = [r for r in self.results if r.severity == "high"]
        medium = [r for r in self.results if r.severity == "medium"]
        low = [r for r in self.results if r.severity == "low"]
        info = [r for r in self.results if r.severity == "info"]
        duration = (datetime.utcnow() - self.start_time).total_seconds()

        html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Security Scan Report — {self.target}</title>
<style>
  * {{ margin: 0; padding: 0; box-sizing: border-box; }}
  body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
         background: #0d1117; color: #c9d1d9; line-height: 1.6; }}
  .container {{ max-width: 960px; margin: 0 auto; padding: 20px; }}
  h1 {{ font-size: 1.8em; margin-bottom: 5px; color: #f0f6fc; }}
  h2 {{ font-size: 1.3em; margin: 25px 0 15px; }}
  .meta {{ color: #8b949e; font-size: 0.9em; margin-bottom: 20px; }}
  .summary {{ display: flex; gap: 15px; margin: 20px 0; }}
  .stat {{ flex: 1; padding: 15px; border-radius: 8px; text-align: center; }}
  .stat-high {{ background: #3d1f1f; border: 1px solid #f85149; }}
  .stat-med {{ background: #3d2e1f; border: 1px solid #d29922; }}
  .stat-low {{ background: #1f3d2e; border: 1px solid #3fb950; }}
  .stat-info {{ background: #1f2d3d; border: 1px solid #58a6ff; }}
  .stat-num {{ font-size: 2em; font-weight: bold; }}
  .stat-label {{ font-size: 0.85em; color: #8b949e; }}
  .finding {{ background: #161b22; border: 1px solid #30363d; border-radius: 8px;
             padding: 15px; margin-bottom: 10px; }}
  .finding.high {{ border-left: 4px solid #f85149; }}
  .finding.medium {{ border-left: 4px solid #d29922; }}
  .finding.low {{ border-left: 4px solid #3fb950; }}
  .finding.info {{ border-left: 4px solid #58a6ff; }}
  .finding-title {{ font-weight: 600; font-size: 1.05em; }}
  .finding-desc {{ color: #8b949e; font-size: 0.9em; margin: 5px 0; }}
  .finding-rec {{ color: #7ee787; font-size: 0.85em; padding: 8px; background: #0d1117;
                 border-radius: 6px; margin-top: 8px; }}
  .finding-detail {{ color: #484f58; font-size: 0.8em; margin-top: 5px; }}
  .badge {{ display: inline-block; padding: 2px 8px; border-radius: 12px;
            font-size: 0.75em; font-weight: 600; text-transform: uppercase; }}
  .badge-high {{ background: #f85149; color: #fff; }}
  .badge-medium {{ background: #d29922; color: #fff; }}
  .badge-low {{ background: #3fb950; color: #fff; }}
  .badge-info {{ background: #58a6ff; color: #fff; }}
  footer {{ text-align: center; color: #484f58; font-size: 0.8em; margin: 30px 0; }}
  .progress {{ height: 8px; background: #21262d; border-radius: 4px; margin: 10px 0; }}
  .progress-fill {{ height: 100%; border-radius: 4px;
                   background: linear-gradient(90deg, #f85149, #d29922, #3fb950); }}
</style>
</head>
<body>
<div class="container">
  <h1>🔍 Security Scan Report</h1>
  <p class="meta">Target: {self.target} | Scan time: {self.start_time.strftime('%Y-%m-%d %H:%M:%S UTC')} | Duration: {duration:.1f}s</p>

  <div class="summary">
    <div class="stat stat-high">
      <div class="stat-num" style="color:#f85149">{len(high)}</div>
      <div class="stat-label">HIGH</div>
    </div>
    <div class="stat stat-med">
      <div class="stat-num" style="color:#d29922">{len(medium)}</div>
      <div class="stat-label">MEDIUM</div>
    </div>
    <div class="stat stat-low">
      <div class="stat-num" style="color:#3fb950">{len(low)}</div>
      <div class="stat-label">LOW</div>
    </div>
    <div class="stat stat-info">
      <div class="stat-num" style="color:#58a6ff">{len(info)}</div>
      <div class="stat-label">INFO</div>
    </div>
  </div>

  <div class="progress">
    <div class="progress-fill" style="width:{max(5, min(100, (1 - len(high)/max(1, len(self.results))) * 100))}%"></div>
  </div>
  <p style="text-align:right;color:#8b949e;font-size:0.85em">Total findings: {len(self.results)}</p>
"""

        for severity, findings, label in [
            ("high", high, "High"), ("medium", medium, "Medium"),
            ("low", low, "Low"), ("info", info, "Info"),
        ]:
            if findings:
                html += f'  <h2 id="{label.lower()}"><span class="badge badge-{severity}">{label}</span> ({len(findings)})</h2>\n'
                for f in findings:
                    html += f"""  <div class="finding {severity}">
    <div class="finding-title">{f.title}</div>
    <div class="finding-desc">{f.description}</div>
    <div class="finding-rec">💡 {f.recommendation}</div>
    <div class="finding-detail">{f.details}</div>
  </div>
"""

        html += f"""
  <footer>
    Generated by SBL Security Scanner · <a href="https://github.com/SecureBananaLabs/bug-bounty" style="color:#58a6ff">SecureBananaLabs Bug Bounty</a><br>
    Report generated at {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}
  </footer>
</div>
</body>
</html>"""

        if output_path:
            os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)
            with open(output_path, "w", encoding="utf-8") as f:
                f.write(html)
            print(f"\n📄 Report saved to: {output_path}")

        return html


# ─── CLI Entry Point ─────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Low Hanging Fruit Security Scanner — SecureBananaLabs Bug Bounty",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s example.com
  %(prog)s example.com --threads 20 --timeout 5
  %(prog)s example.com --output /tmp/report.html --json report.json
        """,
    )
    parser.add_argument("target", help="Target domain to scan (e.g., example.com)")
    parser.add_argument("--threads", "-t", type=int, default=10,
                        help="Number of concurrent threads (default: 10)")
    parser.add_argument("--timeout", type=int, default=10,
                        help="Request timeout in seconds (default: 10)")
    parser.add_argument("--output", "-o", default="",
                        help="Output HTML report file path")
    parser.add_argument("--json", default="",
                        help="Output JSON results to file")
    parser.add_argument("--quiet", "-q", action="store_true",
                        help="Suppress detailed output")
    args = parser.parse_args()

    scanner = SecurityScanner(args.target, threads=args.threads, timeout=args.timeout)
    results = scanner.run()

    if not args.quiet:
        high = [r for r in results if r.severity == "high"]
        medium = [r for r in results if r.severity == "medium"]
        low = [r for r in results if r.severity == "low"]
        info = [r for r in results if r.severity == "info"]

        print(f"\n{'='*60}")
        print("📊 SCAN SUMMARY")
        print(f"{'='*60}")
        print(f"  🔴 High:   {len(high)}")
        print(f"  🟡 Medium: {len(medium)}")
        print(f"  🟢 Low:    {len(low)}")
        print(f"  🔵 Info:   {len(info)}")
        print(f"  Total:     {len(results)}")

        for result in results:
            icon = {"high": "🔴", "medium": "🟡", "low": "🟢", "info": "🔵"}
            print(f"\n  {icon.get(result.severity, '⚪')} [{result.severity.upper()}] {result.title}")
            print(f"     {result.description}")

    # Generate HTML report
    if args.output:
        scanner.generate_html_report(args.output)
        if not args.quiet:
            print(f"\n📄 HTML report: {os.path.abspath(args.output)}")

    # Export JSON
    if args.json:
        with open(args.json, "w", encoding="utf-8") as f:
            json.dump({
                "target": args.target,
                "scan_time": scanner.start_time.isoformat(),
                "total": len(results),
                "results": [r.to_dict() for r in results],
            }, f, indent=2)
        if not args.quiet:
            print(f"📋 JSON export: {os.path.abspath(args.json)}")

    return 0 if len([r for r in results if r.severity == "high"]) == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
