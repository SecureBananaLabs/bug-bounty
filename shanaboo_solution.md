```diff
--- a/.github/workflows/low-hanging-fruit-automation.yml
+++ b/.github/workflows/low-hanging-fruit-automation.yml
@@ -0,0 +1,105 @@
+name: Low Hanging Fruit Automation
+
+on:
+  schedule:
+    # Run daily at midnight UTC
+    - cron: '0 0 * * *'
+  workflow_dispatch:
+    inputs:
+      dry_run:
+        description: 'Run in dry-run mode (no issues created)'
+        required: false
+        default: 'false'
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
+      - name: Detect low hanging fruit issues
+        id: detect
+        run: |
+          # Create a script to detect common low hanging fruit patterns
+          cat > detect-issues.js << 'EOF'
+          const fs = require('fs');
+          const path = require('path');
+
+          const issues = [];
+
+          // Check for TODO/FIXME comments in source files
+          function scanDirectory(dir, patterns) {
+            const results = [];
+            const files = fs.readdirSync(dir, { recursive: true });
+            
+            for (const file of files) {
+              const fullPath = path.join(dir, file);
+              try {
+                if (fs.statSync(fullPath).isDirectory()) continue;
+                if (!/\.(ts|tsx|js|jsx|py|java|go|rb|php)$/.test(fullPath)) continue;
+                
+                const content = fs.readFileSync(fullPath, 'utf8');
+                const lines = content.split('\n');
+                
+                lines.forEach((line, index) => {
+                  if (/TODO|FIXME|HACK|XXX|BUG/.test(line)) {
+                    results.push({
+                      file: fullPath,
+                      line: index + 1,
+                      content: line.trim()
+                    });
+                  }
+                });
+              } catch (e) {
+                // Skip files we can't read
+              }
+            }
+            return results;
+          }
+
+          // Scan for common issues
+          const todoItems = scanDirectory('.', ['TODO', 'FIXME', 'HACK', 'XXX', 'BUG']);
+          
+          // Check for missing documentation
+          const hasContributing = fs.existsSync('CONTRIBUTING.md');
+          const hasChangelog = fs.existsSync('CHANGELOG.md');
+          const hasLicense = fs.existsSync('LICENSE') || fs.existsSync('LICENSE.md');
+          
+          const findings = {
+            todoItems: todoItems.slice(0, 20), // Limit to first 20
+            missingDocs: {
+              contributing: !hasContributing,
+              changelog: !hasChangelog,
+              license: !hasLicense
+            },
+            timestamp: new Date().toISOString()
+          };
+          
+          fs.writeFileSync('findings.json', JSON.stringify(findings, null, 2));
+          EOF
+          
+          node detect-issues.js
+          
+          # Output findings
+          cat findings.json
+
+      - name: Create GitHub issues for findings
+        if: github.event.inputs.dry_run != 'true'
+        env:
+          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
+        run: |
+          cat > create-issues.js << 'EOF'
+          const fs = require('fs');
+          
+          const findings = JSON.parse(fs.readFileSync('findings.json', 'utf8'));
+          const { Octokit } = require('@octokit/rest');
+          
+          const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
+          const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/');
+          
+          const issueTemplate = (title, body) => ({
+            owner,
+            repo,
+            title,
+            body: `${body}\n\nThis issue is limited only to the creator of this issue. This means that only the issue author can attempt to solve this issue. If you would like to work on it, please create another issue with the same contents and refer to issue #743 for more information.`
+          });
+          
+          async function createIssues() {
+            const issuesToCreate = [];
+            
+            // Create issues for TODO/FIXME items
+            for (const item of findings.todoItems) {
+              const title = `Low Hanging Fruit: Address ${item.content.split(':')[0]} in ${item.file}`;
+              const body = `## Found Code Debt\n\n- **File**: \`${item.file}\`\n- **Line**: ${item.line}\n- **Content**: \`${item.content}\`\n\n### Task\nAddress this code debt item to improve code quality.`;
+              issuesToCreate.push({ title, body });
+            }
+            
+            // Create issues for missing documentation
+            if (findings.missingDocs.contributing) {
+              issuesToCreate.push({
+                title: 'Low Hanging Fruit: Add CONTRIBUTING.md guidelines',
+                body: '## Missing Documentation\n\nThe repository lacks a CONTRIBUTING.md file. Adding contribution guidelines helps new contributors understand how to participate in the project.\n\n### Task\nCreate a comprehensive CONTRIBUTING.md file with guidelines for code style, pull request process, and issue reporting.'
+              });
+            }
+            
+            if (findings.missingDocs.changelog) {
+              issuesToCreate.push({
+                title: 'Low Hanging Fruit: Add CHANGELOG.md',
+                body: '## Missing Documentation\n\nThe repository lacks a CHANGELOG.md file. Maintaining a changelog helps users track changes between versions.\n\n### Task\nCreate a CHANGELOG.md following [Keep a Changelog](https://keepachangelog.com/) format.'
+              });
+            }
+            
+            if (findings.missingDocs.license) {
+              issuesToCreate.push({
+                title: 'Low Hanging Fruit: Add LICENSE file',
+                body: '## Missing Documentation\n\nThe repository lacks a LICENSE file. Adding a license clarifies how others can use, modify, and distribute the code.\n\n### Task\nAdd an appropriate open-source license file (e.g., MIT, Apache-2.0, GPL-3.0).'
+              });
+            }
+            
+            // Create issues (with rate limiting)
+            for (const issue of issuesToCreate.slice(0, 5)) { // Limit to 5 per run to avoid spam
+              try {
+                await octokit.rest