#!/usr/bin/env python3
"""
auto_low_hanging_fruit.py

A lightweight utility to automatically detect low‑hanging‑fruit bugs or
features (e.g., TODO/FIXME comments) in the current repository and create
GitHub issues for them.

The script follows the exact requirements of issue #743:
* It creates a new issue for each detected item.
* The issue body contains the mandatory disclaimer string.
* It only creates issues that do not already exist (by title search).
* It uses a personal access token supplied via the GITHUB_TOKEN environment
  variable.
* It can be run recursively (e.g., via CI) without spamming duplicate issues.

Usage:
    $ export GITHUB_TOKEN=ghp_XXXXXXXXXXXXXXXXXXXXXXXXXXXX
    $ python3 scripts/auto_low_hanging_fruit.py
"""

import os
import sys
import json
import base64
import pathlib
import hashlib
import requests
from typing import List, Tuple

# --------------------------------------------------------------------------- #
# Configuration
# --------------------------------------------------------------------------- #

# Repository information – derived from the remote URL or set manually.
REPO_OWNER = "SecureBananaLabs"
REPO_NAME = "bug-bounty"

# The disclaimer that must appear in every created issue.
DISCLAIMER = (
    "This issue is limited only to the creator of this issue. This means that "
    "only the issue author can attempt to solve this issue. If you would like "
    "to work on it, please create another issue with the same contents and "
    "refer to issue #743 for more information."
)

# File extensions to scan – feel free to extend.
SCAN_EXTENSIONS = {".py", ".js", ".ts", ".go", ".java", ".c", ".cpp", ".rs", ".md"}

# Markers that indicate a low‑hanging‑fruit item.
MARKERS = ["TODO", "FIXME", "BUG", "HACK"]


# --------------------------------------------------------------------------- #
# Helper Functions
# --------------------------------------------------------------------------- #

def get_github_token() -> str:
    token = os.getenv("GITHUB_TOKEN")
    if not token:
        sys.stderr.write("Error: GITHUB_TOKEN environment variable not set.\n")
        sys.exit(1)
    return token


def github_api_request(method: str, endpoint: str, **kwargs) -> requests.Response:
    """Perform a request against the GitHub REST API."""
    base_url = "https://api.github.com"
    headers = {
        "Authorization": f"token {get_github_token()}",
        "Accept": "application/vnd.github+json",
        "User-Agent": "auto-low-hanging-fruit-bot",
    }
    url = f"{base_url}{endpoint}"
    response = requests.request(method, url, headers=headers, **kwargs)
    if not response.ok:
        sys.stderr.write(
            f"GitHub API error [{response.status_code}]: {response.text}\n"
        )
        response.raise_for_status()
    return response


def list_existing_issues() -> List[str]:
    """Return a list of issue titles already present in the repository."""
    titles = []
    page = 1
    while True:
        resp = github_api_request(
            "GET",
            f"/repos/{REPO_OWNER}/{REPO_NAME}/issues",
            params={"state": "open", "per_page": 100, "page": page},
        )
        issues = resp.json()
        if not issues:
            break
        titles.extend(issue["title"] for issue in issues)
        page += 1
    return titles


def create_issue(title: str, body: str) -> None:
    """Create a new GitHub issue with the given title and body."""
    payload = {"title": title, "body": body}
    github_api_request(
        "POST",
        f"/repos/{REPO_OWNER}/{REPO_NAME}/issues",
        json=payload,
    )
    print(f"Issue created: {title}")


def hash_location(file_path: pathlib.Path, line_no: int) -> str:
    """Create a deterministic short hash for a location – used to avoid duplicates."""
    h = hashlib.sha1(f"{file_path}:{line_no}".encode()).hexdigest()[:8]
    return h


def find_markers(root: pathlib.Path) -> List[Tuple[pathlib.Path, int, str]]:
    """
    Recursively walk ``root`` and return a list of tuples:
    (file_path, line_number, marker_text)
    """
    findings = []
    for path in root.rglob("*"):
        if not path.is_file():
            continue
        if path.suffix not in SCAN_EXTENSIONS:
            continue
        try:
            with path.open("r", encoding="utf-8") as f:
                for idx, line in enumerate(f, start=1):
                    for marker in MARKERS:
                        if marker in line:
                            findings.append((path, idx, line.strip()))
        except (UnicodeDecodeError, PermissionError):
            # Skip binary or unreadable files
            continue
    return findings


# --------------------------------------------------------------------------- #
# Main Logic
# --------------------------------------------------------------------------- #

def main() -> None:
    repo_root = pathlib.Path(__file__).resolve().parents[1]  # repo root
    existing_titles = set(list_existing_issues())

    findings = find_markers(repo_root)

    if not findings:
        print("No low‑hanging‑fruit markers found.")
        return

    for file_path, line_no, line_text in findings:
        # Build a deterministic title – include a short hash to guarantee uniqueness
        short_hash = hash_location(file_path, line_no)
        title = f"[Auto] {file_path.relative_to(repo_root)}:{line_no} – {short_hash}"

        if title in existing_titles:
            # Issue already exists – skip
            continue

        body = (
            f"**Location:** `{file_path.relative_to(repo_root)}:{line_no}`\n\n"
            f"**Detected marker:** `{line_text}`\n\n"
            f"{DISCLAIMER}"
        )
        create_issue(title, body)


if __name__ == "__main__":
    main()
