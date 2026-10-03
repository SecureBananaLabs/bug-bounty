const { Octokit } = require("@octokit/rest");
const { exec } = require("child_process");

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = process.env.REPO_OWNER || "SecureBananaLabs";
const REPO_NAME = process.env.REPO_NAME || "bug-bounty";

const octokit = new Octokit({ auth: GITHUB_TOKEN });

async function findCodeIssues() {
  return new Promise((resolve, reject) => {
    exec("git grep -n 'TODO\\|FIXME' -- . ':!*.md' ':!*.spec.js'", (error, stdout) => {
      if (error) reject(error);
      const issues = stdout
        .split('\n')
        .filter(line => line.trim())
        .map(line => {
          const [fileLine, ...contentParts] = line.split(':');
          const [file, lineNum] = fileLine.split(':');
          return { 
            file: file.trim(), 
            line: parseInt(lineNum), 
            content: contentParts.join(':').trim() 
          };
        });
      resolve(issues);
    });
  });
}

async function checkExistingIssue(file, line) {
  const response = await octokit.rest.search.issuesAndPullRequests({
    q: `${file} line:${line} in:body`,
    per_page: 1
  });
  return response.data.items.length > 0;
}

async function createGitHubIssue(file, line, content) {
  await octokit.rest.issues.create({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    title: `Potential issue in ${file} at line ${line}`,
    body: `Found: \`${content}\`\n\nThis issue is limited only to the creator. To contribute, create a new issue referencing #11398.`
  });
}

async function detectAndCreateIssues() {
  try {
    const issues = await findCodeIssues();
    for (const issue of issues) {
      if (!(await checkExistingIssue(issue.file, issue.line))) {
        await createGitHubIssue(issue.file, issue.line, issue.content);
      }
    }
  } catch (error) {
    console.error("Detection failed:", error);
  }
}

module.exports = { detectAndCreateIssues };
