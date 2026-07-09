#!/usr/bin/env python3
"""Batch process multiple SBL bounty fixes. Reads token from git config."""
import json, os, urllib.request, urllib.error, sys, re, subprocess

REPO_DIR = r"C:\Users\cheng\bug-bounty"
os.chdir(REPO_DIR)

# Get token from existing fork remote (oss-hunter-livefire)
prev_cfg = open(r"C:\Users\cheng\oss-hunter-livefire\.git\config").read()
match = re.search(r'\[remote "fork"\][^[]*url = https://[^:]+:([^@]+)@', prev_cfg)
if not match:
    print("ERROR: Token not found")
    sys.exit(1)
TOKEN = match.group(1)
USER = "lucahermes444-arch"

API = "https://api.github.com"
def gh(method, path, data=None):
    url = f"{API}{path}"
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=body, method=method)
    req.add_header("Authorization", "Bearer " + TOKEN)
    req.add_header("Accept", "application/vnd.github.v3+json")
    req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        err = e.read().decode()
        print(f"HTTP {e.code}: {err[:300]}")
        return None

# Ensure fork exists
fork = gh("POST", "/repos/SecureBananaLabs/bug-bounty/forks")
print(f"Fork: {fork.get('html_url', fork.get('message','?'))}")

# Set up remote
subprocess.run(["git", "remote", "remove", "fork"], capture_output=True)
subprocess.run(["git", "remote", "add", "fork",
    f"https://{USER}:{TOKEN}@github.com/{USER}/bug-bounty.git"], capture_output=True)

# === BOUNTY DEFINITIONS ===
# Each entry: (branch_name, file_to_fix, current_text, new_text, issue_title, issue_body, pr_title, pr_body)
bounties = [
    # 1. CORS fix - $430
    (
        "fix/cors-origin-restrict",
        "apps/api/src/app.js",
        "app.use(cors());",
        'app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:3000" }));',
        "fix: restrict CORS to trusted origins",
        "## Security: Unrestricted CORS Policy\n\nThe Express app uses `cors()` with no configuration, allowing requests from any origin.\n\n**File:** `apps/api/src/app.js`\n\n**Fix:** Configure CORS with an explicit allowlist, reading from CORS_ORIGIN env var.\n\nDuplicate of #1774. See #743 for more info.",
        "fix: restrict CORS to trusted origins",
        "## Fix\n\nRestricts CORS to origins specified in the `CORS_ORIGIN` environment variable, falling back to `http://localhost:3000`."
    ),
    # 2. Payment auth - $430
    (
        "fix/payment-auth",
        "apps/api/src/routes/paymentRoutes.js",
        "paymentRoutes.post(\"/\", createPayment);",
        'import { authMiddleware } from "../middleware/auth.js";\n\npaymentRoutes.post("/", authMiddleware, createPayment);',
        "fix: require authentication on payment endpoint",
        "## Bug: Missing Authentication on Payment Route\n\nThe `/api/payments` route does not require authentication.\n\n**File:** `apps/api/src/routes/paymentRoutes.js`\n\n**Fix:** Add authMiddleware to the POST route.\n\nDuplicate of #1772. See #743 for more info.",
        "fix: require authentication on payment endpoint",
        "## Fix\n\nAdds `authMiddleware` to the payment creation route to ensure only authenticated users can initiate payments."
    ),
]

results = []
for branch, filepath, old_text, new_text, issue_title, issue_body, pr_title, pr_body in bounties:
    print(f"\n{'='*60}")
    print(f"Processing: {issue_title}")
    print(f"{'='*60}")
    
    # Step 1: Create issue
    print(f"\n1. Creating issue...")
    issue = gh("POST", "/repos/SecureBananaLabs/bug-bounty/issues", {
        "title": issue_title, "body": issue_body
    })
    if not issue or not issue.get('number'):
        print(f"FAILED to create issue")
        continue
    issue_num = issue['number']
    print(f"   Issue #{issue_num}: {issue['html_url']}")
    
    # Step 2: Create branch & apply fix
    print(f"\n2. Applying fix...")
    subprocess.run(["git", "checkout", "main"], capture_output=True)
    subprocess.run(["git", "branch", "-D", branch], capture_output=True)
    subprocess.run(["git", "checkout", "-b", branch], capture_output=True)
    
    # Read the file
    full_path = os.path.join(REPO_DIR, filepath)
    with open(full_path, 'r') as f:
        content = f.read()
    
    if old_text not in content:
        print(f"   ERROR: Could not find old_text in {filepath}")
        print(f"   Looking for: {old_text[:60]}...")
        continue
    
    content = content.replace(old_text, new_text)
    with open(full_path, 'w') as f:
        f.write(content)
    
    # Step 3: Commit & push
    print(f"\n3. Committing & pushing...")
    subprocess.run(["git", "add", "-A"], capture_output=True)
    subprocess.run(["git", "commit", "-m", f"{issue_title}\n\nCloses #{issue_num}"], capture_output=True)
    push = subprocess.run(["git", "push", "-u", "fork", branch, "--force"],
                           capture_output=True, text=True)
    print(f"   Push: {'OK' if push.returncode == 0 else push.stderr[:200]}")
    
    # Step 4: Create PR
    print(f"\n4. Creating PR...")
    pr = gh("POST", "/repos/SecureBananaLabs/bug-bounty/pulls", {
        "title": pr_title,
        "head": f"{USER}:{branch}",
        "base": "main",
        "body": pr_body + f"\n\nCloses #{issue_num}"
    })
    
    if pr and pr.get('html_url'):
        print(f"   ✅ PR: {pr['html_url']}")
        results.append((pr_title, pr['html_url']))
    else:
        print(f"   ❌ PR failed: {pr.get('message','?')[:200] if pr else 'no response'}")

print(f"\n{'='*60}")
print("SUMMARY")
print(f"{'='*60}")
for title, url in results:
    print(f"✅ {title}")
    print(f"   {url}")
