#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

class SecurityScanner {
  constructor(options) {
    this.repoPath = options.repoPath || process.cwd();
    this.createIssues = options.createIssues || false;
    this.dryRun = options.dryRun || false;
    this.githubToken = options.githubToken || process.env.GITHUB_TOKEN;
    this.organization = options.organization || 'SecureBananaLabs';
    this.repository = options.repository || 'bug-bounty';
    this.findings = [];
    this.issues = [];
    this.issueTitles = new Set();
    
    // Initialize issue titles for idempotency
    this.loadExistingIssueTitles();
  }

  async loadExistingIssueTitles() {
    if (this.dryRun || !this.createIssues) return;
    
    try {
      const command = `gh issue list --repo ${this.organization}/${this.repository} --limit 1000 --json title`;
      const output = execSync(command, { encoding: 'utf8' });
      const issues = JSON.parse(output);
      issues.forEach(issue => this.issueTitles.add(issue.title));
    } catch (error) {
      console.warn('Warning: Could not load existing issue titles. Proceeding without idempotency check.');
    }
  }

  scan() {
    console.log('Starting security scan...');
    this.scanDirectory(path.join(this.repoPath, 'apps/api'));
    
    if (this.findings.length === 0) {
      console.log('No security findings detected.');
      return;
    }
    
    console.log(`\nDetected ${this.findings.length} security findings:`);
    this.findings.forEach((finding, index) => {
      console.log(`\n[${index + 1}] Severity: ${finding.severity}`);
      console.log(`   File: ${finding.file}`);
      console.log(`   Line: ${finding.line}`);
      console.log(`   Description: ${finding.description}`);
      console.log(`   Recommendation: ${finding.recommendation}`);
    });
    
    if (this.createIssues && !this.dryRun) {
      this.createGitHubIssues();
    }
  }

