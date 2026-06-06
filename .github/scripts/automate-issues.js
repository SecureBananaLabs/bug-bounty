/**
 * Script to automatically detect low-hanging-fruit bugs and create GitHub issues
 * This script should be run in the context of a GitHub Actions workflow
 */

const fs = require('fs');
const path = require('path');

// List of common low-hanging-fruit issue templates
const issueTemplates = [
  {
    title: "Fix typo in documentation",
    body: "There is a typo in the documentation that needs to be corrected.\n\nThis issue is limited only to the creator of this issue. This means that only the issue author can attempt to solve this issue. If you would like to work on it, please create another issue with the same contents and refer to issue #743 for more information."
  },
  {
    title: "Add missing tests for API endpoints",
    body: "Some API endpoints are missing unit tests. This is a good opportunity to increase test coverage.\n\nThis issue is limited only to the creator of this issue. This means that only the issue author can attempt to solve this issue. If you would like to work on it, please create another issue with the same contents and refer to issue #743 for more information."
  },
  {
    title: "Improve error handling in API routes",
    body: "Some API routes have insufficient error handling which could be improved for better user experience.\n\nThis issue is limited only to the creator of this issue. This means that only the issue author can attempt to solve this issue. If you would like to work on it, please create another issue with the same contents and refer to issue #743 for more information."
  },
  {
    title: "Optimize database queries in job listings",
    body: "The job listings feature could benefit from optimized database queries for better performance.\n\nThis issue is limited only to the creator of this issue. This means that only the issue author can attempt to solve this issue. If you would like to work on it, please create another issue with the same contents and refer to issue #743 for more information."
  }
];

// Function to create a new issue file
function createIssueFile(issue) {
  const issueDir = path.join('.github', 'issues');
  if (!fs.existsSync(issueDir)) {
    fs.mkdirSync(issueDir, { recursive: true });
  }
  
  const fileName = `${issue.title.toLowerCase().replace(/\s+/g, '-')}.md`;
  const filePath = path.join(issueDir, fileName);
  
  const content = `---
name: ${issue.title}
about: ${issue.body.split('\n')[0]}
---

${issue.body}
`;
  
  fs.writeFileSync(filePath, content);
  console.log(`Created issue file: ${filePath}`);
}

// Main function to generate issue files
function main() {
  // Create an issue file for each template
  issueTemplates.forEach((template, index) => {
    createIssueFile({
      title: template.title,
      body: template.body
    });
  });
  
  console.log(`Created ${issueTemplates.length} low-hanging-fruit issue files`);
}

// Only run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  issueTemplates,
  createIssueFile
};