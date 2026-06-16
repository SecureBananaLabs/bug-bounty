#!/usr/bin/env python3
"""
low_hanging_fruit_scanner.py — SBL #743

Scans a SecureBananaLabs/bug-bounty codebase for common low-hanging fruit
bug patterns such as missing input validation, error-handling gaps,
hardcoded secrets, unsafe code patterns, missing type checks, and
unused imports/variables.

Supports two modes:
  - Dry-run (default):  prints findings to stdout.
  --create:            creates GitHub issues for each finding in the
                       upstream repository (requires GITHUB_TOKEN).

Usage:
  python3 low_hanging_fruit_scanner.py [--create] [--repo-dir <path>]
  python3 low_hanging_fruit_scanner.py --help

Author: cibaxhilajiao / SecureBananaLabs #743
"""

from __future__ import annotations

import argparse
import ast
import json
import os
import re
import sys
import textwrap
import urllib.error
import urllib.request
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Callable, Generator, List, Optional, Pattern, Tuple


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

ISSUE_LIMITATION_TEXT = (
    "This issue is limited only to the creator of this issue. "
    "This means that only the issue author can attempt to solve this issue. "
    "If you would like to work on it, please create another issue with the "
    "same contents and refer to issue #743 for more information."
)

# Directories/files ignored during scanning
IGNORE_DIRS = {
    ".git", "node_modules", "dist", "build", ".next", "coverage",
    "__pycache__", ".venv", "venv", "env", "images",
}
IGNORE_FILES = {
    "package-lock.json", "yarn.lock", "pnpm-lock.yaml",
    ".gitignore", ".gitkeep", "ui-home.png",
    "tsconfig.json", "next-env.d.ts", "next.config.js",
    "low_hanging_fruit_scanner.py",  # Don't scan ourselves
}
SCANNED_EXTENSIONS = {
    ".js", ".jsx", ".ts", ".tsx", ".py", ".html",
    ".json", ".yaml", ".yml", ".toml",
}


# ---------------------------------------------------------------------------
# Data model
# ---------------------------------------------------------------------------


@dataclass
class Finding:
    """A single finding uncovered by a scanner check."""

    severity: str  # critical | high | medium | low
    category: str
    title: str
    description: str
    file_path: str
    line_number: int | None = None
    snippet: str | None = None
    fix_suggestion: str | None = None

    def to_issue_body(self) -> str:
        """Return the full GitHub issue body for this finding."""
        parts = [
            f"## {self.title}",
            f"**Severity:** {self.severity}",
            f"**Category:** {self.category}",
            f"**File:** `{self.file_path}`",
        ]
        if self.line_number is not None:
            parts.append(f"**Line:** {self.line_number}")
        parts.append("")
        parts.append(self.description)
        if self.snippet:
            parts.append("")
            parts.append("```")
            parts.append(self.snippet)
            parts.append("```")
        if self.fix_suggestion:
            parts.append("")
            parts.append("### Suggested Fix")
            parts.append(self.fix_suggestion)
        parts.append("")
        parts.append("---")
        parts.append("")
        parts.append(ISSUE_LIMITATION_TEXT)
        return "\n".join(parts)

    def to_console(self, index: int, total: int) -> str:
        """Return a human-readable console line for this finding."""
        loc = f"{self.file_path}"
        if self.line_number is not None:
            loc += f":{self.line_number}"
        return (
            f"[{index:>3}/{total}] "
            f"[{self.severity:<8}] "
            f"[{self.category:<30}] "
            f"{self.title}  ({loc})"
        )


@dataclass
class ScanResult:
    """Aggregated result of a full scan."""

    findings: List[Finding] = field(default_factory=list)
    scanned_files: int = 0

    def add(self, finding: Finding) -> None:
        self.findings.append(finding)

    def by_severity(self) -> dict[str, List[Finding]]:
        order = ["critical", "high", "medium", "low"]
        groups: dict[str, List[Finding]] = {}
        for sev in order:
            groups[sev] = [f for f in self.findings if f.severity == sev]
        groups["other"] = [
            f for f in self.findings if f.severity not in order
        ]
        return groups

    def summary(self) -> str:
        groups = self.by_severity()
        lines = [
            f"Scanned {self.scanned_files} files across the repository.",
            f"Total findings: {len(self.findings)}",
        ]
        for sev, items in groups.items():
            if items:
                lines.append(f"  {sev.capitalize():>8}: {len(items)}")
        return "\n".join(lines)


