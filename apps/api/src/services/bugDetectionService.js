const fs = require('fs');
const path = require('path');

class BugDetectionService {
  constructor() {
    this.issues = [];
    this.checkPaths = [
      'apps/api/src/controllers',
      'apps/api/src/services',
      'apps/web/components',
      'apps/web/app'
    ];
  }

  async scanForIssues() {
    for (const checkPath of this.checkPaths) {
      await this.scanDirectory(checkPath);
    }
    return this.issues;
  }

  async scanDirectory(dir) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        await this.scanDirectory(filePath);
      } else if (file.endsWith('.js') || file.endsWith('.ts') || file.endsWith('.tsx')) {
        await this.analyzeFile(filePath);
      }
    }
  }

  async analyzeFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    // Check for potential issues
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check for console.log in production code
      if (line.includes('console.log') && !line.includes('// TODO: Remove')) {
        this.issues.push({
          type: 'Potential Issue',
          file: filePath,
          line: i + 1,
          description: `Found console.log in production code: ${line.trim()}`,
          severity: 'low',
          suggestion: 'Remove console.log statements from production code'
        });
      }
      
      // Check for hardcoded secrets
      if (line.includes('process.env.') && 
          (line.includes('password') || line.includes('secret') || line.includes('key'))) {
        this.issues.push({
          type: 'Security Risk',
          file: filePath,
          line: i + 1,
          description: `Potential hardcoded secret: ${line.trim()}`,
          severity: 'high',
          suggestion: 'Store secrets in environment variables properly'
        });
      }
      
      // Check for TODO comments
      if (line.includes('TODO:') || line.includes('FIXME:')) {
        this.issues.push({
          type: 'Technical Debt',
          file: filePath,
          line: i + 1,
          description: `Found TODO/FIXME comment: ${line.trim()}`,
          severity: 'medium',
          suggestion: 'Address technical debt items'
        });
      }
      
      // Check for error handling
      if (line.includes('try {') && !this.hasCatchBlock(lines, i)) {
        this.issues.push({
          type: 'Error Handling',
          file: filePath,
          line: i + 1,
          description: 'Try block without catch or finally',
          severity: 'medium',
          suggestion: 'Add proper error handling'
        });
      }
    }
  }

  hasCatchBlock(lines, startIndex) {
    for (let i = startIndex + 1; i < lines.length; i++) {
      if (lines[i].includes('catch {') || lines[i].includes('finally {')) {
        return true;
      }
      if (lines[i].trim() === '' || lines[i].startsWith('//') || lines[i].startsWith('*')) {
        continue;
      }
      break;
    }
    return false;
  }

  generateIssueReport() {
    let report = '## Bug Detection Report\n\n';
    report += `Found ${this.issues.length} potential issues:\n\n`;
    
    const issuesBySeverity = {
      high: [],
      medium: [],
      low: []
    };
    
    this.issues.forEach(issue => {
      issuesBySeverity[issue.severity].push(issue);
    });
    
    ['high', 'medium', 'low'].forEach(severity => {
      if (issuesBySeverity[severity].length > 0) {
        report += `### ${severity.toUpperCase()} Severity Issues\n\n`;
        issuesBySeverity[severity].forEach(issue => {
          report += `- **${issue.type}** in ${issue.file}:${issue.line}\n`;
          report += `  - Description: ${issue.description}\n`;
          report += `  - Suggestion: ${issue.suggestion}\n\n`;
        });
      }
    });
    
    return report;
  }
}

module.exports = BugDetectionService;