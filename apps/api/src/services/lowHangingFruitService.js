/**
 * Low Hanging Fruit Service
 * 
 * This service automates the detection of low hanging fruit bugs
 * and creates GitHub issues for them.
 */

const { Octokit } = require("@octokit/rest");
const fs = require("fs").promises;
const path = require("path");

class LowHangingFruitService {
  constructor() {
    this.octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });
    this.repoOwner = "SecureBananaLabs";
    this.repoName = "bug-bounty";
    this.excludedDirs = [
      "node_modules",
      ".git",
      "dist",
      "build",
      ".next",
    ];
  }

  /**
   * Scan the codebase for potential low hanging fruit bugs
   * @returns {Array} Array of potential issues
   */
  async scanCodebase() {
    const issues = [];
    const rootDir = path.join(__dirname, "../../../..");
    
    // Get all files in the repository
    const files = await this.getAllFiles(rootDir);
    
    for (const file of files) {
      const content = await fs.readFile(file, "utf8");
      
      // Check for common security issues
      const securityIssues = this.checkForSecurityIssues(file, content);
      issues.push(...securityIssues);
      
      // Check for common bugs
      const bugs = this.checkForBugs(file, content);
      issues.push(...bugs);
      
      // Check for TODO comments
      const todos = this.checkForTodos(file, content);
      issues.push(...todos);
    }
    
    return issues;
  }

  /**
   * Get all files in the repository recursively
   * @param {string} dir - Directory to scan
   * @returns {Array} Array of file paths
   */
  async getAllFiles(dir) {
    let results = [];
    
    try {
      const list = await fs.readdir(dir, { withFileTypes: true });
      
      for (const file of list) {
        const fullPath = path.join(dir, file.name);
        
        if (file.isDirectory()) {
          if (!this.excludedDirs.includes(file.name)) {
            results = results.concat(await this.getAllFiles(fullPath));
          }
        } else {
          results.push(fullPath);
        }
      }
    } catch (error) {
      console.error(`Error reading directory ${dir}:`, error);
    }
    
    return results;
  }

  /**
   * Check for common security issues
   * @param {string} filePath - Path to the file
   * @param {string} content - Content of the file
   * @returns {Array} Array of security issues
   */
  checkForSecurityIssues(filePath, content) {
    const issues = [];
    const relativePath = path.relative(process.cwd(), filePath);
    
    // Check for hardcoded secrets
    const hardcodedSecrets = [
      /password\s*=\s*['"]\w+['"]/gi,
      /api_key\s*=\s*['"]\w+['"]/gi,
      /secret\s*=\s*['"]\w+['"]/gi,
      /token\s*=\s*['"]\w+['"]/gi,
    ];
    
    hardcodedSecrets.forEach(regex => {
      if (regex.test(content)) {
        issues.push({
          type: "security",
          severity: "high",
          title: "Potential hardcoded secret found",
          description: `Potential hardcoded secret found in ${relativePath}. Secrets should be stored in environment variables.`,
          file: relativePath,
          line: this.findLine(content, regex),
        });
      }
    });
    
    // Check for SQL injection vulnerabilities
    const sqlInjectionPatterns = [
      /SELECT\s+.*\s+FROM\s+.*\s+WHERE\s+.+\s*=\s*['"]?.*\$\{.+\}['"]?/gi,
      /query\s*\(\s*['"`].*\$\{.+\}['"`]\s*\)/gi,
    ];
    
    sqlInjectionPatterns.forEach(regex => {
      if (regex.test(content)) {
        issues.push({
          type: "security",
          severity: "high",
          title: "Potential SQL injection vulnerability",
          description: `Potential SQL injection vulnerability found in ${relativePath}. Use parameterized queries.`,
          file: relativePath,
          line: this.findLine(content, regex),
        });
      }
    });
    
    return issues;
  }

  /**
   * Check for common bugs
   * @param {string} filePath - Path to the file
   * @param {string} content - Content of the file
   * @returns {Array} Array of bugs
   */
  checkForBugs(filePath, content) {
    const issues = [];
    const relativePath = path.relative(process.cwd(), filePath);
    
    // Check for unused variables
    const unusedVars = content.match(/(?:let|const|var)\s+(\w+).*(?<!\1\s*=)[\s\S]*?(?=(?:let|const|var|\n\n))/g);
    if (unusedVars) {
      issues.push({
        type: "bug",
        severity: "low",
        title: "Potential unused variable",
        description: `Potential unused variable found in ${relativePath}. Remove unused variables to clean up the code.`,
        file: relativePath,
        line: this.findLine(content, unusedVars[0]),
      });
    }
    
    // Check for console.log statements in production code
    if (content.includes("console.log") && !filePath.includes("test")) {
      issues.push({
        type: "bug",
        severity: "low",
        title: "Console.log found in production code",
        description: `Console.log statement found in ${relativePath}. Remove console.log statements from production code.`,
        file: relativePath,
        line: this.findLine(content, "console.log"),
      });
    }
    
    return issues;
  }

  /**
   * Check for TODO comments
   * @param {string} filePath - Path to the file
   * @param {string} content - Content of the file
   * @returns {Array} Array of TODOs
   */
  checkForTodos(filePath, content) {
    const issues = [];
    const relativePath = path.relative(process.cwd(), filePath);
    
    // Check for TODO comments
    const todoRegex = /\/\/\s*TODO:|\/\*\s*TODO:|\*\s*TODO:/gi;
    if (todoRegex.test(content)) {
      issues.push({
        type: "improvement",
        severity: "low",
        title: "TODO comment found",
        description: `TODO comment found in ${relativePath}. Address these items to improve the codebase.`,
        file: relativePath,
        line: this.findLine(content, todoRegex),
      });
    }
    
    return issues;
  }

  /**
   * Find the line number of a match
   * @param {string} content - Content to search in
   * @param {RegExp} regex - Regular expression to match
   * @returns {number} Line number
   */
  findLine(content, regex) {
    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      if (regex.test(lines[i])) {
        return i + 1;
      }
    }
    return 1;
  }

  /**
   * Create a GitHub issue for a detected problem
   * @param {Object} issue - Issue object
   * @returns {Promise} Promise that resolves to the created issue
   */
  async createIssue(issue) {
    const issueBody = `
## Description
${issue.description}

## Location
File: \`${issue.file}\`
Line: ${issue.line}

## Severity
${issue.severity}

## Type
${issue.type}

## Steps to Reproduce
1. Navigate to the file \`${issue.file}\`
2. Look at line ${issue.line}
3. Review the code for the issue

## Expected Behavior
The code should follow best practices for ${issue.type}.

## Actual Behavior
${issue.description}

This issue is limited only to the creator of this issue. This means that only the issue author can attempt to solve this issue. If you would like to work on it, please create another issue with the same contents and refer to issue #743 for more information.
`;

    const issueData = {
      owner: this.repoOwner,
      repo: this.repoName,
      title: issue.title,
      body: issueBody,
      labels: ["low-hanging-fruit", issue.type, issue.severity],
    };

    try {
      const response = await this.octokit.rest.issues.create(issueData);
      return response.data;
    } catch (error) {
      console.error("Error creating issue:", error);
      throw error;
    }
  }

  /**
   * Main method to scan and create issues
   * @returns {Promise} Promise that resolves to the created issues
   */
  async run() {
    console.log("Starting low hanging fruit scan...");
    const issues = await this.scanCodebase();
    
    console.log(`Found ${issues.length} potential issues.`);
    
    const createdIssues = [];
    for (const issue of issues) {
      try {
        const createdIssue = await this.createIssue(issue);
        createdIssues.push(createdIssue);
        console.log(`Created issue #${createdIssue.number}: ${createdIssue.title}`);
      } catch (error) {
        console.error(`Failed to create issue for: ${issue.title}`, error);
      }
    }
    
    return createdIssues;
  }
}

module.exports = LowHangingFruitService;