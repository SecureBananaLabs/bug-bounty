const { Octokit } = require('@octokit/rest');
const fs = require('fs');
const path = require('path');

const REPO_OWNER = 'user'; // will be replaced with actual repo owner
const REPO_NAME = 'repo';  // will be replaced with actual repo name

async function main() {
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  const issues = [];

  // Recursively scan all .js/.ts files (skipping node_modules)
  function walkDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== 'node_modules') walkDir(fullPath);
      } else if (/\.(js|ts)$/.test(entry.name)) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        // Low-hanging bugs: missing try-catch in async controllers
        if (/async\s+\(req,\s*res\)/.test(content) && !/\.catch\(/.test(content)) {
          issues.push({
            title: `Add error handling in ${fullPath}`,
            body: `The async controller in \`${fullPath}\` is missing a try-catch block. This can cause unhandled promise rejections.\n\n"${issueFooter}"`
          });
        }
        // Hard-coded strings that should be environment variables
        const envRegex = /(['"])[A-Z_]+\1(?::\s*['"]|['"]\s*:)/g;
        let match;
        while ((match = envRegex.exec(content)) !== null) {
          const key = match[1];
          if (process.env[key] === undefined && !key.startsWith('NODE_') && !key.startsWith('npm_')) {
            issues.push({
              title: `Move hard-coded value "${key}" to environment variable`,
              body: `The value \`${key}\` is hard-coded in \`${fullPath}\`. It should be retrieved from \`process.env\`.\n\n"${issueFooter}"`
            });
          }
        }
      }
    }
  }

  walkDir(process.cwd());

  // Create issues
  for (const issue of issues) {
    await octokit.rest.issues.create({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      title: issue.title,
      body: issue.body.replace('"${issueFooter}"', '') + '\n\n' + issueFooter
    });
  }

  // Star the repo
  await octokit.rest.activity.starRepoForAuthenticatedUser({
    owner: REPO_OWNER,
    repo: REPO_NAME
  });

  console.log(`Created ${issues.length} issues and starred the repo.`);
}

const issueFooter = "This issue is limited only to the creator of this issue. This means that only the issue author can attempt to solve this issue. If you would like to work on it, please create another issue with the same contents and refer to issue #11398 for more information.";

main().catch(console.error);