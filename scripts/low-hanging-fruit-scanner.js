const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const https = require('https');

// Configuration
const REPO_OWNER = 'SecureBananaLabs';
const REPO_NAME = 'bug-bounty';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const ISSUE_TITLE_PREFIX = 'Low-hanging fruit bug: ';
const ISSUE_BODY_TEMPLATE = `This issue is limited only to the creator of this issue. This means that only the issue author can attempt to solve this issue. If you would like to work on it, please create another issue with the same contents and refer to issue #743 for more information.`;

// Bug patterns to detect
const BUG_PATTERNS = [
  // Missing error handling in async functions
  {
    name: 'Missing error handling in async functions',
    pattern: /async\s+(\w+)\s*\([^)]*\)\s*\{[^}]*?(?<!try)\s*(await|\.then\(|Promise\.all\()/g,
    severity: 'medium'
  },
  // Console.log statements in production code
  {
    name: 'Console.log statements in production code',
    pattern: /console\.(log|info|warn|error)\(/g,
    severity: 'low'
  },
  // TODO comments
  {
    name: 'TODO comments',
    pattern: /\/\/\s*TODO|\/\*\s*TODO/g,
    severity: 'low'
  },
  // Unused variables
  {
    name: 'Unused variables',
    pattern: /(?:let|const|var)\s+(\w+)\s*[=,;)]/g,
    severity: 'low'
  },
  // Hardcoded credentials or secrets
  {
    name: 'Potential hardcoded credentials',
    pattern: /(?:password|secret|key|token)\s*[=:]\s*['\"]([^'\"]{8,})['\"]/g,
    severity: 'high'
  },
  // Missing input validation
  {
    name: 'Missing input validation in API routes',
    pattern: /req\.(body|params|query)\s*\[/g,
    severity: 'medium'
  }
];

// Recursive function to find all JavaScript/TypeScript files
function findJsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && !file.startsWith('node_modules')) {
      findJsFiles(filePath, fileList);
    } else if (file.endsWith('.js') || file.endsWith('.ts') || file.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Analyze a single file for bugs
function analyzeFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const bugs = [];
    
    BUG_PATTERNS.forEach(pattern => {
      let match;
      const regex = new RegExp(pattern.pattern.source, 'g');
      
      while ((match = regex.exec(content)) !== null) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        const lineContent = content.split('\n')[lineNumber - 1].trim();
        
        bugs.push({
          type: pattern.name,
          severity: pattern.severity,
          file: filePath,
          line: lineNumber,
          code: lineContent,
          description: `Found ${pattern.name.toLowerCase()} at line ${lineNumber}`
        });
      }
    });
    
    return bugs;
  } catch (error) {
    console.error(`Error analyzing file ${filePath}:`, error.message);
    return [];
  }
}

// Create a GitHub issue
function createGitHubIssue(bug) {
  if (!GITHUB_TOKEN) {
    console.log('GITHUB_TOKEN not set. Skipping issue creation.');
    return null;
  }
  
  const issueData = JSON.stringify({
    title: `${ISSUE_TITLE_PREFIX}${bug.type}`,
    body: `**File:** ${bug.file}\n**Line:** ${bug.line}\n\n**Description:** ${bug.description}\n\n**Code:**\n\`${bug.code}\`\n\n**Severity:** ${bug.severity}\n\n${ISSUE_BODY_TEMPLATE}`,
    labels: ['low-hanging-fruit', bug.severity]
  });
  
  const options = {
    hostname: 'api.github.com',
    port: 443,
    path: `/repos/${REPO_OWNER}/${REPO_NAME}/issues`,
    method: 'POST',
    headers: {
      'Authorization': `token ${GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(issueData)
    }
  };
  
  const req = https.request(options, (res) => {
    let body = '';
    
    res.on('data', (chunk) => {
      body += chunk;
    });
    
    res.on('end', () => {
      const response = JSON.parse(body);
      if (res.statusCode === 201) {
        console.log(`Created issue #${response.number}: ${response.title}`);
        return response.number;
      } else {
        console.error(`Error creating issue: ${response.message}`);
        return null;
      }
    });
  });
  
  req.on('error', (e) => {
    console.error(`Error creating issue: ${e.message}`);
    return null;
  });
  
  req.write(issueData);
  req.end();
  
  return null; // Async operation
}

// Main function to scan and create issues
function main() {
  console.log('Starting low-hanging fruit bug scan...');
  
  // Find all JS/TS files in the monorepo
  const jsFiles = findJsFiles('.');
  console.log(`Found ${jsFiles.length} JavaScript/TypeScript files to analyze.`);
  
  // Analyze each file
  const allBugs = [];
  
  jsFiles.forEach(file => {
    console.log(`Analyzing ${file}...`);
    const bugs = analyzeFile(file);
    allBugs.push(...bugs);
  });
  
  // Group bugs by type
  const bugsByType = {};
  allBugs.forEach(bug => {
    if (!bugsByType[bug.type]) {
      bugsByType[bug.type] = [];
    }
    bugsByType[bug.type].push(bug);
  });
  
  // Create issues for each unique bug type
  const createdIssues = [];
  
  Object.keys(bugsByType).forEach(bugType => {
    const bug = bugsByType[bugType][0]; // Create one issue per bug type
    console.log(`Creating issue for: ${bugType}`);
    
    const issueNumber = createGitHubIssue(bug);
    if (issueNumber) {
      createdIssues.push(issueNumber);
    }
  });
  
  console.log(`Scan complete. Created ${createdIssues.length} issues.`);
  
  // Recursive detection - if we found issues, scan again after a delay
  if (createdIssues.length > 0) {
    console.log('Performing recursive scan for additional bugs...');
    setTimeout(() => {
      main();
    }, 5000); // 5 second delay before next scan
  }
}

// Run the main function
if (require.main === module) {
  main();
}

module.exports = { findJsFiles, analyzeFile, createGitHubIssue, main };