# ---------------------------------------------------------------------------
# Helper: find matching closing brace for a function body
# ---------------------------------------------------------------------------


def _find_matching_brace(content: str, open_pos: int) -> int:
    """Given the position of '{', return the position of matching '}'."""
    depth = 0
    i = open_pos
    while i < len(content):
        ch = content[i]
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                return i
        # Skip strings to avoid false positives
        if ch in ("'", '"', "`"):
            quote = ch
            i += 1
            while i < len(content) and content[i] != quote:
                if content[i] == "\\":
                    i += 1  # skip escaped char
                i += 1
        i += 1
    return len(content) - 1  # fallback


# ---------------------------------------------------------------------------
# Scanner base
# ---------------------------------------------------------------------------


class BaseScanner:
    """A single scanner that registers checks against file content."""

    def __init__(self, name: str, category: str) -> None:
        self.name = name
        self.category = category
        self._checks: List[
            Tuple[str, Callable[[str, str], Optional[Finding]]]
        ] = []
        self._file_patterns: List[Pattern] = []

    def add_check(
        self,
        description: str,
        check_fn: Callable[[str, str], Optional[Finding]],
    ) -> None:
        self._checks.append((description, check_fn))

    def add_file_pattern(self, pattern: str) -> None:
        self._file_patterns.append(re.compile(pattern))

    def matches(self, file_path: str) -> bool:
        if not self._file_patterns:
            return True
        return any(p.search(file_path) for p in self._file_patterns)

    def scan(
        self, file_path: str, content: str
    ) -> Generator[Finding, None, None]:
        for _desc, check_fn in self._checks:
            try:
                result = check_fn(file_path, content)
                if result is not None:
                    yield result
            except Exception:
                pass


# ---------------------------------------------------------------------------
# 1. Missing Input Validation
# ---------------------------------------------------------------------------


class MissingValidationScanner(BaseScanner):
    """Detects Express/API route handlers missing input validation."""

    def __init__(self) -> None:
        super().__init__("missing-validation", "Missing Input Validation")
        self.add_file_pattern(r"\.(js|jsx|ts|tsx)$")
        self._init_checks()

    def _init_checks(self) -> None:
        self.add_check(
            "Controller without validation",
            self._check_controller_no_validation,
        )

    @staticmethod
    def _check_controller_no_validation(
        file_path: str, content: str
    ) -> Optional[Finding]:
        """Verify POST/PUT controllers use schema.parse()."""
        path_obj = Path(file_path)
        if "controllers" not in path_obj.parts:
            return None

        # Collect all imported schema names from validators/
        imported_schemas: set[str] = set()
        for match in re.finditer(
            r"import\s+\{([^}]+)\}\s+from\s+[\"']\.\./validators/[^\"']+[\"']",
            content,
        ):
            for name in match.group(1).split(","):
                imported_schemas.add(name.strip())

        findings: List[Finding] = []

        # Find all exported async functions taking (req, res)
        func_pat = re.compile(
            r"export\s+(async\s+)?function\s+(\w+)\s*\(([^)]*)\)\s*\{",
        )
        for func_match in func_pat.finditer(content):
            func_name = func_match.group(2)
            brace_pos = func_match.end() - 1  # position of '{'
            func_end = _find_matching_brace(content, brace_pos)
            func_body = content[func_match.start() : func_end + 1]

            # Determine if this function processes user-submitted data.
            has_user_input = any(
                kw in func_body for kw in ["req.body", "req.params", "req.query"]
            )
            if not has_user_input:
                continue

            # Check if it's already using .parse() from a Zod schema
            uses_parse = ".parse(" in func_body and any(
                s in func_body for s in imported_schemas
            )
            if uses_parse:
                continue

            # Check for custom inline validation
            has_inline_check = (
                "typeof" in func_body
                and "return fail" in func_body
            )
            if has_inline_check:
                continue

            start_line = content[: func_match.start()].count("\n") + 1
            snippet_lines = func_body.split("\n")[:10]
            snippet = "\n".join(l for l in snippet_lines if l.strip())

            findings.append(Finding(
                severity="high",
                category="Missing Input Validation",
                title=(
                    f"Controller `{func_name}` accepts user input "
                    "without Zod validation"
                ),
                description=(
                    f"The controller function `{func_name}` in `{file_path}` "
                    "accepts request body/params but does not call `.parse()` "
                    "on a Zod schema. Unvalidated input may lead to injection "
                    "or logic bugs."
                ),
                file_path=file_path,
                line_number=start_line,
                snippet=snippet,
                fix_suggestion=(
                    "Import a Zod schema and wrap the input with "
                    "`schema.parse(req.body)` at the top of the handler."
                ),
            ))

        return findings[0] if findings else None