  scanDirectory(dirPath) {
    const files = fs.readdirSync(dirPath);
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        this.scanDirectory(filePath);
      } else if (file.endsWith('.js') || file.endsWith('.ts')) {
        this.scanFile(filePath);
      }
    }
  }

  scanFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    // Check for missing auth middleware
    this.checkMissingAuth(filePath, content, lines);
    
    // Check for weak JWT defaults
    this.checkWeakJWT(filePath, content, lines);
    
    // Check for unvalidated payment inputs
    this.checkPaymentValidation(filePath, content, lines);
    
    // Check for privilege escalation on register
    this.checkPrivilegeEscalation(filePath, content, lines);
    
    // Check for stubbed credential checks
    this.checkStubbedCredentials(filePath, content, lines);
    
    // Check for hardcoded secrets
    this.checkHardcodedSecrets(filePath, content, lines);
    
    // Check for improper error handling
    this.checkErrorHandling(filePath, content, lines);
  }

  checkMissingAuth(filePath, content, lines) {
    const routePattern = /(app\.get|app\.post|app\.put|app\.delete|router\.get|router\.post|router\.put|router\.delete)\(['"`](\/[^'"`]+)['"`]/g;
    const authPattern = /auth\.middleware|requireAuth/g;
    
    let match;
    while ((match = routePattern.exec(content)) !== null) {
      const route = match[0];
      const lineIndex = content.substring(0, match.index).split('\n').length - 1;
      
      // Check if auth middleware is applied within the next few lines
      const nextLines = lines.slice(lineIndex, lineIndex + 5).join('\n');
      if (!authPattern.test(nextLines)) {
        this.addFinding({
          type: 'missing-auth',
          severity: 'high',
          file: filePath,
          line: lineIndex + 1,
          description: `Route ${route} appears to be missing authentication middleware`,
          recommendation: 'Add authentication middleware to protect this route'
        });
      }
    }
  }

  checkWeakJWT(filePath, content, lines) {
    const jwtPattern = /jwt\.sign\(|jwt\.decode\(/g;
    const weakDefaultsPattern = /expiresIn\s*:\s*['"`]1[hdwmy]['"`]|algorithm\s*:\s*['"`]none['"`]/g;
    
    if (jwtPattern.test(content) && weakDefaultsPattern.test(content)) {
      const lineIndex = content.search(weakDefaultsPattern);
      const lineNumber = content.substring(0, lineIndex).split('\n').length;
      
      this.addFinding({
        type: 'weak-jwt',
        severity: 'critical',
        file: filePath,
        line: lineNumber,
        description: 'JWT implementation uses weak defaults (e.g., long expiration or no algorithm)',
        recommendation: 'Use strong JWT settings with appropriate expiration time and secure algorithm'
      });
    }
  }

  checkPaymentValidation(filePath, content, lines) {
    const paymentPattern = /payment|amount|price|charge|transaction/gi;
    const validationPattern = /validation|validate|schema\.parse|joi|express-validator/g;
    
    if (paymentPattern.test(content) && !validationPattern.test(content)) {
      const lineIndex = content.search(paymentPattern);
      const lineNumber = content.substring(0, lineIndex).split('\n').length;
      
      this.addFinding({
        type: 'payment-validation',
        severity: 'high',
        file: filePath,
        line: lineNumber,
        description: 'Payment-related code may lack proper input validation',
        recommendation: 'Implement strict validation for payment inputs using a library like Joi or express-validator'
      });
    }
  }

  checkPrivilegeEscalation(filePath, content, lines) {
    const registerPattern = /register|signup|createUser/gi;
    const rolePattern = /role|privilege|admin|superuser/gi;
    const assignmentPattern = /role\s*=\s*['"`]admin['"`]|role\s*:\s*['"`]admin['"`]/gi;
    
    if (registerPattern.test(content) && rolePattern.test(content) && assignmentPattern.test(content)) {
      const lineIndex = content.search(assignmentPattern);
      const lineNumber = content.substring(0, lineIndex).split('\n').length;
      
      this.addFinding({
        type: 'privilege-escalation',
        severity: 'critical',
        file: filePath,
        line: lineNumber,
        description: 'User registration may allow privilege escalation',
        recommendation: 'Remove direct role assignment during registration and implement proper role assignment workflow'
      });
    }
  }

  checkStubbedCredentials(filePath, content, lines) {
    const stubPattern = /password\s*=\s*['"`].*['"`]|username\s*=\s*['"`].*['"`]|mockData|fakeData|stub/gi;
    const assignmentPattern = /=\s*['"`](password|username)['"`]/gi;
    
    if (stubPattern.test(content) && assignmentPattern.test(content)) {
      const lineIndex = content.search(assignmentPattern);
      const lineNumber = content.substring(0, lineIndex).split('\n').length;
      
      this.addFinding({
        type: 'stubbed-credentials',
        severity: 'medium',
        file: filePath,
        line: lineNumber,
        description: 'Stubbed or hardcoded credentials detected',
        recommendation: 'Remove hardcoded credentials and implement proper authentication flow'
      });
    }
  }

  checkHardcodedSecrets(filePath, content, lines) {
    const secretPattern = /secret|key|token|password|api[_-]?key|private[_-]?key/gi;
    const valuePattern = /secret\s*:\s*['"`][^'"`]{10,}['"`]|key\s*:\s*['"`][^'"`]{20,}['"`]/gi;
    
    if (secretPattern.test(content) && valuePattern.test(content)) {
      const lineIndex = content.search(valuePattern);
      const lineNumber = content.substring(0, lineIndex).split('\n').length;
      
      this.addFinding({
        type: 'hardcoded-secrets',
        severity: 'critical',
        file: filePath,
        line: lineNumber,
        description: 'Potential hardcoded secret detected',
        recommendation: 'Move secrets to environment variables or a secure secret management system'
      });
    }
  }

  checkErrorHandling(filePath, content, lines) {
    const errorPattern = /console\.error|console\.log|res\.send\([^)]*\)|res\.json\([^)]*\)/gi;
    const sensitivePattern = /password|secret|key|token/gi;
    
    let match;
    while ((match = errorPattern.exec(content)) !== null) {
      const errorLine = match[0];
      const lineIndex = content.substring(0, match.index).split('\n').length;
      
      if (sensitivePattern.test(errorLine)) {
        this.addFinding({
          type: 'error-handling',
          severity: 'medium',
          file: filePath,
          line: lineIndex,
          description: 'Error message may expose sensitive information',
          recommendation: 'Sanitize error messages to avoid exposing sensitive data'
        });
      }
    }
  }

  addFinding(finding) {
    this.findings.push(finding);
  }

  async createGitHubIssues() {
    console.log('\nCreating GitHub issues...');
    
    for (const finding of this.findings) {
      const title = this.generateIssueTitle(finding);
      
      if (this.issueTitles.has(title)) {
        console.log(`Skipping duplicate issue: ${title}`);
        continue;
      }
      
      const body = this.generateIssueBody(finding);
      
      try {
        const command = `gh issue create --title "${title}" --body "${body}" --repo ${this.organization}/${this.repository}`;
        execSync(command, { encoding: 'utf8', stdio: 'inherit' });
        this.issueTitles.add(title);
        console.log(`Created issue: ${title}`);
      } catch (error) {
        console.error(`Failed to create issue for finding: ${finding.description}`);
        console.error(error.message);
      }
    }
  }

  generateIssueTitle(finding) {
    const typeMap = {
      'missing-auth': 'Missing Authentication Middleware',
      'weak-jwt': 'Weak JWT Implementation',
      'payment-validation': 'Insufficient Payment Validation',
      'privilege-escalation': 'Potential Privilege Escalation',
      'stubbed-credentials': 'Stubbed Credentials Detected',
      'hardcoded-secrets': 'Hardcoded Secrets',
      'error-handling': 'Information Disclosure in Error Messages'
    };
    
    const severityMap = {
      'low': 'Low',
      'medium': 'Medium',
      'high': 'High',
      'critical': 'Critical'
    };
    
    return `[${severityMap[finding.severity]}] ${typeMap[finding.type]} in ${path.basename(finding.file)}`;
  }

  generateIssueBody(finding) {
    const severityMap = {
      'low': 'Low',
      'medium': 'Medium',
      'high': 'High',
      'critical': 'Critical'
    };
    
    const typeMap = {
      'missing-auth': 'Missing Authentication Middleware',
      'weak-jwt': 'Weak JWT Implementation',
      'payment-validation': 'Insufficient Payment Validation',
      'privilege-escalation': 'Potential Privilege Escalation',
      'stubbed-credentials': 'Stubbed Credentials Detected',
      'hardcoded-secrets': 'Hardcoded Secrets',
      'error-handling': 'Information Disclosure in Error Messages'
    };
    
    const body = `## Summary
${finding.description}

## Details
- **Type**: ${typeMap[finding.type]}
- **Severity**: ${severityMap[finding.severity]}
- **File**: \`${finding.file}\`
- **Line**: ${finding.line}

## Recommendation
${finding.recommendation}

## Ownership Disclaimer
This issue was automatically created by a security scanner. While the scanner attempts to identify potential vulnerabilities, these findings should be reviewed and validated by a security professional before taking any action. The scanner may produce false positives.

---

Automated finding from SecureBananaLabs security scanner`;
    
    return body;
  }
}

