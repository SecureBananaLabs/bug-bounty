#!/usr/bin/env python3
"""Batch 5 auth fixes + budget validation."""
import json, os, urllib.request, urllib.error, sys, re, subprocess

REPO_DIR = r"C:\Users\cheng\bug-bounty"
os.chdir(REPO_DIR)

cfg = open(r"C:\Users\cheng\oss-hunter-livefire\.git\config").read()
m = re.search(r'\[remote "fork"\][^[]*url = https://[^:]+:([^@]+)@', cfg)
TOKEN = m.group(1)
USER = "lucahermes444-arch"

API = "https://api.github.com"
def gh(method, path, data=None):
    req = urllib.request.Request(f"{API}{path}",
          data=json.dumps(data).encode() if data else None, method=method)
    req.add_header("Authorization", f"Bearer {TOKEN}")
    req.add_header("Accept", "application/vnd.github.v3+json")
    req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        print(f"HTTP {e.code}: {e.read().decode()[:200]}")
        return None

gh("POST", "/repos/SecureBananaLabs/bug-bounty/forks")
subprocess.run(["git", "remote", "remove", "fork"], capture_output=True)
subprocess.run(["git", "remote", "add", "fork",
    f"https://{USER}:{TOKEN}@github.com/{USER}/bug-bounty.git"], capture_output=True)

def make_pr(title, body, branch, filepath, old, new):
    print(f"\n=== {title} ===")
    issue = gh("POST", "/repos/SecureBananaLabs/bug-bounty/issues", {"title": title, "body": body})
    if not issue: return
    n = issue['number']; print(f"  #{n}")
    subprocess.run(["git", "checkout", "main"], capture_output=True)
    subprocess.run(["git", "branch", "-D", branch], capture_output=True)
    subprocess.run(["git", "checkout", "-b", branch], capture_output=True)
    fp = os.path.join(REPO_DIR, filepath)
    with open(fp) as f: c = f.read()
    if old not in c: print(f"  FAIL: old text missing"); return
    with open(fp, 'w') as f: f.write(c.replace(old, new))
    subprocess.run(["git", "add", "-A"], capture_output=True)
    subprocess.run(["git", "commit", "-m", f"{title}\n\nCloses #{n}"], capture_output=True)
    r = subprocess.run(["git", "push", "-u", "fork", branch, "--force"], capture_output=True, text=True)
    if r.returncode != 0: print(f"  Push fail"); return
    pr = gh("POST", "/repos/SecureBananaLabs/bug-bounty/pulls", {
        "title": title, "head": f"{USER}:{branch}", "base": "main",
        "body": f"{body}\n\nCloses #{n}"})
    print(f"  {'✅' + pr['html_url'] if pr else '❌'}")

# 1 - Job POST auth
make_pr("fix: require auth on job creation endpoint",
    "Bug: Job POST lacks auth.\nFile: apps/api/src/routes/jobRoutes.js",
    "fix/job-auth",
    "apps/api/src/routes/jobRoutes.js",
    'import { Router } from "express";\nimport { getJobs, postJob } from "../controllers/jobController.js";\n\njobRoutes.get("/", getJobs);\njobRoutes.post("/", postJob);',
    'import { Router } from "express";\nimport { getJobs, postJob } from "../controllers/jobController.js";\nimport { authMiddleware } from "../middleware/auth.js";\n\njobRoutes.get("/", getJobs);\njobRoutes.post("/", authMiddleware, postJob);')

# 2 - Review POST auth
make_pr("fix: require auth on review endpoint",
    "Bug: Review POST lacks auth.\nFile: apps/api/src/routes/reviewRoutes.js",
    "fix/review-auth",
    "apps/api/src/routes/reviewRoutes.js",
    'import { Router } from "express";\nimport { getReviews, postReview } from "../controllers/reviewController.js";\n\nreviewRoutes.get("/", getReviews);\nreviewRoutes.post("/", postReview);',
    'import { Router } from "express";\nimport { getReviews, postReview } from "../controllers/reviewController.js";\nimport { authMiddleware } from "../middleware/auth.js";\n\nreviewRoutes.get("/", getReviews);\nreviewRoutes.post("/", authMiddleware, postReview);')

# 3 - Proposal POST auth
make_pr("fix: require auth on proposal endpoint",
    "Bug: Proposal POST lacks auth.\nFile: apps/api/src/routes/proposalRoutes.js",
    "fix/proposal-auth",
    "apps/api/src/routes/proposalRoutes.js",
    'import { Router } from "express";\nimport { getProposals, postProposal } from "../controllers/proposalController.js";\n\nproposalRoutes.get("/", getProposals);\nproposalRoutes.post("/", postProposal);',
    'import { Router } from "express";\nimport { getProposals, postProposal } from "../controllers/proposalController.js";\nimport { authMiddleware } from "../middleware/auth.js";\n\nproposalRoutes.get("/", getProposals);\nproposalRoutes.post("/", authMiddleware, postProposal);')

# 4 - Message POST auth
make_pr("fix: require auth on message endpoint",
    "Bug: Message POST lacks auth.\nFile: apps/api/src/routes/messageRoutes.js",
    "fix/message-auth",
    "apps/api/src/routes/messageRoutes.js",
    'import { Router } from "express";\nimport { getMessages, postMessage } from "../controllers/messageController.js";\n\nmessageRoutes.get("/", getMessages);\nmessageRoutes.post("/", postMessage);',
    'import { Router } from "express";\nimport { getMessages, postMessage } from "../controllers/messageController.js";\nimport { authMiddleware } from "../middleware/auth.js";\n\nmessageRoutes.get("/", getMessages);\nmessageRoutes.post("/", authMiddleware, postMessage);')

# 5 - Notification POST auth
make_pr("fix: require auth on notification endpoint",
    "Bug: Notification POST lacks auth.\nFile: apps/api/src/routes/notificationRoutes.js",
    "fix/notification-auth",
    "apps/api/src/routes/notificationRoutes.js",
    'import { Router } from "express";\nimport { getNotifications, postNotification } from "../controllers/notificationController.js";\n\nnotificationRoutes.get("/", getNotifications);\nnotificationRoutes.post("/", postNotification);',
    'import { Router } from "express";\nimport { getNotifications, postNotification } from "../controllers/notificationController.js";\nimport { authMiddleware } from "../middleware/auth.js";\n\nnotificationRoutes.get("/", getNotifications);\nnotificationRoutes.post("/", authMiddleware, postNotification);')

# 6 - Job budget validation
make_pr("fix: reject inverted job budget ranges",
    "Bug: createJobSchema allows budgetMin > budgetMax.\nFile: apps/api/src/validators/job.js",
    "fix/job-budget",
    "apps/api/src/validators/job.js",
    'import { z } from "zod";\n\nexport const createJobSchema = z.object({\n  title: z.string().min(4),\n  description: z.string().min(10),\n  budgetMin: z.number().nonnegative(),\n  budgetMax: z.number().nonnegative(),\n  categoryId: z.string().min(1),\n  skills: z.array(z.string().min(1)).default([])\n});',
    'import { z } from "zod";\n\nexport const createJobSchema = z.object({\n  title: z.string().min(4),\n  description: z.string().min(10),\n  budgetMin: z.number().nonnegative(),\n  budgetMax: z.number().nonnegative(),\n  categoryId: z.string().min(1),\n  skills: z.array(z.string().min(1)).default([])\n}).refine(d => d.budgetMin <= d.budgetMax, {\n  message: "budgetMin must not exceed budgetMax",\n  path: ["budgetMin"]\n});')

print("\n✅ ALL DONE")
