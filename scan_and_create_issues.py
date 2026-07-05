#!/usr/bin/env python3
"""
Automate low hanging fruit bug detection and issue creation.
Scans the repository for common code issues (e.g., TODOs, hardcoded secrets)
and creates GitHub issues with the required restriction string.
"""

import os
import re
import sys
from github import Github
from github import GithubException

# Patterns to look for (low hanging fruit)
PATTERNS = [
    (r'TODO|FIXME|XXX|HACK', 'Unresolved comment (TODO/FIXME/XXX/HACK)', 'enhancement'),
    (r'password\s*=\s*["\'](?!.*\{\{|\$)', 'Hardcoded password', 'bug'),
    (r'secret\s*=\s*["\'](?!.*\{\{|\$)', 'Hardcoded secret', 'bug'),
    (r'api.?key\s*=\s*["\'](?!.*\{\{|\$)', 'Hardcoded API key', 'bug'),
    (r'token\s*=\s*["\'](?!.*\{\{|\$)', 'Hardcoded token', 'bug'),
    (r'(?i)(exec|eval|system|popen|shell)\s*\(', 'Use of dangerous functions (exec/eval/system)', 'bug'),
    (r'DEBUG\s*=\s*True', 'Debug mode enabled in production', 'bug'),
    (r'ALLOWED_HOSTS\s*=\s*[\["\*\]]', 'Overly permissive ALLOWED_HOSTS', 'bug'),
    (r'SECRET_KEY\s*=\s*["\'][^\{]+["\']', 'Potential hardcoded SECRET_KEY', 'bug'),
]

# Restriction string to include in every issue
RESTRICTION_STRING = (
    "This issue is limited only to the creator of this issue. "
    "This means that only the issue author can attempt to solve this issue. "
    "If you would like to work on it, please create another issue with the same contents "
    "and refer to issue #743 for more information."
)

def get_github_token():
    token = os.environ.get('GITHUB_TOKEN')
    if not token:
        print("Error: GITHUB_TOKEN environment variable not set.", file=sys.stderr)
        sys.exit(1)
    return token

def get_repo_name():
    # Try environment variable, then argument
    repo_name = os.environ.get('GITHUB_REPOSITORY')
    if not repo_name and len(sys.argv) > 1:
        repo_name = sys.argv[1]
    if not repo_name:
        print("Error: Repository name not provided. Set GITHUB_REPOSITORY or pass as argument.", file=sys.stderr)
        sys.exit(1)
    return repo_name

def clone_repo_contents(g, repo_name):
    """Fetch all file contents from the default branch using GitHub API."""
    repo = g.get_repo(repo_name)
    contents = []
    default_branch = repo.default_branch
    # Recursively get tree
    tree = repo.get_git_tree(default_branch, recursive=True)
    for item in tree.tree:
        if item.type == 'blob' and item.path:
            # Skip binary files and large files (e.g., images, zip)
            if any(item.path.endswith(ext) for ext in ['.png', '.jpg', '.jpeg', '.gif', '.zip', '.tar', '.gz', '.pdf', '.exe', '.bin', '.o', '.d']):
                continue
            try:
                file_content = repo.get_contents(item.path).decoded_content.decode('utf-8', errors='ignore')
                contents.append((item.path, file_content))
            except Exception as e:
                print(f"Warning: Could not read {item.path}: {e}", file=sys.stderr)
    return contents

def scan_for_issues(contents):
    """Scan file contents for patterns and return a list of findings."""
    findings = []
    for file_path, file_content in contents:
        lines = file_content.split('\n')
        for pattern, title, label in PATTERNS:
            for line_num, line in enumerate(lines, 1):
                if re.search(pattern, line):
                    # Avoid duplicate findings for same pattern in same file
                    findings.append({
                        'file': file_path,
                        'line': line_num,
                        'content': line.strip(),
                        'title': title,
                        'label': label
                    })
                    break  # Only report first occurrence per pattern per file
    return findings

def create_issue(repo, finding):
    """Create a GitHub issue for a given finding."""
    file_path = finding['file']
    line_num = finding['line']
    snippet = finding['content']
    title = f"Low Hanging Fruit: {finding['title']} in {file_path}:{line_num}"
    body = (
        f"**Finding:** {finding['title']}\n\n"
        f"**File:** `{file_path}`\n"
        f"**Line:** {line_num}\n\n"
        f"**Snippet:**\n```\n{snippet}\n```\n\n"
        f"---\n\n{RESTRICTION_STRING}\n"
    )
    try:
        # Check if similar issue already exists to avoid duplicates
        existing_issues = repo.get_issues(state='open', labels=[finding['label']])
        for issue in existing_issues:
            if file_path in issue.title and str(line_num) in issue.title:
                print(f"Skipping duplicate issue for {file_path}:{line_num}")
                return None
        issue = repo.create_issue(
            title=title,
            body=body,
            labels=[finding['label']]
        )
        print(f"Created issue #{issue.number}: {title}")
        return issue
    except GithubException as e:
        print(f"Error creating issue: {e}", file=sys.stderr)
        return None

def main():
    token = get_github_token()
    repo_name = get_repo_name()
    g = Github(token)
    print(f"Fetching repository: {repo_name}")
    repo = g.get_repo(repo_name)
    print("Cloning contents...")
    contents = clone_repo_contents(g, repo_name)
    print(f"Found {len(contents)} files.")
    print("Scanning for low hanging fruit...")
    findings = scan_for_issues(contents)
    print(f"Found {len(findings)} potential issues.")
    if not findings:
        print("No findings to create issues for.")
        return
    # Limit to a few issues to avoid spam (optional)
    max_issues = int(os.environ.get('MAX_ISSUES', 3))
    for finding in findings[:max_issues]:
        create_issue(repo, finding)
    print("Done.")

if __name__ == '__main__':
    main()
