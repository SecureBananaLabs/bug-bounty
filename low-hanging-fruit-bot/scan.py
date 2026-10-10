#!/usr/bin/env python3
"""
Low Hanging Fruit Automation Bot
=================================
Scans a codebase for common low-hanging-fruit security and quality issues
and files them as GitHub issues. Designed to work with any repository.

Usage:
    python scan.py --repo owner/repo [--path /path/to/repo] [--dry-run] [--token-file /tmp/.gh_token]

Requirements:
    pip install requests
"""

import argparse
import json
import os
import re
import sys
import fnmatch
from pathlib import Path
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass, field

try:
    import requests
except ImportError:
    print("Error: 'requests' library is required. Install it with: pip install requests")
    sys.exit(1)


# ────────────────────────────── Data Structures ──────────────────────────────

@dataclass
class Finding:
    """Represents a single issue found during scanning."""
    category: str
    severity: str  # low, medium, high
    file_path: str
    line_number: int
    snippet: str
    description: str


# ────────────────────────────── Scanner Rules ────────────────────────────────

# Patterns for hardcoded secrets
SECRET_PATTERNS = [
    (re.compile(r'(?i)(api[_-]?key|apikey|secret|password|token|auth|credential)s?\s*[:=]\s*["\'][^"\']{8,}["\']'), "Hardcoded secret/credential"),
    (re.compile(r'(?i)(api[_-]?key|apikey|secret|password|token|auth|credential)s?\s*=\s*`[^`]{8,}`'), "Hardcoded secret/credential in template literal"),
    (re.compile(r'(?i)(JWT_SECRET|DATABASE_URL|REDIS_URL|AWS_|SECRET_KEY)\s*=\s*["\'][^"\']+["\']'), "Hardcoded environment variable value"),
    (re.compile(r"(?i)Bearer\s+[A-Za-z0-9\-._~+/]{20,}"), "Hardcoded Bearer token"),
    (re.compile(r"(?i)-----BEGIN\s+(RSA|EC|DSA|OPENSSH)\s+PRIVATE\s+KEY-----"), "Hardcoded private key"),
]

# SQL / NoSQL injection patterns
SQL_INJECTION_PATTERNS = [
    (re.compile(r'(?i)(execute|query|raw)\s*\(\s*[`"\'][^`"\']*\$\{'), "Raw SQL with template interpolation (injection risk)"),
    (re.compile(r'(?i)\.query\s*\(\s*\{[^}]*\$'), "MongoDB $where / $expr injection risk"),
    (re.compile(r'(?i)db\.(collection|execute|raw)\s*\([^)]*\+'), "String concatenation in DB query (injection risk)"),
    (re.compile(r'(?i)(SELECT|INSERT|UPDATE|DELETE)\s+.*\+'), "SQL concatenation (injection risk)"),
    (re.compile(r'(?i)prisma\.\$queryRaw'), "Prisma raw query (may need parameterization)"),
    (re.compile(r'(?i)prisma\.\$executeRaw'), "Prisma raw execute (may need parameterization)"),
]

# Race condition patterns
RACE_PATTERNS = [
    (re.compile(r'(?i)(findUnique|findFirst|findOne|findById)\s*\([^)]*\)\s*\.\s*then\s*\([^)]*\)\s*\.\s*then\s*\([^)]*\)\s*\.\s*(update|delete|create|save)'), "Read-then-write without transaction (possible race condition)"),
    (re.compile(r'(?i)(const|let|var)\s+\w+\s*=\s*await\s+\w+\.(findUnique|findFirst|findOne)\s*\([^)]*\)\s*;?\s*\n\s*(?:if\s*\(\s*\w+\s*\)\s*\{?\s*\n\s*)?await\s+\w+\.(update|delete|create)'), "Sequential read-then-write (possible race condition)"),
    (re.compile(r'(?i)(check|validate)\w*\s*\([^)]*\b(available|balance|stock|limit|quota)\b[^)]*\)'), "Check-then-act pattern without locking (possible race)"),
]

# Missing error handling (async without try/catch)
ASYNC_NO_TRY_PATTERNS = [
    # This is a heuristic - we look for await statements not wrapped in try/catch
    # We'll scan function blocks for this
]

# Missing input validation
MISSING_VALIDATION_PATTERNS = [
    (re.compile(r'(?i)(req\.body|req\.query|req\.params|request\.body|request\.query|request\.params)\.(\w+)\s*$', re.MULTILINE), "Direct access to request parameter without visible validation"),
    (re.compile(r'(?i)app\.(get|post|put|patch|delete)\s*\(\s*["\'][^"\']+["\']\s*,\s*(?:async\s*)?\([^)]*\)\s*=>\s*\{[^}]*req\.body[^}]*\}', re.DOTALL), "Route handler uses req.body without validation (check manually)"),
]