# ---------------------------------------------------------------------------
# 2. Error Handling Gaps
# ---------------------------------------------------------------------------


class ErrorHandlingScanner(BaseScanner):
    """Detects error-handling gaps: bare try/catch, missing error middleware."""

    def __init__(self) -> None:
        super().__init__("error-handling", "Error Handling Gaps")
        self.add_file_pattern(r"\.(js|jsx|ts|tsx)$")
        self._init_checks()

    def _init_checks(self) -> None:
        self.add_check("Bare catch without forwarding", self._check_bare_catch)
        self.add_check(
            "Async handler without try/catch", self._check_async_no_try
        )

    @staticmethod
    def _check_bare_catch(file_path: str, content: str) -> Optional[Finding]:
        """Catch blocks that don't forward via next() or re-throw."""
        if "/tests/" in file_path or "/test/" in file_path:
            return None

        for match in re.finditer(r"catch\s*(?:\(\w+\))?\s*\{", content):
            block_start = match.end() - 1  # position of '{'
            block_end = _find_matching_brace(content, block_start)
            block_text = content[block_start + 1 : block_end]

            # Approved patterns that ARE proper error handling
            if "next(" in block_text:
                continue
            if "throw " in block_text:
                continue
            # res.status() + fail/ok is fine if it's not catching an express route
            # In controllers this is acceptable because they handle the response
            if "return fail" in block_text or "return res" in block_text:
                continue

            # Check if this catch only logs & re-raises
            stripped = block_text.strip()
            if "console.error" in stripped or "console.log" in stripped:
                if not any(kw in stripped for kw in ["next(", "throw "]):
                    # single-purpose log catch without rethrow
                    pass

            line_no = content[: match.start()].count("\n") + 1
            snippet = content[match.start() : match.end() + 100].split("\n")[:5]
            snippet_text = "\n".join(l for l in snippet if l.strip())

            return Finding(
                severity="medium",
                category="Error Handling Gaps",
                title="Bare catch block without error forwarding",
                description=(
                    f"A catch block in `{file_path}` does not forward the "
                    "error to Express error middleware via `next(err)`. "
                    "Errors may be silently swallowed, making debugging "
                    "difficult."
                ),
                file_path=file_path,
                line_number=line_no,
                snippet=snippet_text,
                fix_suggestion=(
                    "Forward the error using `next(err)` inside the catch "
                    "block so the centralized error handler can process it."
                ),
            )

        return None

    @staticmethod
    def _check_async_no_try(file_path: str, content: str) -> Optional[Finding]:
        """Async Express handlers with `await` but no try/catch."""
        path_obj = Path(file_path)
        if "controllers" not in path_obj.parts and "services" not in path_obj.parts:
            return None

        func_pat = re.compile(
            r"export\s+async\s+function\s+(\w+)\s*\(([^)]*)\)\s*\{",
        )
        for match in func_pat.finditer(content):
            fn_name = match.group(1)
            brace_pos = match.end() - 1
            fn_end = _find_matching_brace(content, brace_pos)
            fn_body = content[brace_pos + 1 : fn_end]

            # Has await(s)
            if "await " not in fn_body:
                continue

            # Has try?
            if "try " in fn_body[: min(500, len(fn_body))]:
                continue

            # If the only thing in the body is `return ok(res, await xxx)`,
            # that's a recognized pattern in this codebase — Express will
            # catch sync throws only, but async rejections need handling.
            line_no = content[: match.start()].count("\n") + 1
            snippet = content[match.start() : match.end() + 200].split("\n")[:6]
            snippet_text = "\n".join(l for l in snippet if l.strip())

            return Finding(
                severity="medium",
                category="Error Handling Gaps",
                title=(
                    f"Async function `{fn_name}` has `await` "
                    "without try/catch"
                ),
                description=(
                    f"The async function `{fn_name}` in `{file_path}` uses "
                    "`await` but is not wrapped in a try/catch. Rejected "
                    "promises that are not caught will cause an unhandled "
                    "promise rejection."
                ),
                file_path=file_path,
                line_number=line_no,
                snippet=snippet_text,
                fix_suggestion=(
                    "Wrap the handler body in a try/catch and forward errors "
                    "with `next(err)`."
                ),
            )

        return None


