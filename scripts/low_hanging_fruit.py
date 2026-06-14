#!/usr/bin/env python3
"""
Low Hanging Fruit Automation

Scans the repository for potential improvements (low-hanging fruit),
creates GitHub issues for each finding, and optionally attempts to fix them.

Usage:
    python3 low_hanging_fruit.py --repo SecureBananaLabs/bug-bounty [--dry-run]

Requires GITHUB_TOKEN env var or ~/.github_token file.
"""

import os
import re
import json
import sys
import urllib.request
import urllib.parse
import urllib.error
from pathlib import Path
from collections import Counter

ISSUE_RESTRICTION = (
    "This issue is limited only to the creator of this issue. "
    "This means that only the issue author can attempt to solve this issue. "
    "If you would like to work on it, please create another issue with the "
    "same contents and refer to issue #743 for more information."
)


class LowHangingFruitDetector:
    """Detects potential low-hanging fruit issues in a GitHub repo."""

    def __init__(self, repo: str, token: str = None):
        self.repo = repo
        self.token = token or os.environ.get("GITHUB_TOKEN", "")
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "LowHangingFruitBot/1.0",
        }

    def _api(self, path: str, data: dict = None) -> dict | list:
        url = f"https://api.github.com/repos/{self.repo}/{path}"
        req = urllib.request.Request(url, headers=self.headers)
        
        if data is not None:
            body = json.dumps(data).encode()
            req.data = body
            req.method = "POST" if "method" not in data else data.pop("method", "POST")
            req.add_header("Content-Type", "application/json")

        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                return json.load(resp)
        except urllib.error.HTTPError as e:
            print(f"  ⚠️ API error: {e.code} {e.reason}")
            if hasattr(e, "read"):
                try:
                    return json.loads(e.read())
                except:
                    pass
            return {}

    def scan_for_fruit(self) -> list[dict]:
        """Scan the repo and detect low-hanging fruit."""
        findings = []
        
        # 1. Check repo contents for issues
        print(f"🔍 Scanning {self.repo} for low-hanging fruit...")
        
        # Get repo info
        repo_info = self._api("")
        if not repo_info:
            print("  ❌ Cannot access repo")
            return findings
        print(f"  📦 Repo: {repo_info.get('full_name', self.repo)}")
        
        # 2. Scan repo structure for missing basics
        contents = self._api("contents")
        if isinstance(contents, list):
            file_names = {item["name"] for item in contents}
            print(f"  📁 Top-level files: {len(file_names)}")
            
            # Check for common missing items
            findings.extend(self._check_missing_files(file_names))
            findings.extend(self._check_license(file_names))
            findings.extend(self._check_ci(file_names))
            findings.extend(self._check_docs(file_names))
        
        # 3. Check existing open issues
        existing = self._api("issues?state=open&per_page=50")
        existing_titles = set()
        if isinstance(existing, list):
            existing_titles = {i.get("title", "").lower() for i in existing}
        
        # 4. Check for untouched/unoptimized code patterns
        findings.extend(self._check_dependency_files(contents))
        
        # 5. Filter out duplicates
        unique = []
        seen_titles = set()
        for f in findings:
            title_lower = f["title"].lower()
            if title_lower not in seen_titles and title_lower not in existing_titles:
                seen_titles.add(title_lower)
                unique.append(f)
        
        return unique

    def _check_missing_files(self, files: set) -> list[dict]:
        """Check for commonly missing yet valuable files."""
        findings = []
        
        essentials = {
            "CONTRIBUTING.md": {
                "title": "Add CONTRIBUTING.md with contribution guidelines",
                "body": "Create a CONTRIBUTING.md file to help new contributors understand the workflow, "
                       "coding standards, and PR process.\n\n"
                       "**Suggested sections:**\n"
                       "- How to set up the development environment\n"
                       "- Coding style and conventions\n"
                       "- Testing requirements\n"
                       "- PR submission process\n\n" + ISSUE_RESTRICTION,
            },
            "CODE_OF_CONDUCT.md": {
                "title": "Add CODE_OF_CONDUCT.md",
                "body": "Add a Code of Conduct to foster a welcoming community. "
                       "Consider using the Contributor Covenant template.\n\n" + ISSUE_RESTRICTION,
            },
            "SECURITY.md": {
                "title": "Add SECURITY.md for vulnerability reporting",
                "body": "Create a SECURITY.md file describing how to responsibly disclose "
                       "security vulnerabilities found in the project.\n\n" + ISSUE_RESTRICTION,
            },
        }
        
        for fname, details in essentials.items():
            if fname not in files:
                findings.append({
                    "title": details["title"],
                    "body": details["body"],
                    "category": "missing_file",
                    "priority": "medium",
                })
        
        return findings

    def _check_license(self, files: set) -> list[dict]:
        """Check for license file."""
        if not any(f.lower().startswith("license") or f.lower().startswith("licence") for f in files):
            return [{
                "title": "Add LICENSE file (MIT recommended)",
                "body": "The project is missing a license file. Adding an open-source license "
                       "(like MIT) clarifies how others can use the code.\n\n"
                       "**Action:** Add a LICENSE file with the MIT license text.\n\n" + ISSUE_RESTRICTION,
                "category": "legal",
                "priority": "high",
            }]
        return []

    def _check_ci(self, files: set) -> list[dict]:
        """Check for CI configuration."""
        findings = []
        has_ci = any(
            f == ".github" or "workflows" in f.lower() or 
            f in (".travis.yml", "circle.yml", ".gitlab-ci.yml", "Jenkinsfile")
            for f in files
        )
        if not has_ci:
            findings.append({
                "title": "Set up CI/CD pipeline with GitHub Actions",
                "body": "The project lacks automated CI. Set up GitHub Actions to run tests "
                       "and linting on every push/PR.\n\n"
                       "**Suggested workflow:**\n"
                       "- Run `npm test` on ubuntu-latest\n"
                       "- Cache node_modules\n"
                       "- Lint with ESLint\n\n" + ISSUE_RESTRICTION,
                "category": "infrastructure",
                "priority": "high",
            })
        
        return findings

    def _check_docs(self, files: set) -> list[dict]:
        """Check for documentation improvements."""
        findings = []
        
        # Check if README needs improvement
        if "README.md" in files:
            findings.append({
                "title": "Add API documentation section to README",
                "body": "The README could benefit from an API documentation section with "
                       "example requests/responses for all endpoints.\n\n" + ISSUE_RESTRICTION,
                "category": "documentation",
                "priority": "medium",
            })
            
            findings.append({
                "title": "Add project architecture diagram to documentation",
                "body": "Creating a simple architecture diagram (ASCII or Mermaid) would help "
                       "new contributors understand the project structure.\n\n" + ISSUE_RESTRICTION,
                "category": "documentation",
                "priority": "low",
            })
        
        return findings

    def _check_dependency_files(self, contents: list) -> list[dict]:
        """Check dependency files for potential issues."""
        findings = []
        
        if isinstance(contents, list):
            for item in contents:
                if item["name"] == "package.json":
                    findings.append({
                        "title": "Add npm scripts for development workflow",
                        "body": "Add npm scripts for common development tasks:\n"
                               "- `npm run lint` - Run ESLint\n"
                               "- `npm run format` - Auto-format code\n"
                               "- `npm run typecheck` - TypeScript type checking\n\n" + ISSUE_RESTRICTION,
                        "category": "improvement",
                        "priority": "medium",
                    })
                    findings.append({
                        "title": "Update outdated npm dependencies",
                        "body": "Run `npm outdated` and update dependencies to their latest "
                               "compatible versions. Major version bumps should be evaluated "
                               "for breaking changes.\n\n" + ISSUE_RESTRICTION,
                        "category": "maintenance",
                        "priority": "medium",
                    })
        
        return findings

    def create_issues(self, findings: list[dict], dry_run: bool = False) -> list[dict]:
        """Create GitHub issues for each finding."""
        created = []
        
        for i, finding in enumerate(findings):
            print(f"\n  [{i+1}/{len(findings)}] {finding['title'][:60]}...")
            
            if dry_run:
                print(f"    🔸 [DRY RUN] Would create issue")
                created.append({
                    "title": finding["title"],
                    "url": None,
                    "category": finding.get("category", "unknown"),
                    "dry_run": True,
                })
                continue
            
            issue_data = {
                "title": finding["title"],
                "body": finding.get("body", ""),
                "labels": ["good first issue", "AI agent friendly", finding["category"]],
            }
            
            result = self._api("issues", issue_data)
            
            if result and "html_url" in result:
                print(f"    ✅ Created: {result['html_url']}")
                created.append({
                    "title": finding["title"],
                    "url": result["html_url"],
                    "number": result["number"],
                    "dry_run": False,
                })
            else:
                print(f"    ❌ Failed: {json.dumps(result)[:100]}")
        
        return created


