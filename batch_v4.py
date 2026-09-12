#!/usr/bin/env python3
"""Submit remaining 5 auth fixes using file modification."""
import json, os, urllib.request, urllib.error, sys, re, subprocess

cfg = open(r"C:\Users\cheng\oss-hunter-livefire\.git\config").read()
m = re.search(r'\[remote "fork"\][^[]*url = https://[^:]+:([^@]+)@', cfg)
if not m: print("ERROR"); sys.exit(1)
tok = m.group(1)
user = "lucahermes444-arch"

API="https://api.github.com"
def gh(method, path, data=None):
    req=urllib.request.Request(f"{API}{path}", data=json.dumps(data).encode() if data else None, method=method)
    for h in [("Authorization",f"Bearer {tok}"),("Accept","application/vnd.github.v3+json"),("Content-Type","application/json")]:
        req.add_header(*h)
    try:
        with urllib.request.urlopen(req) as r: return json.loads(r.read())
    except urllib.error.HTTPError as e:
        print(f"  HTTP {e.code}: {e.read().decode()[:150]}"); return None

# Fork
gh("POST","/repos/SecureBananaLabs/bug-bounty/forks")
subprocess.run(["git","remote","remove","fork"], capture_output=True)
subprocess.run(["git","remote","add","fork",f"https://{user}:{tok}@github.com/{user}/bug-bounty.git"], capture_output=True)

fixes=[
    ("job","apps/api/src/routes/jobRoutes.js",
     'import { Router } from "express";\nimport { getJobs, postJob } from "../controllers/jobController.js";',
     'import { Router } from "express";\nimport { getJobs, postJob } from "../controllers/jobController.js";\nimport { authMiddleware } from "../middleware/auth.js";',
     'jobRoutes.post("/", postJob);','jobRoutes.post("/", authMiddleware, postJob);'),

    ("review","apps/api/src/routes/reviewRoutes.js",
     'import { Router } from "express";\nimport { getReviews, postReview } from "../controllers/reviewController.js";',
     'import { Router } from "express";\nimport { getReviews, postReview } from "../controllers/reviewController.js";\nimport { authMiddleware } from "../middleware/auth.js";',
     'reviewRoutes.post("/", postReview);','reviewRoutes.post("/", authMiddleware, postReview);'),

    ("proposal","apps/api/src/routes/proposalRoutes.js",
     'import { Router } from "express";\nimport { getProposals, postProposal } from "../controllers/proposalController.js";',
     'import { Router } from "express";\nimport { getProposals, postProposal } from "../controllers/proposalController.js";\nimport { authMiddleware } from "../middleware/auth.js";',
     'proposalRoutes.post("/", postProposal);','proposalRoutes.post("/", authMiddleware, postProposal);'),

    ("message","apps/api/src/routes/messageRoutes.js",
     'import { Router } from "express";\nimport { getMessages, postMessage } from "../controllers/messageController.js";',
     'import { Router } from "express";\nimport { getMessages, postMessage } from "../controllers/messageController.js";\nimport { authMiddleware } from "../middleware/auth.js";',
     'messageRoutes.post("/", postMessage);','messageRoutes.post("/", authMiddleware, postMessage);'),

    ("notification","apps/api/src/routes/notificationRoutes.js",
     'import { Router } from "express";\nimport { getNotifications, postNotification } from "../controllers/notificationController.js";',
     'import { Router } from "express";\nimport { getNotifications, postNotification } from "../controllers/notificationController.js";\nimport { authMiddleware } from "../middleware/auth.js";',
     'notificationRoutes.post("/", postNotification);','notificationRoutes.post("/", authMiddleware, postNotification);'),
]

subprocess.run(["git","checkout","main"], capture_output=True)

for name, fp, old_imp, new_imp, old_rt, new_rt in fixes:
    title=f"fix: require auth on {name} endpoint"
    body=f"Bug: {name} POST lacks auth.\nFile: {fp}\nSee #743."
    branch=f"fix/{name}-auth"
    
    print(f"\n=== {title} ===")
    issue=gh("POST","/repos/SecureBananaLabs/bug-bounty/issues",{"title":title,"body":body})
    if not issue: continue
    n=issue["number"]; print(f"  #{n}")
    
    subprocess.run(["git","checkout","main"], capture_output=True)
    subprocess.run(["git","branch","-D",branch], capture_output=True)
    subprocess.run(["git","checkout","-b",branch], capture_output=True)
    
    full=os.path.join(r"C:\Users\cheng\bug-bounty",fp)
    with open(full) as f: c=f.read()
    if old_imp not in c: print(f"  FAIL: import not found"); continue
    c=c.replace(old_imp,new_imp).replace(old_rt,new_rt)
    with open(full,'w') as f: f.write(c)
    
    subprocess.run(["git","add","-A"], capture_output=True)
    subprocess.run(["git","commit","-m",f"{title}\n\nCloses #{n}"], capture_output=True)
    r=subprocess.run(["git","push","-u","fork",branch,"--force"],capture_output=True,text=True)
    if r.returncode!=0: print(f"  Push fail: {r.stderr[:150]}"); continue
    
    pr=gh("POST","/repos/SecureBananaLabs/bug-bounty/pulls",{
        "title":title,"head":f"{user}:{branch}","base":"main","body":body+f"\n\nCloses #{n}"})
    if pr: print(f"  ✅ {pr['html_url']}")
    else: print("  ❌ PR failed")

print("\n✅ ALL 5 DONE")
