 ```diff
--- /dev/null
+++ b/.github/workflows/low-hanging-fruit-automation.yml
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
+        id: detect
+        run: |
+          node .github/scripts/detect-low-hanging-fruit.js
+        env:
+          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
+
+  recursive-issue-creation:
+    runs-on: ubuntu-latest
+    needs: detect-and-create-issues
+    if: always()
+    steps:
+      - name: Checkout repository
+        uses: actions/checkout@v4
+
+      - name: Create recursive issues
+        run: |
+          node .github/scripts/create-recursive-issues.js
+        env:
+          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
+          REPO: ${{ github.repository }}
--- /dev/null
+++ b/.github/scripts/detect-low-hanging-fruit.js
@@ -0,0 +1,187 @@
+const fs = require('fs');
+const path = require('path');
+const { execSync } = require('child_process');
+
+const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
+const REPO = process.env.GITHUB_REPOSITORY || process.env.REPO;
+
+if (!GITHUB_TOKEN) {
+  console.error('GITHUB_TOKEN is required');
+  process.exit(1);
+}
+
+const API_BASE = 'https://api.github.com';
+
+function githubRequest(endpoint, method = 'GET', data = null) {
+  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
+  const options = {
+    method,
+    headers: {
+      'Authorization': `token ${GITHUB_TOKEN}`,
+      'Accept': 'application/vnd.github.v3+json',
+      'User-Agent': 'LowHangingFruitBot',
+      'Content-Type': 'application/json'
+    }
+  };
+
+  const cmd = `curl -s -X ${method} ${Object.entries(options.headers).map(([k, v]) => `-H "${k}: ${v}"`).join(' ')} ${data ? `-d '${JSON.stringify(data)}'` : ''} "${url}"`;
+  
+  try {
+    const result = execSync(cmd, { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
+    return JSON.parse(result);
+  } catch (e) {
+    console.error('Request failed:', e.message);
+    return null;
+  }
+}
+
+function findBugsAndImprovements() {
+  const issues = [];
+  
+  // Check for common low-hanging fruit patterns
+  const checks = [
+    {
+      type: 'documentation',
+      title: 'README.md needs installation instructions for new contributors',
+      check: () => {
+        const readme = fs.readFileSync('README.md', 'utf-8');
+        return !readme.includes('npm install') || !readme.includes('npm run dev');
+      }
+    },
+    {
+      type: 'documentation', 
+      title: 'Add CONTRIBUTING.md guidelines for issue creation',
+      check: () => {
+        try {
+          fs.accessSync('CONTRIBUTING.md');
+          const content = fs.readFileSync('CONTRIBUTING.md', 'utf-8');
+          return !content.includes('issue') || !content.includes('pull request');
+        } catch {
+          return true;
+        }
+      }
+    },
+    {
+      type: 'bug',
+      title: 'Missing .env.example files for apps',
+      check: () => {
+        const apps = ['apps/web', 'apps/api'];
+        return apps.some(app => !fs.existsSync(path.join(app, '.env.example')));
+      }
+    },
+    {
+      type: 'bug',
+      title: 'Package.json missing test script',
+      check: () => {
+        const pkg = JSON.parse(fs.readSync('package.json', 'utf-8'));
+        return !pkg.scripts || !pkg.scripts.test;
+      }
+    },
+    {
+      type: 'improvement',
+      title: 'Add GitHub issue templates for bug reports and features',
+      check: () => {
+        return !fs.existsSync('.github/ISSUE_TEMPLATE');
+      }
+    },
+    {
+      type: 'bug',
+      title: 'Missing error handling middleware in API',
+      check: () => {
+        try {
+          const apiFiles = fs.readdirSync('apps/api');
+          return !apiFiles.some(f => f.includes('error') || f.includes('middleware'));
+        } catch {
+          return false;
+        }
+      }
+    },
+    {
+      type: 'documentation',
+      title: 'Add API documentation with OpenAPI/Swagger',
+      check: () => {
+        return !fs.existsSync('apps/api/swagger') && !fs.existsSync('apps/api/openapi');
+      }
+    },
+    {
+      type: 'improvement',
+      title: 'Add pre-commit hooks for code quality',
+      check: () => {
+        return !fs.existsSync('.husky') && !fs.existsSync('.pre-commit-config.yaml');
+      }
+    }
+  ];
+
+  for (const check of checks) {
+    try {
+      if (check.check()) {
+        issues.push({
+          title: check.title,
+          type: check.type,
+          labels: [check.type, 'good first issue', 'bug bounty', 'AI agent friendly']
+        });
+      }
+    } catch (e) {
+      console.error(`Check failed for ${check.title}:`, e.message);
+    }
+  }
+
+  return issues;
+}
+
+function main() {
+  console.log('Detecting low hanging fruit...');
+  
+  const detectedIssues = findBugsAndImprovements();
+  
+  // Write detected issues to file for next step
+  fs.writeFileSync('.github/detected-issues.json', JSON.stringify(detectedIssues, null, 2));
+  
+  console.log(`Detected ${detect