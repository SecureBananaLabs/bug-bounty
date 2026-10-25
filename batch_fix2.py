#!/usr/bin/env python3
"""Batch process multiple SBL bounty fixes. Reads token from git config."""
import json, os, urllib.request, urllib.error, sys, re, subprocess

REPO_DIR = r"C:\Users\cheng\bug-bounty"
os.chdir(REPO_DIR)

# Get token from existing fork remote
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

# Ensure fork
fork = gh("POST", "/repos/SecureBananaLabs/bug-bounty/forks")
print(f"Fork: {fork.get('html_url', fork.get('message','?'))}")

subprocess.run(["git", "remote", "remove", "fork"], capture_output=True)
subprocess.run(["git", "remote", "add", "fork",
    f"https://{USER}:{TOKEN}@github.com/{USER}/bug-bounty.git"], capture_output=True)

bounties = [
    # Upload auth - $430
    ("fix/upload-auth",
     "apps/api/src/routes/uploadRoutes.js",
     'import { Router } from "express";\nimport multer from "multer";\nimport { uploadFile } from "../controllers/uploadController.js";\n\nconst upload = multer({ storage: multer.memoryStorage() });\n\nexport const uploadRoutes = Router();\n\nuploadRoutes.post("/", upload.single("file"), uploadFile);',
     'import { Router } from "express";\nimport multer from "multer";\nimport { uploadFile } from "../controllers/uploadController.js";\nimport { authMiddleware } from "../middleware/auth.js";\n\nconst upload = multer({ storage: multer.memoryStorage() });\n\nexport const uploadRoutes = Router();\n\nuploadRoutes.post("/", authMiddleware, upload.single("file"), uploadFile);',
     "fix: require authentication on upload endpoint",
     "## Bug: Upload endpoint lacks authentication\n\nFile: apps/api/src/routes/uploadRoutes.js\n\nFix: Add authMiddleware.\n\nSee #743.",
     "Closes #{n}"),

    # Refresh token validation - $430
    ("fix/refresh-token",
     "apps/api/src/controllers/authController.js",
     '  const result = await refreshToken();',
     '  const result = await refreshToken(req.body.refreshToken);',
     "fix: validate refresh token in refresh endpoint",
     "## Bug: Refresh ignores provided token\n\nFile: apps/api/src/controllers/authController.js\n\nFix: Pass req.body.refreshToken.\n\nSee #743.",
     "Closes #{n}"),

    # User creation validation - $430
    ("fix/user-validation",
     "apps/api/src/controllers/userController.js",
     'export async function postUser(req, res) {\n  return ok(res, await createUser(req.body), 201);\n}',
     'export async function postUser(req, res) {\n  const { name, email } = req.body;\n  if (!name || !email) {\n    const { fail } = await import("../utils/response.js");\n    return fail(res, "name and email are required", 400);\n  }\n  return ok(res, await createUser({ name, email, role: "client" }), 201);\n}',
     "fix: add input validation to user creation endpoint",
     "## Bug: User creation accepts empty payloads\n\nFile: apps/api/src/controllers/userController.js\n\nFix: Validate required fields.\n\nSee #743.",
     "Closes #{n}"),

    # Register schema shouldn't allow admin - $780
    ("fix/register-no-admin",
     "apps/api/src/validators/auth.js",
     '  role: z.enum(["client", "freelancer", "admin"]).default("client")',
     '  role: z.enum(["client", "freelancer"]).default("client")',
     "fix: prevent admin role self-assignment during registration",
     "## Security: Registration allows admin role\n\nFile: apps/api/src/validators/auth.js\n\nFix: Remove admin from allowed roles.\n\nSee #743.",
     "Closes #{n}"),
]

results = []
for branch, filepath, old_text, new_text, issue_title, issue_body, pr_body in bounties:
    print(f"\n{'='*60}")
    print(f"  {issue_title}")
    print(f"{'='*60}")

    issue = gh("POST", "/repos/SecureBananaLabs/bug-bounty/issues", {
        "title": issue_title, "body": issue_body
    })
    if not issue or not issue.get('number'):
        print(f"  FAIL: issue creation")
        continue
    num = issue['number']
    print(f"  Issue #{num}")

    subprocess.run(["git", "checkout", "main"], capture_output=True)
    subprocess.run(["git", "branch", "-D", branch], capture_output=True)
    subprocess.run(["git", "checkout", "-b", branch], capture_output=True)

    full_path = os.path.join(REPO_DIR, filepath)
    with open(full_path, 'r') as f:
        content = f.read()
    if old_text not in content:
        print(f"  FAIL: can't find old text in {filepath}")
        continue
    content = content.replace(old_text, new_text)
    with open(full_path, 'w') as f:
        f.write(content)

    subprocess.run(["git", "add", "-A"], capture_output=True)
    subprocess.run(["git", "commit", "-m", f"{issue_title}\n\nCloses #{num}"], capture_output=True)
    push = subprocess.run(["git", "push", "-u", "fork", branch, "--force"],
                           capture_output=True, text=True)
    if push.returncode != 0:
        print(f"  Push failed: {push.stderr[:200]}")
        continue

    pr = gh("POST", "/repos/SecureBananaLabs/bug-bounty/pulls", {
        "title": issue_title,
        "head": f"{USER}:{branch}",
        "base": "main",
        "body": pr_body.replace("{n}", str(num))
    })
    if pr and pr.get('html_url'):
        print(f"  ✅ {pr['html_url']}")
        results.append((issue_title, pr['html_url']))
    else:
        print(f"  ❌ PR failed")

print(f"\n{'='*60}")
print(f"  SUMMARY: {len(results)} PRs")
print(f"{'='*60}")
for t, u in results:
    print(f"  ✅ {t}")
    print(f"     {u}")