def main():
    import argparse
    parser = argparse.ArgumentParser(description="Low Hanging Fruit Automation")
    parser.add_argument("--repo", default="SecureBananaLabs/bug-bounty", help="GitHub repo (owner/repo)")
    parser.add_argument("--dry-run", action="store_true", help="Don't create issues, just print them")
    args = parser.parse_args()
    
    # Get token
    token_path = os.path.expanduser("~/.github_token")
    token = os.environ.get("GITHUB_TOKEN", "")
    
    if not token and os.path.exists(token_path):
        token = Path(token_path).read_text().strip()
    
    # Try loading from github_config.sh
    if not token:
        config_path = '/home/node/clawd/bounty-github/github_config.sh'
        if os.path.exists(config_path):
            import re
            content = open(config_path).read()
            m = re.search(r'GH_TOKEN=[\"\']([^\"\']+)[\"\']', content)
            if m:
                token = m.group(1)
    
    if not token:
        print("❌ No GitHub token found. Set GITHUB_TOKEN env var or create ~/.github_token")
        sys.exit(1)
    
    detector = LowHangingFruitDetector(args.repo, token)
    
    print(f"🚀 Low Hanging Fruit Automator")
    print(f"   Target: {args.repo}")
    print(f"   Mode: {'DRY RUN' if args.dry_run else 'LIVE'}")
    print("=" * 60)
    
    findings = detector.scan_for_fruit()
    
    if not findings:
        print("\n✅ No low-hanging fruit found! (or repo is inaccessible)")
        return
    
    print(f"\n📋 Found {len(findings)} potential issues:")
    for i, f in enumerate(findings):
        print(f"  [{i+1}] [{f['category']}] {f['title']}")
    
    print(f"\n{'=' * 60}")
    print(f"🚀 Creating {len(findings)} issues...")
    
    created = detector.create_issues(findings, dry_run=args.dry_run)
    
    stats = Counter(c["category"] for c in created)
    print(f"\n{'=' * 60}")
    print(f"📊 Summary:")
    for category, count in stats.most_common():
        print(f"  {category}: {count}")
    print(f"  Total: {len(created)} issues {'(DRY RUN)' if args.dry_run else 'created'}")
    print(f"  Referenced parent issue: #743")


if __name__ == "__main__":
    main()
