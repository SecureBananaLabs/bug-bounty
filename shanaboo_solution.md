Based on the issue description, I need to automate low-hanging fruit bug detection and issue creation. The issue asks to find a feature/bug to work on, create a GitHub issue, and include specific text. Since this is about automation, I'll create a script that scans the repository for common low-hanging fruit issues and creates GitHub issues for them.

Let me create a script that automates this process:

```diff
--- /dev/null
+++ b/scripts/auto-issue-creator.ts
@@ -0,0 +1,0 @@
+import { execSync } from 'child_process';
+import * as fs from 'fs';
+import * as path from 'path';
+
+interface LowHangingFruit {
+  type: string;
+  pattern: RegExp;
+  filePattern: string;
+  title: string;
+  description: string;
+  severity: 'low' | 'medium' | 'high';
+}
+
+const LOW_HANGING_FRUITS: LowHangingFruit[] = [
+  {
+    type: 'console.log',
+    pattern: /console\.(log|debug|info)\(/g,
+    filePattern: '**/*.{ts,tsx,js,jsx}',
+    title: 'Remove leftover console.log statements',
+    description: 'Found console.log statements that should be removed or replaced with proper logging.',
+    severity: 'low'
+  },
+  {
+    type: 'any-type',
+    pattern: /:\s*any\b/g,
+    filePattern: '**/*.{ts,tsx}',
+    title: 'Replace `any` types with proper TypeScript types',
+    description: 'Found usage of `any` type which reduces type safety. Replace with proper interfaces or types.',
+    severity: 'medium'
+  },
+  {
+    type: 'todo-comment',
+    pattern: /\/\/\s*TODO|FIXME|HACK|XXX/g,
+    filePattern: '**/*.{ts,tsx,js,jsx}',
+    title: 'Address TODO/FIXME comments in codebase',
+    description: 'Found TODO, FIXME, HACK, or XXX comments that need to be addressed.',
+    severity: 'medium'
+  },
+  {
+    type: 'hardcoded-secret',
+    pattern: /(password|secret|api[_-]?key|token)\s*[:=]\s*['"][^'"]+['"]/gi,
+    filePattern: '**/*.{ts,tsx,js,jsx,env}',
+    title: 'Remove hardcoded secrets and credentials',
+    description: 'Found potential hardcoded secrets or credentials. Move to environment variables.',
+    severity: 'high'
+  },
+  {
+    type: 'missing-error-handling',
+    pattern: /\.catch\s*\(\s*\)\s*=>\s*\{\s*\}/g,
+    filePattern: '**/*.{ts,tsx,js,jsx}',
+    title: 'Add proper error handling to empty catch blocks',
+    description: 'Found empty catch blocks that silently swallow errors. Add proper error handling.',
+    severity: 'medium'
+  },
+  {
+    type: 'unused-import',
+    pattern: /^import\s+.*\s+from\s+['"].*['"]\s*;?\s*$/gm,
+    filePattern: '**/*.{ts,tsx}',
+    title: 'Remove unused imports',
+    description: 'Potential unused imports found. Review and remove unnecessary imports.',
+    severity: 'low'
+  },
+  {
+    type: 'deprecated-method',
+    pattern: /\.substr\(/g,
+    filePattern: '**/*.{ts,tsx,js,jsx}',
+    title: 'Replace deprecated String.substr() with slice() or substring()',
+    description: 'String.substr() is deprecated. Use String.slice() or String.substring() instead.',
+    severity: 'low'
+  },
+  {
+    type: 'missing-semicolon',
+    pattern: /[^;\s]\n/g,
+    filePattern: '**/*.{ts,tsx,js,jsx}',
+    title: 'Add missing semicolons for consistency',
+    description: 'Found potential missing semicolons. Add for code consistency.',
+    severity: 'low'
+  }
+];
+
+function scanForIssues(): Map<string, { file: string; line: number; content: string; issue: LowHangingFruit }[]> {
+  const findings = new Map<string, { file: string; line: number; content: string; issue: LowHangingFruit }[]>();
+  
+  for (const fruit of LOW_HANGING_FRUITS) {
+    try {
+      const result = execSync(
+        `grep -rn --include="${fruit.filePattern.replace('**/', '')}" -E "${fruit.pattern.source}" . 2>/dev/null || true`,
+        { encoding: 'utf-8' }
+      );
+      
+      if (result.trim()) {
+        const lines = result.trim().split('\n');
+        for (const line of lines) {
+          const match = line.match(/^\.\/(.+?):(\d+):(.+)$/);
+          if (match) {
+            const [, file, lineNum, content] = match;
+            if (!findings.has(fruit.type)) {
+              findings.set(fruit.type, []);
+            }
+            findings.get(fruit.type)!.push({
+              file,
+              line: parseInt(lineNum),
+              content: content.trim(),
+              issue: fruit
+            });
+          }
+        }
+      }
+    } catch (error) {
+      // grep returns exit code 1 when no matches found
+      continue;
+    }
+  }
+  
+  return findings;
+}
+
+function generateIssueBody(fruit: LowHangingFruit, occurrences: { file: string; line: number; content: string }[]): string {
+  const limitedSamples = occurrences.slice(0, 5);
+  
+  return `## Description
+${fruit.description}
+
+## Severity
+${fruit.severity.toUpperCase()}
+
+## Found In
+${limitedSamples.map(o => `- \`${o.file}:${o.line}\` - \`${o.content}\``).join('\n')}
+${occurrences.length > 5 ? `\n*...and ${occurrences.length - 5} more occurrences*` : ''}
+
+## Acceptance Criteria
+- [ ] All instances have been addressed