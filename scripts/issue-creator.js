const fs = require('fs');
const path = require('path');
const { Octokit } = require('@octokit/rest');

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

const repo = 'SecureBananaLabs/bug-bounty';

function detectLowHangingFruit(code) {
  // Implement a simple regex or pattern to detect low hanging fruit bugs
  const regex = /TODO:|FIXME:/i;
  return code.match(regex);
}

async function createIssue(title, body) {
  await octokit.issues.create({
    owner: repo.split('/')[0],
    repo: repo.split('/')[1],
    title,
    body
  });
}

// Read the codebase and detect low hanging fruit bugs
const codePath = path.join(__dirname, '../apps/api/src');
const code = fs.readFileSync(codePath, 'utf8');
const lowHangingBugs = detectLowHangingFruit(code);

if (lowHangingBugs && lowHangingBugs.length > 0) {
  lowHangingBugs.forEach(async (bug) => {
    const issueTitle = `Low Hanging Fruit: ${bug}`;
    const issueBody = `This issue is limited only to the creator of this issue. If you would like to work on it, please create another issue with the same contents and refer to issue #743 for more information.`;
    await createIssue(issueTitle, issueBody);
  });
}