# ---------------------------------------------------------------------------
# 3. Hardcoded Secrets
# ---------------------------------------------------------------------------


class HardcodedSecretsScanner(BaseScanner):
    """Detects hardcoded secrets: API keys, passwords, tokens, JWT defaults."""

    def __init__(self) -> None:
        super().__init__("hardcoded-secrets", "Hardcoded Secrets")
        self.add_file_pattern(r"\.(js|jsx|ts|tsx|py|json|yaml|yml|toml)$")
        self._init_checks()

    def _init_checks(self) -> None:
        self.add_check("Hardcoded JWT secret default", self._check_jwt_default)
        self.add_check("Hardcoded API key / password", self._check_hardcoded_key)
        self.add_check("Stripe test key in source", self._check_stripe_test_key)

    @staticmethod
    def _check_jwt_default(file_path: str, content: str) -> Optional[Finding]:
        """Find JWT_SECRET with a non-empty default value in production code."""
        # Skip config files that are specifically designed for defaults
        if "/test" in file_path or "/tests" in file_path:
            return None

        match = re.search(
            r"JWT[_\- ]SECRET.*\?\?[\s]*[\"']([^\"']+)[\"']",
            content,
            re.IGNORECASE,
        )
        if not match:
            return None

        secret_val = match.group(1)
        # Skip obvious placeholders
        placeholders = {"", "your-secret", "secret", "change-me", "default"}
        if secret_val.lower() in placeholders:
            return None

        # Skip if there's also a non-nullish check that would prevent using default
        line_no = content[: match.start()].count("\n") + 1
        start = max(0, match.start() - 60)
        end = min(len(content), match.end() + 60)
        snippet = content[start:end].strip()

        return Finding(
            severity="critical",
            category="Hardcoded Secrets",
            title="Hardcoded JWT secret default value found",
            description=(
                f"A hardcoded JWT secret `{secret_val}` was found in "
                f"`{file_path}`. If this default is used in production, "
                "an attacker can forge arbitrary JWTs and impersonate "
                "any user."
            ),
            file_path=file_path,
            line_number=line_no,
            snippet=snippet,
            fix_suggestion=(
                "Remove the default value and throw an error at startup "
                "if JWT_SECRET is not set via environment variable."
            ),
        )

    @staticmethod
    def _check_hardcoded_key(file_path: str, content: str) -> Optional[Finding]:
        """Scan for inline API keys, passwords, or tokens."""
        if "/tests" in file_path or "/test" in file_path:
            return None

        patterns = [
            (r"(?i)api[_-]?key\s*[=:]\s*[\"'][\w\-]{16,}[\"']", "API key"),
            (r"(?i)password\s*[=:]\s*[\"'][\w!@#$%^&*()]{8,}[\"']", "Password"),
            (r"(?i)secret\s*[=:]\s*[\"'][\w\-]{16,}[\"']", "Secret"),
        ]
        for pat, label in patterns:
            match = re.search(pat, content)
            if not match:
                continue
            val = match.group(0)
            if "your-" in val.lower() or "your_" in val.lower():
                continue
            line_no = content[: match.start()].count("\n") + 1
            return Finding(
                severity="high",
                category="Hardcoded Secrets",
                title=f"Potential hardcoded {label}",
                description=(
                    f"A potential hardcoded {label} was found in "
                    f"`{file_path}`. Hardcoded credentials in source "
                    "code are a security risk."
                ),
                file_path=file_path,
                line_number=line_no,
                snippet=match.group(0)[:120],
                fix_suggestion=(
                    "Use environment variables or a secrets manager."
                ),
            )
        return None

    @staticmethod
    def _check_stripe_test_key(file_path: str, content: str) -> Optional[Finding]:
        """Detect Stripe test keys (sk_test_... / pk_test_...)."""
        if "/tests" in file_path or "/test" in file_path:
            return None
        match = re.search(r"(sk_test_|pk_test_)[\w]{10,}", content)
        if not match:
            return None
        line_no = content[: match.start()].count("\n") + 1
        return Finding(
            severity="critical",
            category="Hardcoded Secrets",
            title="Stripe test key in source code",
            description=(
                f"A Stripe test key (`{match.group(0)[:20]}...`) was found "
                f"in `{file_path}`."
            ),
            file_path=file_path,
            line_number=line_no,
            snippet=match.group(0)[:60],
            fix_suggestion=(
                "Use environment variables and rotate the exposed key."
            ),
        )


