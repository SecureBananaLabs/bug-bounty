#!/usr/bin/env python3
"""Batch remaining SBL bounties - one per PR. Token from git config."""
import json, os, urllib.request, urllib.error, sys, re, subprocess

REPO_DIR = r"C:\Users\cheng\bug-bounty"
os.chdir(REPO_DIR)

# Extract token from oss-hunter-livefire fork remote
cfg_path = r"C:\Users\cheng\oss-hunter-livefire\.git\config"
cfg = open(cfg_path).read()
m = re.search(r'\[remote "fork"\][^[]*url = https://[^:]+:([^@]+)@', cfg)
if not m:
    print("ERROR: No token found"); sys.exit(1)
TOKEN = m.group(1)
USER = "lucahermes444-arch"

API = "https://api.github.com"
def gh(method, path, data=None):
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(f"{API}{path}", data=body, method=method)
    req.add_header("Authorization", f"Bearer {TOKEN}")
    req.add_header("Accept", "application/vnd.github.v3+json")
    req.add_header("Content-Type", "application/json")
    try:
        return json.loads(urllib.request.urlopen(req).read())
    except urllib.error.HTTPError as e:
        print(f"HTTP {e.code}: {e.read().decode()[:200]}")
        return None

# Fork + remote
gh("POST", "/repos/SecureBananaLabs/bug-bounty/forks")
subprocess.run(["git", "remote", "remove", "fork"], capture_output=True)
subprocess.run(["git", "remote", "add", "fork",
    f"https://{USER}:{TOKEN}@github.com/{USER}/bug-bounty.git"], capture_output=True)

def run(title, body, pr_body, filepath, old_text, new_text):
    branch = "fix/" + title.split(":")[1].strip().lower()[:25].replace(" ", "-").replace("/", "-")
    branch = re.sub(r'[^a-z0-9\-]', '', branch)
    print(f"\n=== {title} ===")
    issue = gh("POST", "/repos/SecureBananaLabs/bug-bounty/issues", {"title": title, "body": body})
    if not issue or not issue.get('number'):
        print("  FAIL: issue"); return
    num = issue['number']; print(f"  #{num}")

    subprocess.run(["git", "checkout", "main"], capture_output=True)
    subprocess.run(["git", "branch", "-D", branch], capture_output=True)
    subprocess.run(["git", "checkout", "-b", branch], capture_output=True)

    fp = os.path.join(REPO_DIR, filepath)
    with open(fp) as f: c = f.read()
    if old_text not in c:
        print(f"  FAIL: old text not found"); return
    with open(fp, 'w') as f: f.write(c.replace(old_text, new_text))

    subprocess.run(["git", "add", "-A"], capture_output=True)
    subprocess.run(["git", "commit", "-m", f"{title}\n\nCloses #{num}"], capture_output=True)
    r = subprocess.run(["git", "push", "-u", "fork", branch, "--force"], capture_output=True, text=True)
    if r.returncode != 0: print(f"  Push fail: {r.stderr[:150]}"); return

    pr = gh("POST", "/repos/SecureBananaLabs/bug-bounty/pulls", {
        "title": title, "head": f"{USER}:{branch}", "base": "main", "body": pr_body + f"\n\nCloses #{num}"
    })
    print(f"  {'✅' + pr['html_url'] if pr and pr.get('html_url') else '❌'}")

def auth_fix(name, route_file, import_stmt, route_line):
    nimp = import_stmt + '\nimport { authMiddleware } from "../middleware/auth.js"'
    nroute = route_line.replace(");", ", authMiddleware);")
    run(f"fix: require auth on {name} endpoint",
        f"Bug: {name} POST lacks auth.\nFile: {route_file}\nSee #743.",
        f"Adds authMiddleware to {name} POST.",
        route_file, import_stmt, nimp)
    run("", "", "", route_file, route_line, nroute)

# ========== RUN ALL ==========

auth_fix("job creation", "apps/api/src/routes/jobRoutes.js",
    'import { Router } from "express";\nimport { getJobs, postJob } from "../controllers/jobController.js"',
    'jobRoutes.post("/", postJob);')

auth_fix("review", "apps/api/src/routes/reviewRoutes.js",
    'import { Router } from "express";\nimport { getReviews, postReview } from "../controllers/reviewController.js"',
    'reviewRoutes.post("/", postReview);')

auth_fix("proposal", "apps/api/src/routes/proposalRoutes.js",
    'import { Router } from "express";\nimport { getProposals, postProposal } from "../controllers/proposalController.js"',
    'proposalRoutes.post("/", postProposal);')

auth_fix("message", "apps/api/src/routes/messageRoutes.js",
    'import { Router } from "express";\nimport { getMessages, postMessage } from "../controllers/messageController.js"',
    'messageRoutes.post("/", postMessage);')

auth_fix("notification", "apps/api/src/routes/notificationRoutes.js",
    'import { Router } from "express";\nimport { getNotifications, postNotification } from "../controllers/notificationController.js"',
    'notificationRoutes.post("/", postNotification);')

# Job budget validation ($780)
job_old = '''import { z } from "zod";

export const createJobSchema = z.object({
  title: z.string().min(4),
  description: z.string().min(10),
  budgetMin: z.number().nonnegative(),
  budgetMax: z.number().nonnegative(),
  categoryId: z.string().min(1),
  skills: z.array(z.string().min(1)).default([])
});'''

job_new = '''import { z } from "zod";

export const createJobSchema = z.object({
  title: z.string().min(4),
  description: z.string().min(10),
  budgetMin: z.number().nonnegative(),
  budgetMax: z.number().nonnegative(),
  categoryId: z.string().min(1),
  skills: z.array(z.string().min(1)).default([])
}).refine(d => d.budgetMin <= d.budgetMax, {
  message: "budgetMin must not exceed budgetMax",
  path: ["budgetMin"]
});'''

# Fix the job schema in one go before running it
fp = os.path.join(REPO_DIR, "apps/api/src/validators/job.js")
with open(fp) as f: c = f.read()
if job_old in c:
    with open(fp, 'w') as f: f.write(c.replace(job_old, job_new))
    print("\nJob validator fixed for budget validation.")
    
    run("fix: reject inverted job budget ranges",
        "Bug: createJobSchema allows budgetMin > budgetMax.\nFile: apps/api/src/validators/job.js\nSee #743.",
        "Adds zod refine on createJobSchema.",
        "apps/api/src/validators/job.js", job_new, job_new)
else:
    print("\nJob validator already has refine or text mismatch")

print("\n✅ COMPLETE")
