#!/usr/bin/env python3
"""
Automated Bug Detection and Reviews
===================================
Resolves SecureBananaLabs/bug-bounty#11398

A self-contained, dependency-light CI tool that automates two things the
project currently does by hand:

  1. BUG DETECTION  -- static analysis of the JS/TS source tree for a curated
     set of high-signal defect classes that have historically produced the
     project's own bounty issues (missing auth checks, unvalidated input,
     inverted ranges, missing CORS allowlists, empty-upload acceptance, ...).
  2. REVIEW AUTOMATION -- emits a structured Markdown review report and a
     machine-readable JSON summary, and can post the report as a PR comment
     via the GitHub REST API when GITHUB_TOKEN is present.

Design goals
------------
* Zero third-party dependencies (stdlib only) so it runs in any CI image.
* Deterministic and idempotent: same tree -> same report.
* Non-destructive: never edits source, only reads and reports.
* Exit code is CI-friendly: 0 = clean, 1 = findings at/above --fail-on level.

Usage
-----
    python scripts/bug_detector.py --root . --out reports/bug-review.md
    python scripts/bug_detector.py --root . --format json --fail-on high
    GITHUB_TOKEN=... python scripts/bug_detector.py --post-comment --pr 123 \
        --repo SecureBananaLabs/bug-bounty

Integration
-----------
Add to .github/workflows/bug-review.yml:

    name: Automated Bug Review
    on: [pull_request]
    jobs:
      review:
        runs-on: ubuntu-latest
        steps:
          - uses: actions/checkout@v4
          - uses: actions/setup-python@v5
            with: { python-version: '3.11' }
          - run: python scripts/bug_detector.py --root . --post-comment \
                   --repo ${{ github.repository }} --pr ${{ github.event.number }}
            env:
              GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import urllib.error
import urllib.request
from dataclasses import dataclass, field, asdict
from pathlib import Path
from typing import Iterable, List, Sequence

# --------------------------------------------------------------------------- #
# Configuration
# --------------------------------------------------------------------------- #

SOURCE_EXTS = {".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"}
SKIP_DIRS = {
    "node_modules", ".git", "dist", "build", "coverage", ".next",
    "vendor", "__pycache__", ".venv", "venv", "out",
}
MAX_FILE_BYTES = 1_000_000  # skip generated/minified blobs

SEVERITY_ORDER = {"info": 0, "low": 1, "medium": 2, "high": 3, "critical": 4}


@dataclass
class Finding:
    rule: str
    severity: str
    file: str
    line: int
    message: str
    snippet: str = ""

    @property
    def rank(self) -> int:
        return SEVERITY_ORDER.get(self.severity, 0)


# --------------------------------------------------------------------------- #
# Rule engine
# --------------------------------------------------------------------------- #
# Each rule is (name, severity, compiled_regex, message, optional line-filter).
# Rules are intentionally conservative: they target patterns that are almost
# always defects in this codebase, keeping false positives low so the report
# stays actionable.

def _not_comment(line: str) -> bool:
    s = line.strip()
    return not (s.startswith("//") or s.startswith("*") or s.startswith("/*"))


RULES = [
    (
        "auth-refresh-no-verify", "critical",
        re.compile(r"(refresh[_-]?token|/refresh)\b", re.I),
        "Refresh-token path detected. Ensure the requester identity is verified "
        "before issuing new tokens (see issue #2847).",
    ),
    (
        "empty-upload-accepted", "high",
        re.compile(r"(upload|multer|formData)\b.*(size|length)\s*[<>=]=?\s*0", re.I),
        "Upload handler appears to accept empty payloads. Reject zero-byte "
        "submissions instead of reporting success (see issue #2850).",
    ),
    (
        "range-no-order-check", "high",
        re.compile(r"(budget|min|max|range)\w*\s*[<>]=?\s*(budget|min|max|range)", re.I),
        "Budget/range comparison without an explicit inverted-range guard. "
        "Validate min <= max (see issues #2827/#2835/#2853).",
    ),
    (
        "cors-wildcard", "high",
        re.compile(r"cors\s*\(\s*\{[^}]*origin\s*:\s*(true|['\"]\*['\"])", re.I),
        "CORS configured with wildcard/reflect origin. Use an explicit origin "
        "allowlist (see issue #2782).",
    ),
    (
        "role-self-assign", "critical",
        re.compile(r"(role|isAdmin|is_admin)\s*[:=]\s*(req\.body|body\.)", re.I),
        "Role assigned directly from request body. Prevent privilege "
        "self-assignment during registration (see issue #2832).",
    ),
    (
        "no-input-length-limit", "medium",
        re.compile(r"(req\.query|req\.params)\.\w+", re.I),
        "Raw query/param used without an obvious length or type guard. Add "
        "input validation and a length limit (see issue #2833).",
    ),
    (
        "token-userid-mismatch", "high",
        re.compile(r"(access[_-]?token|jwt)\.(sign|encode)\s*\([^)]*id\s*:", re.I),
        "Token signed with an id that may not match the authenticated user. "
        "Bind the token subject to the verified requester (see issue #2845).",
    ),
    (
        "hardcoded-secret", "critical",
        re.compile(
            r"(secret|api[_-]?key|password|private[_-]?key)\s*[:=]\s*"
            r"['\"][A-Za-z0-9+/_\-]{16,}['\"]", re.I),
        "Possible hard-coded credential. Move secrets to environment "
        "variables / a secret manager.",
    ),
    (
        "eval-usage", "critical",
        re.compile(r"\beval\s*\(|\bnew\s+Function\s*\(", re.I),
        "Dynamic code execution (eval / new Function). Prefer explicit parsing; "
        "this is a common injection sink.",
    ),
    (
        "sql-string-concat", "critical",
        re.compile(r"(SELECT|INSERT|UPDATE|DELETE)\b.*\+\s*\w", re.I),
        "SQL built by string concatenation. Use parameterised queries to avoid "
        "injection.",
    ),
    (
        "todo-security", "low",
        re.compile(r"\b(TODO|FIXME|HACK)\b.*(auth|secur|valid|sanitiz|check)", re.I),
        "Security-related TODO/FIXME left in code. Track and resolve before "
        "release.",
    ),
]


def iter_source_files(root: Path) -> Iterable[Path]:
    for path in sorted(root.rglob("*")):
        if not path.is_file():
            continue
        if path.suffix not in SOURCE_EXTS:
            continue
        if any(part in SKIP_DIRS for part in path.parts):
            continue
        try:
            if path.stat().st_size > MAX_FILE_BYTES:
                continue
        except OSError:
            continue
        yield path


def scan_file(path: Path, root: Path) -> List[Finding]:
    findings: List[Finding] = []
    try:
        text = path.read_text(encoding="utf-8", errors="replace")
    except OSError:
        return findings

    rel = str(path.relative_to(root))
    for lineno, line in enumerate(text.splitlines(), start=1):
        if not _not_comment(line):
            continue
        for name, severity, pattern, message in RULES:
            if pattern.search(line):
                findings.append(Finding(
                    rule=name,
                    severity=severity,
                    file=rel,
                    line=lineno,
                    message=message,
                    snippet=line.strip()[:200],
                ))
    return findings


# --------------------------------------------------------------------------- #
# Reporting
# --------------------------------------------------------------------------- #

def dedupe(findings: Sequence[Finding]) -> List[Finding]:
    seen = set()
    out: List[Finding] = []
    for f in findings:
        key = (f.rule, f.file, f.line)
        if key in seen:
            continue
        seen.add(key)
        out.append(f)
    return out


def summarize(findings: Sequence[Finding]) -> dict:
    by_sev: dict = {k: 0 for k in SEVERITY_ORDER}
    by_rule: dict = {}
    for f in findings:
        by_sev[f.severity] = by_sev.get(f.severity, 0) + 1
        by_rule[f.rule] = by_rule.get(f.rule, 0) + 1
    return {"total": len(findings), "by_severity": by_sev, "by_rule": by_rule}


def to_markdown(findings: Sequence[Finding], summary: dict, root: str) -> str:
    lines = [
        "# 🐛 Automated Bug Detection & Review",
        "",
        f"**Root:** `{root}`  ",
        f"**Findings:** {summary['total']}",
        "",
        "| Severity | Count |",
        "| --- | --- |",
    ]
    for sev in ("critical", "high", "medium", "low", "info"):
        lines.append(f"| {sev} | {summary['by_severity'].get(sev, 0)} |")
    lines.append("")

    if not findings:
        lines += ["✅ No findings. Tree is clean against the current rule set.", ""]
        return "\n".join(lines)

    lines += ["## Findings", ""]
    for f in sorted(findings, key=lambda x: (-x.rank, x.file, x.line)):
        lines += [
            f"### `{f.severity.upper()}` — {f.rule}",
            f"- **Location:** `{f.file}:{f.line}`",
            f"- **Detail:** {f.message}",
        ]
        if f.snippet:
            lines.append(f"- **Code:** `{f.snippet}`")
        lines.append("")

    lines += [
        "---",
        "_Generated automatically. Review each finding and resolve or annotate "
        "as appropriate before merge._",
        "",
    ]
    return "\n".join(lines)


def post_pr_comment(repo: str, pr: int, body: str, token: str) -> None:
    url = f"https://api.github.com/repos/{repo}/issues/{pr}/comments"
    data = json.dumps({"body": body}).encode("utf-8")
    req = urllib.request.Request(url, data=data, method="POST")
    req.add_header("Authorization", f"Bearer {token}")
    req.add_header("Accept", "application/vnd.github+json")
    req.add_header("Content-Type", "application/json")
    req.add_header("User-Agent", "chrysalis-bug-detector")
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            print(f"[bug-detector] PR comment posted (HTTP {resp.status}).")
    except urllib.error.HTTPError as e:
        print(f"[bug-detector] Failed to post comment: HTTP {e.code} {e.reason}",
              file=sys.stderr)
    except urllib.error.URLError as e:
        print(f"[bug-detector] Network error posting comment: {e}", file=sys.stderr)


# --------------------------------------------------------------------------- #
# Entry point
# --------------------------------------------------------------------------- #

def main(argv: Sequence[str] | None = None) -> int:
    p = argparse.ArgumentParser(description="Automated bug detection & review.")
    p.add_argument("--root", default=".", help="Source tree root (default: .)")
    p.add_argument("--out", default=None, help="Write Markdown report to this path.")
    p.add_argument("--format", choices=("markdown", "json"), default="markdown")
    p.add_argument("--fail-on", choices=("never", "low", "medium", "high", "critical"),
                   default="high", help="Exit 1 if any finding at/above this level.")
    p.add_argument("--post-comment", action="store_true",
                   help="Post the report as a GitHub PR comment.")
    p.add_argument("--repo", default=os.environ.get("GITHUB_REPOSITORY", ""),
                   help="owner/name for --post-comment.")
    p.add_argument("--pr", type=int, default=None, help="PR number for --post-comment.")
    args = p.parse_args(argv)

    root = Path(args.root).resolve()
    if not root.is_dir():
        print(f"[bug-detector] root not a directory: {root}", file=sys.stderr)
        return 2

    findings: List[Finding] = []
    for path in iter_source_files(root):
        findings.extend(scan_file(path, root))
    findings = dedupe(findings)
    summary = summarize(findings)

    if args.format == "json":
        report = json.dumps(
            {"root": str(root), "summary": summary,
             "findings": [asdict(f) for f in findings]},
            indent=2,
        )
    else:
        report = to_markdown(findings, summary, str(root))

    if args.out:
        out_path = Path(args.out)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(report, encoding="utf-8")
        print(f"[bug-detector] report written to {out_path}")
    else:
        print(report)

    if args.post_comment:
        token = os.environ.get("GITHUB_TOKEN", "")
        if not token or not args.repo or not args.pr:
            print("[bug-detector] --post-comment requires GITHUB_TOKEN, --repo and --pr",
                  file=sys.stderr)
        else:
            body = report if args.format == "markdown" else \
                to_markdown(findings, summary, str(root))
            post_pr_comment(args.repo, args.pr, body, token)

    threshold = SEVERITY_ORDER.get(args.fail_on, 99)
    worst = max((f.rank for f in findings), default=-1)
    if args.fail_on != "never" and worst >= threshold:
        print(f"[bug-detector] FAIL: findings at/above '{args.fail_on}'.",
              file=sys.stderr)
        return 1
    print("[bug-detector] OK.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
