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
+        run: npm ci
+
+      - name: Run low hanging fruit detection
+        run: node .github/scripts/detect-low-hanging-fruit.js
+        env:
+          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
+          GITHUB_REPOSITORY: ${{ github.repository }}
+--- /dev/null
+++ b/.github/scripts/detect-low-hanging-fruit.js
@@ -0,0 +1,218 @@
+const fs = require('fs');
+const path = require('path');
+const { execSync } = require('child_process');
+
+const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
+const GITHUB_REPOSITORY = process.env.GITHUB_REPOSITORY || 'SecureBananaLabs/bug-bounty';
+const [OWNER, REPO] = GITHUB_REPOSITORY.split('/');
+
+const RESTRICTED_STRING = 'This issue is limited only to the creator of this issue. This means that only the issue author can attempt to solve this issue. If you would like to work on it, please create another issue with the same contents and refer to issue #743 for more information.';
+
+function exec(cmd) {
+  return execSync(cmd, { encoding: 'utf-8', cwd: process.cwd() }).trim();
+}
+
+function graphql(query, variables = {}) {
+  const response = exec(`curl -s -X POST \
+    -H "Authorization: bearer ${GITHUB_TOKEN}" \
+    -H "Content-Type: application/json" \
+    -d '${JSON.stringify({ query, variables })}' \
+    https://api.github.com/graphql`);
+  return JSON.parse(response);
+}
+
+function rest(method, endpoint, body) {
+  const url = `https://api.github.com/repos/${OWNER}/${REPO}${endpoint}`;
+  const cmd = `curl -s -X ${method} \
+    -H "Authorization: Bearer ${GITHUB_TOKEN}" \
+    -H "Accept: application/vnd.github.v3+json" \
+    -H "Content-Type: application/json" \
+    -d '${JSON.stringify(body)}' \
+    "${url}"`;
+  const response = exec(cmd);
+  return JSON.parse(response);
+}
+
+function getExistingIssues() {
+  const query = `
+    query($owner: String!, $repo: String!) {
+      repository(owner: $owner, name: $repo) {
+        issues(first: 100, states: [OPEN, CLOSED], orderBy: {field: CREATED_AT, direction: DESC}) {
+          nodes {
+            number
+            title
+            body
+            state
+            createdAt
+          }
+        }
+      }
+    }
+  `;
+  const result = graphql(query, { owner: OWNER, repo: REPO });
+  return result.data?.repository?.issues?.nodes || [];
+}
+
+function issueExists(title, existingIssues) {
+  return existingIssues.some(issue => 
+    issue.title.toLowerCase().includes(title.toLowerCase()) ||
+    title.toLowerCase().includes(issue.title.toLowerCase())
+  );
+}
+
+function createIssue(title, body) {
+  return rest('POST', '/issues', {
+    title,
+    body: `${body}\n\n${RESTRICTED_STRING}`,
+    labels: ['bug', 'good first issue', 'help wanted', 'bug bounty', 'AI agent friendly', 'bounty', '💎 Bounty']
+  });
+}
+
+function scanForLowHangingFruit() {
+  const findings = [];
+  
+  // Check for common low hanging fruit patterns
+  const checks = [
+    {
+      name: 'Missing Input Validation',
+      pattern: /req\.body|req\.query|req\.params/,
+      check: (content, filePath) => {
+        if (!content.includes('zod') && !content.includes('joi') && !content.includes('validator')) {
+          return `File ${filePath} appears to handle user input without explicit validation. Consider adding Zod or similar validation.`;
+        }
+        return null;
+      }
+    },
+    {
+      name: 'Missing Error Handling',
+      pattern: /async function|\.then\(/,
+      check: (content, filePath) => {
+        const lines = content.split('\n');
+        const asyncLines = lines.filter(l => l.includes('await ') && !l.includes('try') && !l.includes('catch'));
+        if (asyncLines.length > 5 && !content.includes('try {') && !content.includes('catch (')) {
+          return `File ${filePath} has multiple async operations without try/catch blocks. Consider adding proper error handling.`;
+        }
+        return null;
+      }
+    },
+    {
+      name: 'Hardcoded Secrets Pattern',
+      pattern: /password|secret|key|token/i,
+      check: (content, filePath) => {
+        if (content.match(/['"]\w{16,}['"]/) && !filePath.includes('.env.example')) {
+          return `File ${filePath} may contain hardcoded secrets. Move to environment variables.`;
+        }
+        return null;
+      }
+    },
+    {
+      name: 'Missing Rate Limiting',
+      pattern: /app\.(get|post|put|delete)\(/,
+      check: (content, filePath) => {
+        if (filePath.includes('routes') && !content.includes('rateLimit') && !content.includes('rate-limit')) {
+          return `Route file ${filePath} may be missing rate limiting. Consider adding express-rate-limit.`;
+        }
+        return null;
+      }
+    },
+    {
+      name: 'SQL Injection Risk',
+      pattern: /prisma\.\$queryRaw|query\(|execute\(/,
+      check: (content, filePath) => {
+        if (content.includes('$queryRaw') && content.includes('${')) {
+          return `File ${filePath} uses template literals with $queryRaw which may be vulnerable to