function main() {
  const argv = yargs(hideBin(process.argv))
    .option('repo-path', {
      alias: 'p',
      type: 'string',
      description: 'Path to the repository to scan',
      default: '.'
    })
    .option('create-issues', {
      alias: 'c',
      type: 'boolean',
      description: 'Create GitHub issues for findings',
      default: false
    })
    .option('dry-run', {
      alias: 'd',
      type: 'boolean',
      description: 'Print findings without creating issues',
      default: false
    })
    .option('github-token', {
      type: 'string',
      description: 'GitHub token for creating issues',
      default: process.env.GITHUB_TOKEN
    })
    .option('organization', {
      type: 'string',
      description: 'GitHub organization',
      default: 'SecureBananaLabs'
    })
    .option('repository', {
      type: 'string',
      description: 'GitHub repository',
      default: 'bug-bounty'
    })
    .demandCommand(1, 'You need to provide at least one command')
    .help()
    .argv;

  const scanner = new SecurityScanner({
    repoPath: argv.repoPath,
    createIssues: argv.createIssues,
    dryRun: argv.dryRun,
    githubToken: argv.githubToken,
    organization: argv.organization,
    repository: argv.repository
  });

  scanner.scan();
}

if (require.main === module) {
  main();
}

module.exports = SecurityScanner;