# console.log in production
CONSOLE_LOG_PATTERN = re.compile(r'^\s*console\.(log|warn|error|info|debug)\s*\(', re.MULTILINE)

# TODO / FIXME patterns
TODO_PATTERN = re.compile(r'(?i)(//|#|/\*|\*)\s*(TODO|FIXME|HACK|XXX|BUG|KLUDGE|WORKAROUND)\b')

# TypeScript `any` usage
TS_ANY_PATTERN = re.compile(r'\bany\b')

# Missing rate limiting
NO_RATE_LIMIT_PATTERNS = [
    (re.compile(r'(?i)app\.(use|get|post|put|patch|delete)\s*\([^)]*rate\s*limit', re.DOTALL), "Route without rate limiting (check manually)"),
]

# File extensions to scan
CODE_EXTENSIONS = {'.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.py', '.go', '.rs', '.java', '.rb', '.php'}
CONFIG_EXTENSIONS = {'.json', '.yaml', '.yml', '.toml', '.env', '.ini', '.cfg'}
ALL_SCAN_EXTENSIONS = CODE_EXTENSIONS | CONFIG_EXTENSIONS

# Directories to exclude
EXCLUDE_DIRS = {
    'node_modules', '.git', '__pycache__', '.next', 'dist', 'build',
    'coverage', '.turbo', 'vendor', 'target', '.venv', 'venv',
    '.idea', '.vscode', 'migrations', '.pytest_cache'
}

# Files to exclude
EXCLUDE_FILES = {
    'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml',
    '*.min.js', '*.min.css', '*.generated.*', '*.d.ts'
}


def should_exclude(file_path: str) -> bool:
    """Check if a file should be excluded from scanning."""
    parts = Path(file_path).parts
    for part in parts:
        if part in EXCLUDE_DIRS:
            return True
    filename = Path(file_path).name
    for pattern in EXCLUDE_FILES:
        if fnmatch.fnmatch(filename, pattern):
            return True
    return False


def is_scanable(file_path: str) -> bool:
    """Check if a file is a source file we should scan."""
    ext = Path(file_path).suffix.lower()
    return ext in ALL_SCAN_EXTENSIONS


def collect_files(repo_path: str) -> List[str]:
    """Walk the repository and collect all scannable files."""
    files = []
    repo_root = Path(repo_path).resolve()
    for file_path in repo_root.rglob('*'):
        if file_path.is_file():
            rel_path = str(file_path.relative_to(repo_root))
            if not should_exclude(rel_path) and is_scanable(rel_path):
                files.append(str(file_path))
    return sorted(files)


# ──────────────────────────── Scanning Engine ────────────────────────────────