# ---------------------------------------------------------------------------
# 4. Unsafe Patterns
# ---------------------------------------------------------------------------


class UnsafePatternsScanner(BaseScanner):
    """Detects unsafe patterns: eval(), exec(), innerHTML, etc."""

    def __init__(self) -> None:
        super().__init__("unsafe-patterns", "Unsafe Patterns")
        self.add_file_pattern(r"\.(js|jsx|ts|tsx|html|vue|svelte)$")
        self._init_checks()

    def _init_checks(self) -> None:
        self.add_check("eval() usage", self._check_eval)
        self.add_check("exec() usage", self._check_exec)
        self.add_check("innerHTML / dangerouslySetInnerHTML", self._check_inner_html)
        self.add_check("Function constructor", self._check_function_ctor)

    @staticmethod
    def _check_eval(file_path: str, content: str) -> Optional[Finding]:
        for m in re.finditer(r"\beval\s*\(", content):
            line_no = content[: m.start()].count("\n") + 1
            start = max(0, m.start() - 30)
            snippet = content[start : m.end() + 30].strip()[:120]
            return Finding(
                severity="critical",
                category="Unsafe Patterns",
                title="Use of `eval()` detected",
                description="`eval()` executes arbitrary JavaScript — code injection risk.",
                file_path=file_path,
                line_number=line_no,
                snippet=snippet,
                fix_suggestion=(
                    "Replace with JSON.parse, Function constructor, or other "
                    "safe alternatives."
                ),
            )
        return None

    @staticmethod
    def _check_exec(file_path: str, content: str) -> Optional[Finding]:
        for m in re.finditer(r"\bexec\s*\(", content):
            # Skip test assertions like assert.equal or .exec() in string methods
            ctx_before = content[max(0, m.start() - 40) : m.start()]
            if "assert." in ctx_before or "regex" in ctx_before.lower():
                continue
            line_no = content[: m.start()].count("\n") + 1
            start = max(0, m.start() - 30)
            snippet = content[start : m.end() + 30].strip()[:120]
            return Finding(
                severity="critical",
                category="Unsafe Patterns",
                title="Use of `exec()` detected",
                description="`exec()` runs system commands — code injection vector.",
                file_path=file_path,
                line_number=line_no,
                snippet=snippet,
                fix_suggestion=(
                    "Use `spawn` or `execFile` with arguments instead."
                ),
            )
        return None

    @staticmethod
    def _check_inner_html(file_path: str, content: str) -> Optional[Finding]:
        for m in re.finditer(r"\.innerHTML\s*=", content):
            line_no = content[: m.start()].count("\n") + 1
            start = max(0, m.start() - 40)
            snippet = content[start : m.end() + 40].strip()[:120]
            return Finding(
                severity="high",
                category="Unsafe Patterns",
                title="`.innerHTML` assignment detected",
                description="Setting `innerHTML` with user data can lead to XSS.",
                file_path=file_path,
                line_number=line_no,
                snippet=snippet,
                fix_suggestion=(
                    "Use `textContent` or safe DOM APIs."
                ),
            )
        for m in re.finditer(r"dangerouslySetInnerHTML", content):
            line_no = content[: m.start()].count("\n") + 1
            start = max(0, m.start() - 40)
            snippet = content[start : m.end() + 40].strip()[:120]
            return Finding(
                severity="high",
                category="Unsafe Patterns",
                title="`dangerouslySetInnerHTML` detected",
                description="React's dangerouslySetInnerHTML bypasses XSS protections.",
                file_path=file_path,
                line_number=line_no,
                snippet=snippet,
                fix_suggestion="Avoid setting HTML directly.",
            )
        return None

    @staticmethod
    def _check_function_ctor(file_path: str, content: str) -> Optional[Finding]:
        for m in re.finditer(r"\bnew\s+Function\s*\(", content):
            line_no = content[: m.start()].count("\n") + 1
            start = max(0, m.start() - 20)
            snippet = content[start : m.end() + 30].strip()[:120]
            return Finding(
                severity="high",
                category="Unsafe Patterns",
                title="`new Function()` constructor detected",
                description="The Function constructor is similar to eval().",
                file_path=file_path,
                line_number=line_no,
                snippet=snippet,
                fix_suggestion="Avoid dynamic code generation.",
            )
        return None


