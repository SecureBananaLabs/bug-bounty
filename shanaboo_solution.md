 ```diff
--- a/.github/workflows/low-hanging-fruit.yml
+++ b/.github/workflows/low-hanging-fruit.yml
@@ -0,0 +1,45 @@
+name: Low Hanging Fruit Automation
+
+on:
+  schedule:
+    - cron: '0 0 * * *'
+  workflow_dispatch:
+
+permissions:
+  issues: write
+  contents: read
+
+jobs:
+  create-issues:
+    runs-on: ubuntu-latest
+    steps:
+      - name: Checkout repository
+        uses: actions/checkout@v4
+
+      - name: Find and create low hanging fruit issues
+        uses: actions/github-script@v7
+        with:
+          script: |
+            const { data: issues } = await github.rest.issues.listForRepo({
+              owner: context.repo.owner,
+              repo: context.repo.repo,
+              state: 'open',
+              per_page: 100
+            });
+            
+            const existingTitles = new Set(issues.map(i => i.title));
+            
+            const lowHangingFruits = [
+              'Add input validation for job creation API endpoint',
+              'Add rate limiting to authentication routes',
+              'Add missing database indexes for frequent queries',
+              'Implement proper error handling in payment service',
+              'Add unit tests for proposal controller',
+              'Fix potential SQL injection in search functionality',
+              'Add request size limits to file upload endpoint',
+              'Implement proper CORS configuration',
+              