def scan_file(file_path: str) -> List[Finding]:
    """Scan a single file for all issues and return findings."""
    findings: List[Finding] = []

    try:
        with open(file_path, 'r', encoding='utf-8', errors='replace') as f:
            lines = f.readlines()
    except Exception:
        return findings

    content = ''.join(lines)
    ext = Path(file_path).suffix.lower()
    is_typescript = ext in {'.ts', '.tsx'}
    is_javascript = ext in {'.js', '.jsx', '.mjs', '.cjs'} or is_typescript
    is_config = ext in {'.json', '.yaml', '.yml', '.toml', '.env'}

    # 1. Hardcoded secrets
    for pattern, desc in SECRET_PATTERNS:
        for i, line in enumerate(lines, 1):
            if pattern.search(line):
                # Skip if line looks like it's using an environment variable / process.env
                if re.search(r'(process\.env|os\.environ|import\.meta\.env)', line):
                    continue
                # Skip .env.example or template files
                if '.example' in file_path or '.template' in file_path or '.sample' in file_path:
                    continue
                findings.append(Finding(
                    category="Hardcoded Secrets",
                    severity="high",
                    file_path=file_path,
                    line_number=i,
                    snippet=line.strip()[:200],
                    description=desc
                ))

    # 2. SQL/NoSQL injection risks
    if is_javascript or ext in {'.py', '.go', '.php'}:
        for pattern, desc in SQL_INJECTION_PATTERNS:
            for i, line in enumerate(lines, 1):
                if pattern.search(line):
                    findings.append(Finding(
                        category="SQL/NoSQL Injection Risk",
                        severity="high",
                        file_path=file_path,
                        line_number=i,
                        snippet=line.strip()[:200],
                        description=desc
                    ))

    # 3. Race conditions
    if is_javascript or ext in {'.py', '.go', '.rs'}:
        for pattern, desc in RACE_PATTERNS:
            for i, line in enumerate(lines, 1):
                if pattern.search(line):
                    findings.append(Finding(
                        category="Race Condition Risk",
                        severity="medium",
                        file_path=file_path,
                        line_number=i,
                        snippet=line.strip()[:200],
                        description=desc
                    ))

    # 4. Missing error handling around async calls
    if is_javascript:
        findings.extend(scan_missing_error_handling(lines, file_path))

    # 5. Missing input validation
    if is_javascript or ext in {'.py', '.go', '.php'}:
        for pattern, desc in MISSING_VALIDATION_PATTERNS:
            for i, line in enumerate(lines, 1):
                if pattern.search(line):
                    findings.append(Finding(
                        category="Missing Input Validation",
                        severity="medium",
                        file_path=file_path,
                        line_number=i,
                        snippet=line.strip()[:200],
                        description=desc
                    ))

    # 6. Console.log in production code
    if is_javascript:
        for i, line in enumerate(lines, 1):
            if CONSOLE_LOG_PATTERN.search(line):
                # Skip if it's in a test file
                if 'test' in file_path.lower() or '.test.' in file_path or '.spec.' in file_path:
                    continue
                # Skip if there's a comment indicating it's intentional
                if 'eslint-disable' in line or '// intentional' in line.lower():
                    continue
                findings.append(Finding(
                    category="Console.log Left in Production Code",
                    severity="low",
                    file_path=file_path,
                    line_number=i,
                    snippet=line.strip()[:200],
                    description="Console statement that may have been left in production code"
                ))

    # 7. TODO/FIXME comments
    for i, line in enumerate(lines, 1):
        match = TODO_PATTERN.search(line)
        if match:
            tag = match.group(2).upper()
            findings.append(Finding(
                category="TODO/FIXME Comment",
                severity="low",
                file_path=file_path,
                line_number=i,
                snippet=line.strip()[:200],
                description=f"{tag} comment found — may indicate unfinished or problematic work"
            ))

    # 8. TypeScript `any` usage
    if is_typescript:
        for i, line in enumerate(lines, 1):
            # Skip comments
            stripped = line.strip()
            if stripped.startswith('//') or stripped.startswith('/*') or stripped.startswith('*'):
                continue
            if TS_ANY_PATTERN.search(stripped):
                # Only flag as `any` type annotation, not generic parts of words
                # Check if it's actually a type annotation
                if re.search(r':\s*any\b|as\s+any\b|<any>|Array<any>|Promise<any>|Record<[^>]*,\s*any>', stripped):
                    findings.append(Finding(
                        category="TypeScript 'any' Usage",
                        severity="low",
                        file_path=file_path,
                        line_number=i,
                        snippet=line.strip()[:200],
                        description="TypeScript 'any' type used — reduces type safety"
                    ))

    # 9. Missing rate limiting (heuristic checks)
    if is_javascript:
        findings.extend(scan_missing_rate_limit(lines, content, file_path))

    return findings


def scan_missing_error_handling(lines: List[str], file_path: str) -> List[Finding]:
    """
    Heuristic scan for async functions without try/catch.
    This is approximate — we look for `async function` or `async (` that
    contain `await` but no `try`/`catch` in the same block.
    """
    findings: List[Finding] = []
    content = ''.join(lines)

    # Find async function boundaries (simplified)
    async_func_pattern = re.compile(
        r'(?:async\s+function\s+\w+|async\s*\(|async\s+\w+\s*\(|\w+\s*:\s*async\s*\()',
        re.MULTILINE
    )

    # For each async function candidate, check if await exists without try/catch
    # This is a rough heuristic using line-based approach
    in_async_func = False
    func_start = 0
    brace_depth = 0
    has_try_catch = False
    has_await = False

    for i, line in enumerate(lines, 1):
        stripped = line.strip()

        # Detect start of async function
        if re.search(r'\basync\b', stripped) and re.search(r'(?:function\b|=>|\)\s*=>|\()', stripped):
            if not in_async_func:
                in_async_func = True
                func_start = i
                brace_depth = 0
                has_try_catch = False
                has_await = False

        if in_async_func:
            # Count braces
            brace_depth += stripped.count('{') - stripped.count('}')
            if re.search(r'\bawait\b', stripped):
                has_await = True
            if re.search(r'\btry\b', stripped):
                has_try_catch = True
            if re.search(r'\bcatch\b', stripped):
                has_try_catch = True

            # End of function
            if brace_depth <= 0 and '{' in stripped:
                if has_await and not has_try_catch:
                    findings.append(Finding(
                        category="Missing Error Handling",
                        severity="medium",
                        file_path=file_path,
                        line_number=func_start,
                        snippet=lines[func_start - 1].strip()[:200],
                        description="Async function with await but no try/catch error handling"
                    ))
                in_async_func = False

    return findings


