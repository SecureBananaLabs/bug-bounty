# Fix for Issue #743: Low Handing Fruit Automation

#!/usr/bin/env python3
"""
Low Hanging Fruit Bug Detection Script

This script scans a repository for common issues and automatically creates
GitHub issues for each detected problem. It recursively searches through
the codebase to find:
- TODO/FIXME comments
- Potential security vulnerabilities
- Code quality issues
- Missing documentation
- Deprecated patterns
"""

import os
import re
import json
import hashlib
from pathlib import Path
from typing import Generator
from dataclasses import dataclass, field
from github import Github, GithubException


@dataclass
class DetectedIssue:
    """Represents a detected low-hanging fruit issue."""
    title: str
    body: str
    labels: list = field(default_factory=list)
    file_path: str = ""
    line_number: int = 0
    category: str = ""
    severity: str = "low"

    def get_unique_id(self) -> str:
        """Generate a unique identifier for deduplication."""
        content = f"{self.title}:{self.file_path}:{self.line_number}"
        return hashlib.md5(content.encode()).hexdigest()[:12]


class LowHangingFruitDetector:
    """Detects low-hanging fruit bugs in a repository."""

    ISSUE_DISCLAIMER = (
        "\n\n---\n"
        "This issue is limited only to the creator of this issue. "
        "This means that only the issue author can attempt to solve this issue. "
        "If you would like to work on it, please create another issue with the same contents "
        "and refer to issue #743 for more information."
    )

    # File extensions to scan
    SCANNABLE_EXTENSIONS = {
        '.py', '.js', '.ts', '.jsx', '.tsx', '.java', '.go', '.rb', '.php',
        '.c', '.cpp', '.h', '.hpp', '.cs', '.swift', '.kt', '.rs', '.sh',
        '.yml', '.yaml', '.json', '.md', '.txt', '.html', '.css', '.scss'
    }

    # Directories to skip
    SKIP_DIRS = {
        'node_modules', 'venv', '.venv', 'env', '.env', '__pycache__',
        '.git', '.github', 'dist', 'build', 'target', 'vendor', '.idea',
        '.vscode', 'coverage', '.nyc_output', 'eggs', '*.egg-info'
    }

    # Detection patterns
    TODO_PATTERN = re.compile(
        r'(?:#|//|/\*|\*|<!--)\s*(TODO|FIXME|HACK|XXX|BUG|OPTIMIZE)[\s:]+(.+?)(?:\*/|-->)?$',
        re.IGNORECASE | re.MULTILINE
    )

    SECURITY_PATTERNS = [
        (re.compile(r'password\s*=\s*["\'][^"\']+["\']', re.IGNORECASE),
         "Hardcoded Password", "security", "high"),
        (re.compile(r'api[_-]?key\s*=\s*["\'][^"\']+["\']', re.IGNORECASE),
         "Hardcoded API Key", "security", "high"),
        (re.compile(r'secret\s*=\s*["\'][^"\']+["\']', re.IGNORECASE),
         "Hardcoded Secret", "security", "high"),
        (re.compile(r'eval\s*\(', re.IGNORECASE),
         "Unsafe eval() Usage", "security", "medium"),
        (re.compile(r'exec\s*\(', re.IGNORECASE),
         "Unsafe exec() Usage", "security", "medium"),
        (re.compile(r'innerHTML\s*=', re.IGNORECASE),
         "Potential XSS via innerHTML", "security", "medium"),
        (re.compile(r'document\.write\s*\(', re.IGNORECASE),
         "Unsafe document.write()", "security", "medium"),
    ]

    CODE_QUALITY_PATTERNS = [
        (re.compile(r'console\.log\s*\(', re.IGNORECASE),
         "Debug console.log Statement", "code-quality", "low"),
        (re.compile(r'print\s*\([^)]*\)\s*#?\s*debug', re.IGNORECASE),
         "Debug Print Statement", "code-quality", "low"),
        (re.compile(r'debugger\s*;?', re.IGNORECASE),
         "Debugger Statement Left in Code", "code-quality", "low"),
        (re.compile(r'\.printStackTrace\s*\(\s*\)', re.IGNORECASE),
         "printStackTrace() Usage", "code-quality", "low"),
    ]

    DEPRECATED_PATTERNS = [
        (re.compile(r'componentWillMount|componentWillReceiveProps|componentWillUpdate'),
         "Deprecated React Lifecycle Method", "deprecation", "medium"),
        (re.compile(r'from\s+distutils', re.IGNORECASE),
         "Deprecated distutils Import", "deprecation", "low"),
    ]

    def __init__(self, repo_path: str = "."):
        self.repo_path = Path(repo_path)
        self.detected_issues: list[DetectedIssue] = []

    def should_scan_file(self, file_path: Path) -> bool:
        """Check if a file should be scanned."""
        # Check extension
        if file_path.suffix.lower() not in self.SCANNABLE_EXTENSIONS:
            return False

        # Check if in skip directory
        for part in file_path.parts:
            if part in self.SKIP_DIRS:
                return False

        return True

    def get_files_recursive(self) -> Generator[Path, None, None]:
        """Recursively get all scannable files."""
        for file_path in self.repo_path.rglob('*'):
            if file_path.is_file() and self.should_scan_file(file_path):
                yield file_path

    def detect_todos(self, content: str, file_path: Path) -> list[DetectedIssue]:
        """Detect TODO/FIXME comments."""
        issues = []
        lines = content.split('\n')

        for line_num, line in enumerate(lines, 1):
            match = self.TODO_PATTERN.search(line)
            if match:
                tag = match.group(1).upper()
                message = match.group(2).strip()

                if len(message) > 10:  # Filter out very short/meaningless TODOs
                    issue = DetectedIssue(
                        title=f"[{tag}] {message[:60]}{'...' if len(message) > 60 else ''}",
                        body=self._create_todo_body(tag, message, file_path, line_num, line),
                        labels=["low-hanging-fruit", "automated", tag.lower()],
                        file_path=str(file_path),
                        line_number=line_num,
                        category="todo",
                        severity="low"
                    )
                    issues.append(issue)

        return issues

    def detect_patterns(self, content: str, file_path: Path,
                        patterns: list, category_name: str) -> list[DetectedIssue]:
        """Detect issues based on regex patterns."""
        issues = []
        lines = content.split('\n')

        for pattern, description, category, severity in patterns:
            for line_num, line in enumerate(lines, 1):
                if pattern.search(line):
                    issue = DetectedIssue(
                        title=f"[{category.upper()}] {description} in {file_path.name}",
                        body=self._create_pattern_body(
                            description, file_path, line_num, line, category, severity
                        ),
                        labels=["low-hanging-fruit", "automated", category],
                        file_path=str(file_path),
                        line_number=line_num,
                        category=category,
                        severity=severity
                    )
                    issues.append(issue)

        return issues

    def _create_todo_body(self, tag: str, message: str, file_path: Path,
                          line_num: int, line_content: str) -> str:
        """Create issue body for TODO/FIXME."""
        return f"""## {tag} Found

**File:** `{file_path}`
**Line:** {line_num}

### Description
{message}

### Code Context