# Low Hanging Fruit Security Scanner

**Bounty:** [#743](https://github.com/SecureBananaLabs/bug-bounty/issues/743) — $700  
**Category:** Security Automation  
**Author:** @liyanzong

## Overview

A cross-platform Python script that automates scanning for common "low hanging fruit" security issues on a target domain. Designed for security researchers, bug bounty hunters, and system administrators.

## Features

### 1️⃣ HTTP Security Headers Check
Scans for **8 critical security headers**:
| Header | Severity |
|--------|----------|
| Strict-Transport-Security (HSTS) | 🔴 High |
| Content-Security-Policy (CSP) | 🔴 High |
| X-Frame-Options | 🟡 Medium |
| X-Content-Type-Options | 🟡 Medium |
| Access-Control-Allow-Origin | 🟡 Medium |
| X-XSS-Protection | 🟢 Low |
| Referrer-Policy | 🟢 Low |
| Permissions-Policy | 🟢 Low |

### 2️⃣ Exposed Sensitive Paths
Checks **20+ common sensitive paths**, including:
- `.git/config`, `.git/HEAD` — Git repository exposure
- `.env` — Environment variables / secrets
- `.aws/credentials` — AWS credentials
- `wp-config.php`, `config.php` — CMS / app configs
- `backup.sql`, `dump.sql` — Database dumps
- `.svn/entries` — SVN metadata
- Admin panels, `robots.txt`, `sitemap.xml`

### 3️⃣ Cloud Storage Bucket Discovery
Proactively checks **20+ common bucket name patterns** across:
- **AWS S3** — 12 naming patterns (target-assets, target-backup, etc.)
- **Azure Blob** — 8 naming patterns
- **GCP Storage** — 2 naming patterns

### 4️⃣ Subdomain Takeover Detection 🏆 (Bonus)
Scans **45 common subdomains** (www, api, dev, admin, cdn, etc.) against **40+ known vulnerable cloud services**, including:
- AWS (S3, CloudFront)
- Azure (Blob, CloudApp, TrafficManager)
- GCP (Storage, AppSpot)
- Heroku, GitHub Pages, GitLab Pages
- Netlify, Vercel, Fly.io, Render
- Shopify, Squarespace, WordPress
- Cloudflare, Fastly, Statuspage
- And 28+ more services

### 5️⃣ SSL/TLS Certificate Check
- Expiration date validation
- Subject Alternative Name (SAN) count check

## Output

### HTML Report with Traffic-Light Color Scheme
![Report Preview](report_preview.png)

The report features:
- **Traffic-light summary** cards (🔴 HIGH / 🟡 MEDIUM / 🟢 LOW / 🔵 INFO)
- **Progress bar** indicating overall security posture
- **Color-coded findings** with severity badges
- **Recommendation** section for each finding
- Clean, dark-themed design inspired by modern security tools

### JSON Export
Machine-readable JSON output for integration with other tools.

## Requirements

- Python 3.7+
- Standard library only (no external dependencies!)

## Usage

```bash
# Basic scan
python scan_security.py example.com

# Full options
python scan_security.py example.com --threads 20 --timeout 5 --output report.html --json results.json

# Quiet mode (summary only)
python scan_security.py example.com --quiet

# Help
python scan_security.py --help
```

### Example Output

```
🔍 Scanning target: example.com

[1/4] Checking HTTP security headers...
[2/4] Checking for exposed sensitive paths...
[3/4] Checking cloud storage buckets...
[4/4] Checking subdomain takeover vulnerabilities...

============================================================
📊 SCAN SUMMARY
============================================================
  🔴 High:   2
  🟡 Medium: 3
  🟢 Low:    1
  🔵 Info:   2
  Total:     8

  🔴 [HIGH] Missing: HTTP Strict Transport Security (HSTS)
     The HTTP header 'Strict-Transport-Security' is not present...
```

## Design Philosophy

- **Zero external dependencies** — Pure Python standard library
- **Concurrent scanning** — ThreadPoolExecutor for fast parallel checks
- **Graceful error handling** — Individual check failures don't crash the scanner
- **Extensible** — Easy to add new header checks, paths, services, and bucket patterns
- **Platform-independent** — Works on Linux, macOS, and Windows

## Files

| File | Description |
|------|-------------|
| `scan_security.py` | Main scanner script |
| `README.md` | This documentation |