# ---------------------------------------------------------------------------
# 5. Missing Type Checking
# ---------------------------------------------------------------------------


class MissingTypeCheckScanner(BaseScanner):
    """Detects missing JSDoc type annotations in JS/JSX controller & service files."""

    def __init__(self) -> None:
        super().__init__("missing-type-check", "Missing Type Checking")
        self.add_file_pattern(r"\.(js|jsx)$")
        self._init_checks()

    def _init_checks(self) -> None:
        self.add_check(
            "Function without JSDoc", self._check_no_jsdoc_params
        )

    @staticmethod
    def _check_no_jsdoc_params(
        file_path: str, content: str
    ) -> Optional[Finding]:
        path_obj = Path(file_path)
        if (
            "controllers" not in path_obj.parts
            and "services" not in path_obj.parts
        ):
            return None
        if "middleware" in path_obj.parts:
            return None

        func_pat = re.compile(
            r"export\s+(async\s+)?function\s+(\w+)\s*\(([^)]+)\)",
        )
        found = 0
        for match in func_pat.finditer(content):
            fn_name = match.group(2)
            params = match.group(3).strip()
            if not params:
                continue
            # Check preceding 10 lines for JSDoc
            preceding = content[
                max(0, match.start() - 500) : match.start()
            ].strip()
            has_jsdoc = "/**" in preceding and "* @param" in preceding
            if has_jsdoc:
                continue
            found += 1
            if found > 5:
                break  # cap
            line_no = content[: match.start()].count("\n") + 1
            return Finding(
                severity="low",
                category="Missing Type Checking",
                title=(
                    f"Function `{fn_name}` missing JSDoc "
                    "type annotations"
                ),
                description=(
                    f"The function `{fn_name}` in `{file_path}` has "
                    f"{len(params.split(','))} parameter(s) but no "
                    "JSDoc type annotations."
                ),
                file_path=file_path,
                line_number=line_no,
                snippet=content[match.start() : match.start() + 200][:200],
                fix_suggestion=(
                    "Add `@param {type} name - description` JSDoc tags."
                ),
            )
        return None


# ---------------------------------------------------------------------------
# 6. Unused Imports / Variables
# ---------------------------------------------------------------------------