def scan_missing_rate_limit(lines: List[str], content: str, file_path: str) -> List[Finding]:
    """
    Check if a server file uses rate limiting middleware.
    Only triggers for files that look like Express/API server entry points.
    """
    findings: List[Finding] = []

    # Only check files that look like server entry points
    is_server_file = False
    for line in lines[:50]:  # Check first 50 lines
        if re.search(r'(express|app\.listen|createServer|http\.createServer)', line):
            is_server_file = True
            break

    if not is_server_file:
        return findings

    # Check if rate limiting is imported or used
    has_rate_limit = bool(re.search(
        r'(rateLimit|rate-limit|express-rate-limit|rate_limiter|RateLimiter|throttle)',
        content
    ))

    if not has_rate_limit:
        findings.append(Finding(
            category="Missing Rate Limiting",
            severity="medium",
            file_path=file_path,
            line_number=1,
            snippet="Server entry point detected without rate limiting middleware",
            description="No rate limiting library or middleware detected in server file"
        ))

    return findings


# ────────────────────────── GitHub Issue Creator ─────────────────────────────

ISSUE_BODY_TEMPLATE = """## Issue: {category}

**Severity:** {severity}
**File:** `{file_path}`
**Line:** {line_number}

```
{snippet}
```

### Description
{description}

---

This issue is limited only to the creator of this issue. This means that only the issue author can attempt to solve this issue. If you would like to work on it, please create another issue with the same contents and refer to issue Low Handing Fruit Automation#743 for more information.

---
*Automatically created by Low Hanging Fruit Automation Bot*"""


def create_github_issue(
    repo: str,
    finding: Finding,
    token: str,
    dry_run: bool = False
) -> Optional[Dict]:
    """
    Create a GitHub issue for a finding.
    Returns the API response or None on failure.
    """
    title = f"[{finding.severity.upper()}] {finding.category} in {Path(finding.file_path).name}:{finding.line_number}"

    # Truncate title to GitHub's limit
    if len(title) > 256:
        title = title[:253] + "..."

    body = ISSUE_BODY_TEMPLATE.format(
        category=finding.category,
        severity=finding.severity,
        file_path=finding.file_path,
        line_number=finding.line_number,
        snippet=finding.snippet,
        description=finding.description
    )

    url = f"https://api.github.com/repos/{repo}/issues"
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    payload = {
        "title": title,
        "body": body,
        "labels": [f"low-hanging-fruit", finding.category.lower().replace(" ", "-"), f"severity-{finding.severity}"]
    }

    if dry_run:
        print(f"  [DRY RUN] Would create issue: {title}")
        return None

    try:
        resp = requests.post(url, headers=headers, json=payload, timeout=30)
        if resp.status_code in (200, 201):
            data = resp.json()
            print(f"  [OK] Created issue #{data.get('number')}: {data.get('html_url')}")
            return data
        else:
            print(f"  [ERROR] HTTP {resp.status_code}: {resp.text[:300]}")
            return None
    except requests.RequestException as e:
        print(f"  [ERROR] Request failed: {e}")
        return None


def deduplicate_findings(findings: List[Finding]) -> List[Finding]:
    """
    Deduplicate findings by category + file + line number.
    Also limit to 1 finding per category per file for low-severity items (except TODOs).
    """
    seen = set()
    result = []
    file_category_count: Dict[str, Dict[str, int]] = {}

    for f in findings:
        key = (f.category, f.file_path, f.line_number)
        if key in seen:
            continue
        seen.add(key)

        # Limit: max ~3 per category per file for low severity
        if f.severity == 'low':
            fc_key = f.file_path
            if fc_key not in file_category_count:
                file_category_count[fc_key] = {}
            cat_count = file_category_count[fc_key].get(f.category, 0)
            if cat_count >= 3:
                continue
            file_category_count[fc_key][f.category] = cat_count + 1

        result.append(f)

    return result


