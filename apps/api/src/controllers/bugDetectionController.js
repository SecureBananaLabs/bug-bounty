const BugDetectionService = require('../services/bugDetectionService');

class BugDetectionController {
  constructor() {
    this.bugDetectionService = new BugDetectionService();
  }

  async scanForBugs(req, res) {
    try {
      const issues = await this.bugDetectionService.scanForIssues();
      const report = this.bugDetectionService.generateIssueReport();
      
      res.status(200).json({
        success: true,
        issues,
        report
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to scan for bugs',
        error: error.message
      });
    }
  }

  async generateBugIssue(req, res) {
    try {
      // Find a low-hanging fruit bug
      const issues = await this.bugDetectionService.scanForIssues();
      const lowSeverityIssues = issues.filter(issue => issue.severity === 'low');
      
      if (lowSeverityIssues.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No low-hanging fruit bugs found'
        });
      }
      
      // Select the first low-hanging fruit bug
      const selectedIssue = lowSeverityIssues[0];
      
      // Create GitHub issue content
      const issueTitle = `Fix ${selectedIssue.type} in ${selectedIssue.file}`;
      const issueBody = `
## Bug Description
${selectedIssue.description}

## Location
- File: ${selectedIssue.file}
- Line: ${selectedIssue.line}

## Suggested Fix
${selectedIssue.suggestion}

## Steps to Reproduce
1. Navigate to the file: ${selectedIssue.file}
2. Locate the issue at line ${selectedIssue.line}
3. Apply the suggested fix

## Acceptance Criteria
- [ ] The bug is fixed
- [ ] No new issues are introduced
- [ ] The fix is tested

This issue is limited only to the creator of this issue. This means that only the issue author can attempt to solve this issue. If you would like to work on it, please create another issue with the same contents and refer to issue #11398 for more information.
      `;
      
      res.status(200).json({
        success: true,
        issueTitle,
        issueBody,
        issue: selectedIssue
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to generate bug issue',
        error: error.message
      });
    }
  }
}

module.exports = BugDetectionController;