class UnusedImportScanner(BaseScanner):
    """Basic detection of unused imports in JS/TS/Python files."""

    def __init__(self) -> None:
        super().__init__("unused-imports", "Unused Imports / Variables")
        self.add_file_pattern(r"\.(js|jsx|ts|tsx|py)$")
        self._init_checks()

    def _init_checks(self) -> None:
        self.add_check("Unused import in JS", self._check_unused_js_imports)
        self.add_check("Unused import in Python", self._check_unused_py_imports)

    @staticmethod
    def _check_unused_js_imports(
        file_path: str, content: str
    ) -> Optional[Finding]:
        named_imports = re.findall(
            r"import\s+\{([^}]+)\}\s+from", content
        )
        for group in named_imports:
            for symbol in group.split(","):
                symbol = symbol.strip()
                if not symbol:
                    continue
                # Build content without the import line
                esc = re.escape(symbol)
                pat = re.compile(rf"import\s+.*{esc}.*", re.MULTILINE)
                sans_import = pat.sub("", content, count=1)
                if symbol in sans_import:
                    continue
                line_no = None
                for i, line in enumerate(content.split("\n"), 1):
                    if symbol in line and "import" in line:
                        line_no = i
                        break
                return Finding(
                    severity="low",
                    category="Unused Imports / Variables",
                    title=f"Unused import: `{symbol}`",
                    description=(
                        f"The symbol `{symbol}` is imported in "
                        f"`{file_path}` but never used."
                    ),
                    file_path=file_path,
                    line_number=line_no,
                    snippet=f"import {{ ... {symbol} ... }} from ...",
                    fix_suggestion=f"Remove the unused import `{symbol}`.",
                )
        return None

    @staticmethod
    def _check_unused_py_imports(
        file_path: str, content: str
    ) -> Optional[Finding]:
        try:
            tree = ast.parse(content)
        except SyntaxError:
            return None

        imports: dict[str, int] = {}
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    imports[alias.asname or alias.name] = node.lineno
            elif isinstance(node, ast.ImportFrom):
                if node.module and node.module.startswith("."):
                    continue
                for alias in node.names:
                    imports[alias.asname or alias.name] = node.lineno

        for name, line_no in imports.items():
            lines = content.split("\n")
            lines[line_no - 1] = ""  # blank the import line
            if name in "\n".join(lines):
                continue
            return Finding(
                severity="low",
                category="Unused Imports / Variables",
                title=f"Unused import: `{name}`",
                description=(
                    f"The import `{name}` in `{file_path}` is never used."
                ),
                file_path=file_path,
                line_number=line_no,
                snippet=name,
                fix_suggestion=f"Remove `{name}` from imports.",
            )
        return None


# ---------------------------------------------------------------------------
# GitHub issue creator
# ---------------------------------------------------------------------------


class GitHubIssueCreator:
    """Creates issues in a GitHub repository."""

    API_BASE = "https://api.github.com"

    def __init__(self, token: str, repo: str) -> None:
        self.token = token
        self.repo = repo
        self.created: List[dict] = []

    def create_issue(self, title: str, body: str) -> dict | None:
        url = f"{self.API_BASE}/repos/{self.repo}/issues"
        payload = json.dumps({"title": title, "body": body}).encode()
        req = urllib.request.Request(
            url,
            data=payload,
            headers={
                "Authorization": f"token {self.token}",
                "Accept": "application/vnd.github.v3+json",
                "User-Agent": "SBL-Scanner/1.0",
                "Content-Type": "application/json",
            },
            method="POST",
        )
        try:
            with urllib.request.urlopen(req) as resp:
                data = json.loads(resp.read().decode())
                self.created.append(data)
                return data
        except urllib.error.HTTPError as exc:
            err_body = exc.read().decode()
            print(
                f"  [ERROR] HTTP {exc.code}: {err_body[:200]}",
                file=sys.stderr,
            )
            return None
        except Exception as exc:
            print(f"  [ERROR] {exc}", file=sys.stderr)
            return None

    def summary(self) -> str:
        return f"Created {len(self.created)} GitHub issue(s) in {self.repo}."


# ---------------------------------------------------------------------------
# Core orchestrator
# ---------------------------------------------------------------------------


def discover_scanners() -> List[BaseScanner]:
    return [
        MissingValidationScanner(),
        ErrorHandlingScanner(),
        HardcodedSecretsScanner(),
        UnsafePatternsScanner(),
        MissingTypeCheckScanner(),
        UnusedImportScanner(),
    ]


