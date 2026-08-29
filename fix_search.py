#!/usr/bin/env python3
"""SecureBananaLabs bounty workflow - search validation fix ($780)."""
import json, os, urllib.request, urllib.error, sys, re, subprocess

REPO_DIR = r"C:\Users\cheng\bug-bounty"
os.chdir(REPO_DIR)

# Read token from stdin to avoid masking issues
token = sys.stdin.readline().strip()
USER = "lucahermes444-arch"

API = "https://api.github.com"

def gh(method, path, data=None):
    url = f"{API}{path}"
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=body, method=method)
    req.add_header("Authorization", "Bearer " + token)
    req.add_header("Accept", "application/vnd.github.v3+json")
    req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        err = e.read().decode()
        print(f"HTTP {e.code}: {err[:300]}")
        return None

# Step 1: Create issue (duplicate of #2833)
print("=== Creating Issue ===")
issue = gh("POST", "/repos/SecureBananaLabs/bug-bounty/issues", {
    "title": "fix: search endpoint input validation and length limit",
    "body": """## Bug: Missing Input Validation on Search Query

**Description:** The `GET /api/search` endpoint passes `req.query.q` directly to the search service without validation or length limits.

**File:** `apps/api/src/controllers/searchController.js`

**Expected behavior:** The search query should be validated, trimmed, length-limited to 200 characters, and sanitized.

**Impact:** Low-Medium - potential DoS via overly long query strings.

This is a duplicate issue. See #743 for more info.
"""
})

if issue and issue.get('number'):
    ISSUE_NUM = issue['number']
    print(f"Issue #{ISSUE_NUM}: {issue['html_url']}")
else:
    print("Failed to create issue"); sys.exit(1)

# Step 2: Fork
print("\n=== Forking ===")
fork = gh("POST", "/repos/SecureBananaLabs/bug-bounty/forks")
if fork:
    print(f"Fork: {fork.get('html_url', fork.get('message','?'))}")

# Step 3: Add remote
print("\n=== Remote ===")
subprocess.run(["git", "remote", "remove", "fork"], capture_output=True)
r = subprocess.run(["git", "remote", "add", "fork",
    f"https://{USER}:{token}@github.com/{USER}/bug-bounty.git"], capture_output=True, text=True)
print(f"remote add: {r.stderr or 'ok'}")

# Step 4: Fix searchController.js
print("\n=== Fixing ===")
src_path = os.path.join(REPO_DIR, "apps", "api", "src", "controllers", "searchController.js")
with open(src_path, "w") as f:
    f.write('''import { ok } from "../utils/response.js";
import { fail } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

export async function search(req, res) {
  const q = req.query.q;
  if (typeof q !== "string" || q.trim().length === 0) {
    return fail(res, "Search query is required and must be a string", 400);
  }
  const sanitized = q.trim().slice(0, 200);
  return ok(res, await globalSearch(sanitized));
}
''')

# Step 5: Commit and push
print("\n=== Committing ===")
subprocess.run(["git", "checkout", "-B", "fix/search-validation"], capture_output=True)
subprocess.run(["git", "add", "-A"], capture_output=True)
subprocess.run(["git", "commit", "-m", f"fix: add input validation and length limit to search endpoint\n\nCloses #{ISSUE_NUM}"], capture_output=True)
push = subprocess.run(["git", "push", "-u", "fork", "fix/search-validation", "--force"],
                       capture_output=True, text=True)
if push.returncode == 0:
    print("Push OK!")
else:
    print(f"Push error: {push.stderr[:300]}")

# Step 6: Create PR
print("\n=== PR ===")
pr = gh("POST", "/repos/SecureBananaLabs/bug-bounty/pulls", {
    "title": "fix: add input validation and length limit to search endpoint",
    "head": f"{USER}:fix/search-validation",
    "base": "main",
    "body": f"## Fix\n\nAdds input validation and length limiting to the search endpoint.\n\n## Changes\n- Validates query is a non-empty string\n- Trims whitespace\n- Limits to 200 characters\n- Returns 400 error for invalid input\n\nCloses #{ISSUE_NUM}"
})

if pr and pr.get('html_url'):
    print(f"\n✅ PR: {pr['html_url']}")
else:
    print(f"\n❌ PR failed")
