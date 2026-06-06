 ```diff
--- a/.github/workflows/low-hanging-fruit.yml
+++ b/.github/workflows/low-hanging-fruit.yml
@@ -0,0 +1,1 @@
+name: Low Hanging Fruit Automation
+
+on:
+  schedule:
+    # Run daily at 00:00 UTC
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
+      - name: Install dependencies
+        run: npm install
+
+      - name: Run low hanging fruit detection
+        id: detect
+        run: |
+          node -e "
+            const fs = require('fs');
+            const path = require('path');
+            
+            const findings = [];
+            
+            // Check for missing .env.example
+            if (!fs.existsSync('.env.example') && !fs.existsSync('.env.template')) {
+              findings.push({
+                title: 'Missing .env.example file for environment configuration',
+                body: 'The repository lacks a .env.example or .env.template file to help developers configure their local environment. This is a common source of onboarding friction.\n\nThis issue is limited only to the creator of this issue. This means that only the issue author can attempt to solve this issue. If you would like to work on it, please create another issue with the same contents and refer to issue #743 for more information.',
+                labels: ['bug', 'good first issue', 'documentation']
+              });
+            }
+            
+            // Check for missing CONTRIBUTING.md details
+            const contributing = fs.existsSync('CONTRIBUTING.md') ? fs.readFileSync('CONTRIBUTING.md', 'utf8') : '';
+            if (!contributing.includes('issue') || contributing.length < 200) {
+              findings.push({
+                title: 'CONTRIBUTING.md needs improvement for issue creation workflow',
+                body: 'The CONTRIBUTING.md file is missing detailed instructions about creating issues before pull requests. This leads to PRs being rejected.\n\nThis issue is limited only to the creator of this issue. This means that only the issue author can attempt to solve this issue. If you would like to work on it, please create another issue with the same contents and refer to issue #743 for more information.',
+                labels: ['documentation', 'good first issue']
+              });
+            }
+            
+            // Check for missing tests
+            const packageJson = JSON.parse(fs.readSync('package.json', 'utf8'));
+            const hasTestScript = packageJson.scripts && packageJson.scripts.test;
+            if (!hasTestScript) {
+              findings.push({
+                title: 'Missing test script in package.json',
+                body: 'The package.json does not define a test script, making it difficult to verify code quality.\n\nThis issue is limited only to the creator of this issue. This means that only the issue author can attempt to solve this issue. If you would like to work on it, please create another issue with the same contents and refer to issue #743 for more information.',
+                labels: ['bug', 'good first issue']
+              });
+            }
+            
+            // Check for missing CI/CD workflow
+            if (!fs.existsSync('.github/workflows')) {
+              findings.push({
+                title: 'Missing GitHub Actions CI/CD workflow',
+                body: 'No .github/workflows directory found. Continuous integration is essential for maintaining code quality.\n\nThis issue is limited only to the creator of this issue. This means that only the issue author can attempt to solve this issue. If you would like to work on it, please create another issue with the same contents and refer to issue #743 for more information.',
+                labels: ['bug', 'good first issue', 'enhancement']
+              });
+            }
+            
+            // Check for missing issue templates
+            if (!fs.existsSync('.github/ISSUE_TEMPLATE')) {
+              findings.push({
+                title: 'Missing GitHub issue templates',
+                body: 'No .github/ISSUE_TEMPLATE directory found. Issue templates help standardize bug reports and feature requests.\n\nThis issue is limited only to the creator of this issue. This means that only the issue author can attempt to solve this issue. If you would like to work on it, please create another issue with the same contents and refer to issue #743 for more information.',
+                labels: ['documentation', 'good first issue', 'enhancement']
+              });
+            }
+            
+            // Check for missing LICENSE
+            if (!fs.existsSync('LICENSE') && !fs.existsSync('LICENSE.md')) {
+              findings.push({
+                title: 'Missing LICENSE file',
+                body: 'The repository lacks a LICENSE file. This is important for open source contributions.\n\nThis issue is limited only to the creator of this issue. This means that only the issue author can attempt to solve this issue. If you would like to work on it, please create another issue with the same contents and refer to issue #743 for more information.',
+                labels: ['documentation', 'good first issue']
+              });
+            }
+            
+            // Check for missing CODE_OF_CONDUCT.md
+            if (!fs.existsSync('CODE_OF_CONDUCT.md')) {
+              findings.push({
+                title: 'Missing CODE_OF_CONDUCT.md',
+                body: 'The repository lacks a CODE_OF_CONDUCT.md file. This is important for maintaining a healthy community.\n\nThis issue is limited only to the creator of this issue. This means that only the issue author can attempt to solve this issue. If you would like to work on it, please create another issue with the same contents and refer to issue #743 for more information.',
+                labels: ['documentation', 'good first issue']
+              });
+            }
+            
+            // Check for missing .editorconfig
+            if (!fs.existsSync('.editorconfig')) {
+              findings.push({
+                title: 'Missing .editorconfig file',
+                body: 'The repository lacks an .editorconfig file. This helps maintain consistent coding styles across different editors.\n\nThis issue is limited only to the creator of this issue. This means that only the issue author can attempt to solve this issue. If you would like to work on it, please create another issue with the same contents and refer to issue #743 for more information.',
+                labels: ['good first issue', 'enhancement']
+              });
+            }
+            
+            // Check for missing .prettierrc or formatting config
+            if (!fs.existsSync('.prettierrc') && !fs.existsSync('.pretti