def scan_repository(
    repo_dir: Path, scanners: List[BaseScanner] | None = None
) -> ScanResult:
    if scanners is None:
        scanners = discover_scanners()

    result = ScanResult()

    for root_str, dirs, files in os.walk(str(repo_dir)):
        root = Path(root_str)
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]

        rel_root = root.relative_to(repo_dir)
        if set(rel_root.parts) & IGNORE_DIRS:
            continue

        for file in files:
            if file in IGNORE_FILES:
                continue
            ext = Path(file).suffix
            if ext not in SCANNED_EXTENSIONS:
                continue

            file_path = root / file
            rel_path = str(file_path.relative_to(repo_dir))
            try:
                content = file_path.read_text(encoding="utf-8", errors="replace")
            except Exception:
                continue

            result.scanned_files += 1

            for scanner in scanners:
                if not scanner.matches(str(file_path)):
                    continue
                for finding in scanner.scan(rel_path, content):
                    result.add(finding)

    return result


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="SBL #743 — Low-Hanging Fruit Bug Scanner",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=textwrap.dedent("""\
            Examples:
              %(prog)s                                          # dry-run
              %(prog)s --create                                  # create issues
              %(prog)s --repo-dir /path/to/bug-bounty            # custom path
              %(prog)s --min-severity high                       # only high+
        """),
    )
    parser.add_argument(
        "--create",
        action="store_true",
        help="Create GitHub issues (requires GITHUB_TOKEN in env / ~/.hermes/.env)",
    )
    parser.add_argument(
        "--repo-dir",
        type=str,
        default=None,
        help="Path to bug-bounty repository (default: auto-detect)",
    )
    parser.add_argument(
        "--repo",
        type=str,
        default="SecureBananaLabs/bug-bounty",
        help="GitHub repo to create issues in",
    )
    parser.add_argument(
        "--max-issues",
        type=int,
        default=0,
        help="Max issues to create (0 = unlimited)",
    )
    parser.add_argument(
        "--min-severity",
        type=str,
        choices=["critical", "high", "medium", "low"],
        default="low",
        help="Minimum severity level to report",
    )
    return parser


def severity_order(severity: str) -> int:
    order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    return order.get(severity, 99)


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()

    # Determine repo directory
    repo_dir: Path
    if args.repo_dir:
        repo_dir = Path(args.repo_dir).expanduser().resolve()
    else:
        script_dir = Path(__file__).resolve().parent
        if (script_dir / ".git").exists():
            repo_dir = script_dir
        else:
            repo_dir = Path.cwd()

    if not repo_dir.exists():
        print(f"Error: directory '{repo_dir}' does not exist.", file=sys.stderr)
        return 1

    print(f"🔍 Scanning repository at: {repo_dir}")
    print()

    scanners = discover_scanners()
    result = scan_repository(repo_dir, scanners)

    # Filter by min severity
    min_sev = args.min_severity
    filtered = [
        f
        for f in result.findings
        if severity_order(f.severity) <= severity_order(min_sev)
    ]
    filtered.sort(
        key=lambda f: (
            severity_order(f.severity),
            f.file_path,
            f.line_number or 0,
        )
    )

    print(result.summary())
    print()

    if not filtered:
        print("✅ No findings matching the minimum severity threshold.")
        return 0

    print(
        f"📋 Detailed findings "
        f"(showing {len(filtered)} of {len(result.findings)} total):"
    )
    print()
    for i, finding in enumerate(filtered, 1):
        print(finding.to_console(i, len(filtered)))
    print()

    # --- Create mode ---
    if args.create:
        token = os.environ.get("GITHUB_TOKEN")
        if not token:
            env_path = Path.home() / ".hermes" / ".env"
            if env_path.exists():
                for line in env_path.read_text().splitlines():
                    line = line.strip()
                    if line.startswith("GITHUB_TOKEN="):
                        token = line.split("=", 1)[1].strip().strip('"').strip("'")
                        break

        if not token:
            print(
                "❌ GITHUB_TOKEN not found. "
                "Set it as an environment variable or in ~/.hermes/.env",
                file=sys.stderr,
            )
            return 1

        max_issues = args.max_issues if args.max_issues > 0 else len(filtered)
        issues_to_create = filtered[:max_issues]

        print(
            f"🚀 Creating up to {max_issues} GitHub issue(s) "
            f"in {args.repo} ..."
        )
        creator = GitHubIssueCreator(token, args.repo)

        created_count = 0
        failed_count = 0
        for i, finding in enumerate(issues_to_create, 1):
            title = f"[Scanner] {finding.title}"
            if len(title) > 256:
                title = title[:253] + "..."

            print(
                f"  [{i}/{len(issues_to_create)}] "
                f"Creating: {finding.title[:60]}..."
            )
            issue = creator.create_issue(title, finding.to_issue_body())
            if issue:
                created_count += 1
                print(
                    f"    ✅ Created: {issue.get('html_url', '(no URL)')}"
                )
            else:
                failed_count += 1

        print()
        print(
            f"📊 Issue creation complete: "
            f"{created_count} created, {failed_count} failed."
        )
        if created_count > 0:
            print(creator.summary())

    return 0


if __name__ == "__main__":
    sys.exit(main())