# ───────────────────────────────── Main ──────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Low Hanging Fruit Automation Bot — scan codebase and file GitHub issues",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    python scan.py --repo owner/repo --path ./my-project
    python scan.py --repo owner/repo --path ./my-project --dry-run
    python scan.py --repo owner/repo --path ./my-project --token-file /tmp/.gh_token
        """
    )
    parser.add_argument('--repo', required=True, help='GitHub repository in owner/repo format')
    parser.add_argument('--path', required=True, help='Path to local repository to scan')
    parser.add_argument('--dry-run', action='store_true', help='Scan only, do not create GitHub issues')
    parser.add_argument('--token-file', default='/tmp/.gh_token', help='Path to file containing GitHub token')
    parser.add_argument('--output', help='Optional: write findings as JSON to this file')
    parser.add_argument('--max-issues', type=int, default=50, help='Maximum number of issues to create (default: 50)')

    args = parser.parse_args()

    # Validate repo path
    repo_path = Path(args.path)
    if not repo_path.exists():
        print(f"Error: Repository path does not exist: {args.path}")
        sys.exit(1)

    # Load token
    token_path = Path(args.token_file)
    if not token_path.exists():
        print(f"Error: Token file not found: {args.token_file}")
        sys.exit(1)

    with open(token_path, 'r') as f:
        token = f.read().strip()

    if not token:
        print("Error: Token file is empty")
        sys.exit(1)

    # Validate repo format
    if '/' not in args.repo or len(args.repo.split('/')) != 2:
        print("Error: --repo must be in owner/repo format")
        sys.exit(1)

    print(f"Scanning repository: {repo_path}")
    print(f"Target GitHub repo: {args.repo}")
    print(f"Mode: {'DRY RUN (no issues will be created)' if args.dry_run else 'LIVE (issues will be created)'}")
    print(f"Max issues: {args.max_issues}")
    print()

    # Collect files
    print("Collecting files...")
    files = collect_files(str(repo_path))
    print(f"Found {len(files)} scannable files")
    print()

    # Scan all files
    print("Scanning files for issues...")
    all_findings: List[Finding] = []
    for i, file_path in enumerate(files):
        findings = scan_file(file_path)
        if findings:
            all_findings.extend(findings)
        # Progress indicator
        if (i + 1) % 50 == 0 or (i + 1) == len(files):
            print(f"  Progress: {i+1}/{len(files)} files scanned, {len(all_findings)} findings so far...")

    print()

    if not all_findings:
        print("No issues found! The codebase is clean.")
        return

    # Deduplicate
    unique_findings = deduplicate_findings(all_findings)
    print(f"Total raw findings: {len(all_findings)}")
    print(f"After deduplication: {len(unique_findings)}")
    print()

    # Summary by category
    from collections import Counter
    category_counts = Counter(f.category for f in unique_findings)
    print("Findings by category:")
    for cat, count in category_counts.most_common():
        print(f"  {cat}: {count}")
    print()

    severity_counts = Counter(f.severity for f in unique_findings)
    print("Findings by severity:")
    for sev in ['high', 'medium', 'low']:
        print(f"  {sev}: {severity_counts.get(sev, 0)}")
    print()

    # Limit to max issues
    findings_to_create = unique_findings[:args.max_issues]
    if len(unique_findings) > args.max_issues:
        print(f"Limiting to {args.max_issues} issues (use --max-issues to change)")
        print()

    # Output JSON if requested
    if args.output:
        output_data = []
        for f in findings_to_create:
            output_data.append({
                'category': f.category,
                'severity': f.severity,
                'file_path': f.file_path,
                'line_number': f.line_number,
                'snippet': f.snippet,
                'description': f.description
            })
        with open(args.output, 'w') as out:
            json.dump(output_data, out, indent=2)
        print(f"Findings written to {args.output}")
        print()

    # Create issues
    if not args.dry_run:
        print(f"Creating {len(findings_to_create)} GitHub issues...")
        created = 0
        failed = 0
        for finding in findings_to_create:
            result = create_github_issue(args.repo, finding, token)
            if result:
                created += 1
            else:
                failed += 1
        print()
        print(f"Issues created: {created}, failed: {failed}")
    else:
        print(f"DRY RUN: Would create {len(findings_to_create)} issues")
        for f in findings_to_create[:10]:  # Show first 10
            title = f"[{f.severity.upper()}] {f.category} in {Path(f.file_path).name}:{f.line_number}"
            print(f"  - {title}")
        if len(findings_to_create) > 10:
            print(f"  ... and {len(findings_to_create) - 10} more")

    print()
    print("Done!")


if __name__ == '__main__':
    main()
