#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const RULES = [
  {
    id: 'MISSING_AUTH',
    severity: 'CRITICAL',
    detect(filePath, content) {
      const sep = path.sep;
      const isRoute = filePath.includes(sep + 'routes' + sep) && filePath.endsWith('.js');
      if (!isRoute) return null;
      if (filePath.includes('authRoutes')) return null;
      const hasAuth = content.includes('authMiddleware');
      if (!hasAuth) {
        const eps = [...content.matchAll(/\.(get|post|put|delete|patch)\(['"]([^'"]+)['"]/g)].map(m => m[1].toUpperCase() + ' ' + m[2]);
        return { file: path.relative(ROOT, filePath), endpoints: eps.length ? eps : ['unknown'] };
      }
      return null;
    }
  },
  {
    id: 'HARDCODED_SECRET',
    severity: 'HIGH',
    detect(filePath, content) {
      if (content.includes('development-secret'))
        return { file: path.relative(ROOT, filePath), detail: 'Hardcoded default secret/credential found' };
      return null;
    }
  },
  {
    id: 'NO_FILE_SIZE_LIMIT',
    severity: 'MEDIUM',
    detect(filePath, content) {
      if (content.includes('multer(') && !content.includes('limits') && !content.includes('fileSize'))
        return { file: path.relative(ROOT, filePath), detail: 'multer configured without file size limits (DoS risk)' };
      return null;
    }
  },
  {
    id: 'INSECURE_REFRESH',
    severity: 'HIGH',
    detect(filePath, content) {
      if (filePath.includes('authService') && content.includes('refreshToken') && !content.includes('verify'))
        return { file: path.relative(ROOT, filePath), detail: 'refreshToken issues new JWT without verifying old token' };
      return null;
    }
  },
  {
    id: 'ADMIN_REGISTRATION',
    severity: 'CRITICAL',
    detect(filePath, content) {
      if (filePath.includes('authService') && content.includes('payload.role'))
        return { file: path.relative(ROOT, filePath), detail: 'Registration accepts role from user input (potential privilege escalation)' };
      return null;
    }
  },
  {
    id: 'TODO_IN_CODE',
    severity: 'LOW',
    detect(filePath, content) {
      const todos = content.match(/\/\/\s*TODO:?\s*(.+)/gi);
      return todos ? { file: path.relative(ROOT, filePath), todos: todos.map(t => t.replace('//','').trim()) } : null;
    }
  }
];

function scanFiles(dir) {
  const findings = [];
  function walk(d) {
    for (const e of fs.readdirSync(d, {withFileTypes: true})) {
      const full = path.join(d, e.name);
      if (e.name === 'node_modules' || e.name === '.git') continue;
      if (e.isDirectory()) walk(full);
      else if (e.name.endsWith('.js') || e.name.endsWith('.ts')) {
        const content = fs.readFileSync(full, 'utf8');
        for (const rule of RULES) {
          const r = rule.detect(full, content);
          if (r) findings.push({ ruleId: rule.id, severity: rule.severity, ...r });
        }
      }
    }
  }
  walk(dir);
  return findings;
}

function main() {
  console.log('=== FreelanceFlow Auto Bug Detector (Bounty #11398) ===');
  console.log('');
  const findings = scanFiles(ROOT);
  const bySev = {};
  for (const f of findings) { if (!bySev[f.severity]) bySev[f.severity] = []; bySev[f.severity].push(f); }
  for (const sev of ['CRITICAL','HIGH','MEDIUM','LOW']) {
    const items = bySev[sev] || [];
    if (!items.length) continue;
    console.log('## ' + sev + ' (' + items.length + ' findings)');
    for (const f of items) {
      console.log('');
      console.log('[' + f.ruleId + '] ' + f.file);
      if (f.endpoints) console.log('  Endpoints: ' + f.endpoints.join(', '));
      if (f.detail) console.log('  Detail: ' + f.detail);
      if (f.todos) console.log('  TODOs: ' + f.todos.join('; '));
    }
  }
  console.log('');
  console.log('=== TOTAL: ' + findings.length + ' findings ===');
  fs.writeFileSync(path.join(ROOT, 'bug-scan-report.json'), JSON.stringify({timestamp: new Date().toISOString(), totalFindings: findings.length, findings}, null, 2));
}
main();
