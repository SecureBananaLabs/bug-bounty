import os
import re
import json
from typing import List, Dict

class SecurityAuditor:
    def __init__(self, root_dir: str):
        self.root_dir = root_dir
        self.issues = []

    def log_issue(self, file: str, line: int, severity: str, description: str):
        self.issues.append({
            "file": file,
            "line": line,
            "severity": severity,
            "description": description
        })

    def audit_routes(self):
        routes_dir = os.path.join(self.root_dir, "apps/api/src/routes")
        if not os.path.exists(routes_dir):
            return

        for filename in os.listdir(routes_dir):
            if filename.endswith(".js"):
                path = os.path.join(routes_dir, filename)
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    # Check if route is protected by auth middleware
                    if "auth" not in content.lower() and "router.get" in content:
                        self.log_issue(path, 0, "Medium", f"Route in {filename} might be missing authentication middleware")

    def audit_controllers(self):
        controllers_dir = os.path.join(self.root_dir, "apps/api/src/controllers")
        if not os.path.exists(controllers_dir):
            return

        for filename in os.listdir(controllers_dir):
            if filename.endswith(".js"):
                path = os.path.join(controllers_dir, filename)
                with open(path, 'r', encoding='utf-8') as f:
                    lines = f.readlines()
                    for i, line in enumerate(lines, 1):
                        # Look for direct use of req.body without validation
                        if "req.body" in line and "validate" not in line.lower() and "validator" not in line.lower():
                            self.log_issue(path, i, "High", "Direct use of req.body without visible validation")
                        
                        # Look for dangerous functions
                        if "eval(" in line or "child_process.exec(" in line:
                            self.log_issue(path, i, "Critical", "Use of potentially dangerous execution functions (eval/exec)")

    def audit_middleware(self):
        middleware_dir = os.path.join(self.root_dir, "apps/api/src/middleware")
        if not os.path.exists(middleware_dir):
            return

        # Check if rateLimit.js exists
        if not os.path.exists(os.path.join(middleware_dir, "rateLimit.js")):
            self.log_issue(middleware_dir, 0, "Medium", "Global rate limiting middleware is missing")

    def run(self):
        print(f"🔍 Starting Security Audit in {self.root_dir}...")
        self.audit_routes()
        self.audit_controllers()
        self.audit_middleware()
        
        report = "## 🍌 Security Audit Report - Low Hanging Fruit\n\n"
        if not self.issues:
            report += "✅ No obvious low-hanging fruit vulnerabilities found!"
        else:
            report += f"Found {len(self.issues)} potential issues:\n\n"
            for issue in self.issues:
                report += f"- **[{issue['severity']}]** {issue['file']} (Line {issue['line']}): {issue['description']}\n"
        
        with open(os.path.join(self.root_dir, "security-report.md"), "w", encoding="utf-8") as f:
            f.write(report)
        
        print(f"✅ Audit complete. Report written to security-report.md. Found {len(self.issues)} issues.")

if __name__ == "__main__":
    import sys
    root = sys.argv[1] if len(sys.argv) > 1 else "."
    auditor = SecurityAuditor(root)
    auditor.run()
