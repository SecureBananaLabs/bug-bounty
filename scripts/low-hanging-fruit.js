#!/usr/bin/env node

/**
 * Low Hanging Fruit Automation Script
 * 
 * Recursively scans the repository for TODO/FIXME comments,
 * common bug patterns, and creates GitHub issues automatically.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Patterns to search for low hanging fruit
const PATTERNS = [
  { regex: /TODO[:\s]/i, label: 'TODO', severity: 'low' },
  { regex: /FIXME[:\s]/i, label: 'FIXME', severity: 'medium' },
  { regex: /HACK[:\s]/i, label: 'HACK', severity: 'medium' },
  { regex: /BUG[:\s]/i, label: 'BUG', severity: 'high' },
  { regex: /console\.log\(/, label: 'debug-statement', severity: 'low' },
  { regex: /debugger;/, label: 'debug-statement', severity: 'low' },
  { regex: /\/\/\s*INSECURE/i, label: 'security', severity: 'high' },
  { regex: /\/\/\s*DEPRECATED/i, label: 'deprecated', severity: 'low' },
];

const EXCLUDED_DIRS = ['node_modules', '.git', 'dist', 'build', '.next', 'coverage'];

function scanDirectory(dir, results = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      if (!EXCLUDED_DIRS.includes(entry.name)) {
        scanDirectory(fullPath, results);
      }
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (['.js', '.ts', '.tsx', '.jsx', '.py', '.md', '.prisma', '.json'].includes(ext)) {
        scanFile(fullPath, results);
      }
    }
  }
  
  return results;
}

function scanFile(filePath, results) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    PATTERNS.forEach(pattern => {
      if (pattern.regex.test(line)) {
        results.push({
          file: filePath,
          line: index + 1,
          type: pattern.label,
          severity: pattern.severity,
          content: line.trim()
        });
      }
    });
  });
}

function generateIssueMarkdown(finding) {
  return `This issue is limited only to the creator of this issue. This means that only the issue author can attempt to solve this issue. If you would like to work on it, please create another issue with the same contents and refer to issue #743 for more information.

## Finding Details
- **File:** \`${finding.file}\`
- **Line:** ${finding.line}
- **Type:** ${finding.type}
- **Severity:** ${finding.severity}

## Code
\`\`\`
${finding.content}
\`\`\`

## Task
Please address this ${finding.type} item. Ensure you test your changes before submitting a pull request.

---
*This issue was automatically created by the Low Hanging Fruit automation.*`;
}

module.exports = { scanDirectory, scanFile, generateIssueMarkdown };

if (require.main === module) {
  const rootDir = path.resolve(__dirname, '..');
  const findings = scanDirectory(rootDir);
  
  console.log(JSON.stringify(findings, null, 2));
}