 ```diff
--- /dev/null
+++ b/.github/workflows/low-hanging-fruit.yml
@@ -0,0 +1,45 @@
+name: Low Hanging Fruit Automation
+
+on:
+  schedule:
+    - cron: '0 0 * * 0'
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
+      - name: Run low hanging fruit detector
+        env:
+          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
+        run: node .github/scripts/detect-low-hanging-fruit.js
+
+      - name: Create issues from detected items
+        env:
+          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
+        run: node .github/scripts/create-issues.js
+
+      - name: Recurse if new issues found
+        env:
+          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
+        run: |
+          ISSUE_COUNT=$(cat .github/scripts/issue-count.txt 2>/dev/null || echo "0")
+          if [ "$ISSUE_COUNT" -gt 0 ]; then
+            echo "New issues created: $ISSUE_COUNT. Triggering recursive run..."
+            gh workflow run low-hanging-fruit.yml
+          fi
+--- /dev/null
+++ b/.github/scripts/detect-low-hanging-fruit.js
@@ -0,0 +1,218 @@
+const fs = require('fs');
+const path = require('path');
+const { execSync } = require('child_process');
+
+const REPO_ROOT = process.cwd();
+const ISSUES_FILE = path.join(REPO_ROOT, '.github', 'scripts', 'detected-issues.json');
+const COUNT_FILE = path.join(REPO_ROOT, '.github', 'scripts', 'issue-count.txt');
+
+const LOW_HANGING_PATTERNS = [
+  {
+    type: 'TODO/FIXME comment',
+    pattern: /(?:TODO|FIXME|XXX|HACK|BUG|OPTIMIZE|REFACTOR)[\s:]*(.+)/i,
+    extensions: ['.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.go', '.rs', '.md'],
+    severity: 'low',
+    description: 'Code contains unresolved TODO/FIXME comments that should be addressed.'
+  },
+  {
+    type: 'Missing error handling',
+    pattern: /catch\s*\([^)]*\)\s*\{\s*(?:\/\/.*)?\s*\}/,
+    extensions: ['.ts', '.tsx', '.js', '.jsx'],
+    severity: 'medium',
+    description: 'Empty catch blocks found that may swallow errors silently.'
+  },
+  {
+    type: 'Hardcoded credentials',
+    pattern: /(?:password|secret|key|token)\s*[:=]\s*["'][^"']+["']/i,
+    extensions: ['.ts', '.tsx', '.js', '.jsx', '.py', '.env.example'],
+    severity: 'high',
+    description: 'Potential hardcoded credentials or secrets in source code.'
+  },
+  {
+    type: 'Console.log statements',
+    pattern: /console\.(log|warn|error|debug)\s*\(/,
+    extensions: ['.ts', '.tsx', '.js', '.jsx'],
+    severity: 'low',
+    description: 'Debug console statements should be removed or replaced with proper logging.'
+  },
+  {
+    type: 'Missing input validation',
+    pattern: /app\.(get|post|put|delete|patch)\s*\([^,]+,\s*async?\s*\([^)]*\)\s*=>/,
+    extensions: ['.ts', '.js'],
+    severity: 'medium',
+    description: 'API routes may be Sho missing input validation middleware.'
+  },
+  {
+    type: 'Unused imports/variables',
+    pattern: /^(?:import|const|let|var)\s+\w+\s*(?:=|from)/m,
+    extensions: ['.ts', '.tsx', '.js', '.jsx'],
+    severity: 'low',
+    description: 'Potential unused imports or variables (requires manual verification).'
+  },
+  {
+    type: 'Insecure HTTP links',
+    pattern: /http:\/\//,
+    extensions: ['.ts', '.tsx', '.js', '.jsx', '.md', '.html', '.css'],
+    severity: 'medium',
+    description: 'Insecure HTTP links found; should use HTTPS where possible.'
+  },
+  {
+    type: 'Deprecated API usage',
+    pattern: /(?:deprecated|DEPRECATED|@deprecated)/i,
+    extensions: ['.ts', '.tsx', '.js', '.jsx', '.py', '.java'],
+    severity: 'low',
+    description: 'Usage of deprecated APIs or methods detected.'
+  }
+];
+
+function findFiles(dir, extensions, excludeDirs = ['node_modules', '.git', 'dist', 'build', '.next']) {
+  const files = [];
+  
+  function traverse(currentDir) {
+    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
+    
+    for (const entry of entries) {
+      const fullPath = path.join(currentDir, entry.name);
+      
+      if (entry.isDirectory()) {
+        if (!excludeDirs.includes(entry.name)) {
+          traverse(fullPath);
+        }
+      } else if (entry.isFile()) {
+        const ext = path.extname(entry.name);
+        if (extensions.includes(ext)) {
+          files.push(fullPath);
+        }
+      }
+    }
+  }
+  
+  traverse(dir);
+  return files;
+}
+
+function scanFile(filePath, patterns) {
+  const content = fs.readFileSync(filePath, 'utf-8');
+  const lines = content.split('\n');
+  const findings = [];
+  
+  for (const pattern of patterns) {
+    for (let i = 0; i < lines.length; i++) {
+      const line = lines[i];
+      if (pattern.pattern.test(line)) {
+        findings.push({
+          type: pattern.type,
+          severity: pattern.severity,
+          description: pattern.description,
+          file: path.relative(REPO_ROOT, filePath),
+          line: i + 1,
+         