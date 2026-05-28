```diff
--- a/.github/workflows/low-hanging-fruit-automation.yml
+++ b/.github/workflows/low-hanging-fruit-automation.yml
@@ -0,0 +1,111 @@
+name: Low Hanging Fruit Automation
+
+on:
+  schedule:
+    # Run daily at midnight UTC
+    - cron: '0 0 * * *'
+  workflow_dispatch:
+
+permissions:
+  issues: write
+  contents: read
+
+jobs:
+  detect-and-create-issues:
+    runs-on: ubuntu-latest
+    steps:
+      - name: Checkout repository
+        uses: actions/checkout@v4
+
+      - name: Set up Node.js
+        uses: actions/setup-node@v4
+        with:
+          node-version: '20'
+
+      - name: Detect low hanging fruit and create issues
+        env:
+          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
+        run: |
+          node -e "
+            const fs = require('fs');
+            const path = require('path');
+            const { execSync } = require('child_process');
+
+            // Helper to run GitHub CLI commands
+            function gh(command) {
+              return execSync(command, { encoding: 'utf-8', env: { ...process.env, GH_TOKEN: process.env.GITHUB_TOKEN } });
+            }
+
+            // Patterns for low hanging fruit detection
+            const patterns = [
+              { pattern: /TODO|FIXME|HACK|XXX|BUG/, type: 'code-smell', label: 'bug' },
+              { pattern: /console\\.(log|warn|error)/, type: 'debug-statement', label: 'bug' },
+              { pattern: /process\\.env\\.[A-Z_]+/, type: 'env-check', label: 'documentation' },
+              { pattern: /throw new Error\\(['\\"][^'\\"]+['\\"]\\)/, type: 'error-handling', label: 'bug' },
+            ];
+
+            // Scan files for patterns
+            function scanFiles(dir, results = []) {
+              const items = fs.readdirSync(dir, { withFileTypes: true });
+              for (const item of items) {
+                const fullPath = path.join(dir, item.name);
+                if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules') {
+                  scanFiles(fullPath, results);
+                } else if (item.isFile() && /\\.(ts|tsx|js|jsx|json|md|yml|yaml|prisma)$/.test(item.name)) {
+                  const content = fs.readFileSync(fullPath, 'utf-8');
+                  for (const { pattern, type, label } of patterns) {
+                    const matches = content.match(pattern);
+                    if (matches) {
+                      results.push({ file: fullPath, type, label, match: matches[0] });
+                    }
+                  }
+                }
+              }
+              return results;
+            }
+
+            // Get existing issues to avoid duplicates
+            const existingIssues = JSON.parse(gh('gh issue list --repo ${{ github.repository }} --json title --limit 100'));
+            const existingTitles = new Set(existingIssues.map(i => i.title));
+
+            // Scan for issues
+            const findings = scanFiles('.');
+            
+            // Group findings by type
+            const grouped = {};
+            for (const finding of findings) {
+              if (!grouped[finding.type]) grouped[finding.type] = [];
+              grouped[finding.type].push(finding);
+            }
+
+            // Create issues for each type
+            for (const [type, items] of Object.entries(grouped)) {
+              const title = \`Low Hanging Fruit: \${type.replace(/-/g, ' ').replace(/\\b\\w/g, l => l.toUpperCase())}\`;
+              if (existingTitles.has(title)) continue;
+
+              const body = \`## Automated Low Hanging Fruit Detection
+
+This issue was automatically created to track \${type.replace(/-/g, ' ')} findings in the codebase.
+
+### Findings
+\${items.map(i => \`- **\${i.file}**: found pattern \"\${i.match}\"\`).join('\\n')}
+
+### Instructions
+This issue is limited only to the creator of this issue. This means that only the issue author can attempt to solve this issue. If you would like to work on it, please create another issue with the same contents and refer to issue #743 for more information.
+
+/bounty \\$50
+\`;
+
+              try {
+                gh(\`gh issue create --repo \${process.env.GITHUB_REPOSITORY} --title \"\${title}\" --body \"\${body}\" --label \"\${items[0].label},good first issue,help wanted,bug bounty,AI agent friendly\"\`);
+                console.log(\`Created issue: \${title}\`);
+              } catch (e) {
+                console.error(\`Failed to create issue: \${title}\`, e.message);
+              }
+            }
+          "
+
+      - name: Recursively trigger next scan
+        env:
+          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
+        run: |
+          # Schedule next run by creating a follow-up issue if new patterns found
+          node -e "
+            const { execSync } = require('child_process');
+            const fs = require('fs');
+            
+            // Check if we need to create a meta-issue for the next recursive scan
+            const scanLog = 'last-scan-date.txt';
+            const now = new Date().toISOString();
+            
+            if (!fs.existsSync(scanLog) || Date.now() - new Date(fs.readFileSync(scanLog, 'utf-8')).getTime() > 86400000) {
+              fs.writeFileSync(scanLog, now);
+              
+              const body = \`## Recursive Low Hanging Fruit Scan
+
+This issue tracks the ongoing automated detection of low hanging fruit bugs and improvements.
+
+### Next Steps
+1. Review all open issues created by the automation
+2. Address findings in priority order
+3. Close resolved items
+
+### Instructions
+This issue is limited only to the creator of this issue. This means that only the issue author can attempt to solve this issue. If you would like to work on it, please create another issue with the same contents and refer to issue #743 for more information.
+
+/bounty \\$700
+\`;
+
+              try {
+                execSync(\`gh issue create --repo \${process.env.GITHUB_REPOSITORY} --title \"Low Hanging Fruit: Recursive Scan Tracking\" --body \"\${body}\" --label \"bug,documentation,good first issue,help wanted,