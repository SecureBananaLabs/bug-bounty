/**
 * Low-Hanging Fruit Bug Hunter Automation
 * Scans the codebase for TODO and FIXME comments and automatically converts them into GitHub issues.
 */
import fs from 'fs/promises';
import path from 'path';

const REPO_OWNER = process.env.GITHUB_REPOSITORY_OWNER || 'SecureBananaLabs';
const REPO_NAME = process.env.GITHUB_REPOSITORY_NAME || 'bug-bounty';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

const TARGET_DIRS = ['apps', 'packages'];
const FILE_EXTENSIONS = ['.js', '.ts', '.jsx', '.tsx'];
const BOUNTY_TEXT = "This issue is limited only to the creator of this issue. This means that only the issue author can attempt to solve this issue. If you would like to work on it, please create another issue with the same contents and refer to issue #743 for more information.";

const isDryRun = process.argv.includes('--dry-run');

async function scanDirectory(dir, findings) {
  try {
    const files = await fs.readdir(dir, { withFileTypes: true });
    for (const file of files) {
      const fullPath = path.join(dir, file.name);
      if (file.isDirectory()) {
        if (file.name !== 'node_modules' && file.name !== 'dist' && file.name !== '.next') {
          await scanDirectory(fullPath, findings);
        }
      } else {
        if (FILE_EXTENSIONS.includes(path.extname(fullPath))) {
          await scanFile(fullPath, findings);
        }
      }
    }
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.error(`Error scanning directory ${dir}:`, err.message);
    }
  }
}

async function scanFile(filePath, findings) {
  const content = await fs.readFile(filePath, 'utf-8');
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(/\/\/\s*(TODO|FIXME)\s*:\s*(.*)/i);
    if (match) {
      findings.push({
        file: filePath,
        line: i + 1,
        type: match[1].toUpperCase(),
        description: match[2].trim()
      });
    }
  }
}

async function createGitHubIssue(finding) {
  const title = `[Auto-Detect] Address ${finding.type} in ${path.basename(finding.file)}`;
  const body = `### Automated Bug Detection

Found a low-hanging fruit \`${finding.type}\` item in the codebase that needs to be addressed.

**File:** \`${finding.file}\`
**Line:** ${finding.line}
**Context:** \`${finding.description}\`

---

${BOUNTY_TEXT}`;

  if (isDryRun) {
    console.log(`\n[DRY RUN] Would create issue:`);
    console.log(`Title: ${title}`);
    console.log(`Body:\n${body}`);
    return;
  }

  if (!GITHUB_TOKEN) {
    console.error('Error: GITHUB_TOKEN environment variable is required to create issues.');
    return;
  }

  const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/issues`, {
    method: 'POST',
    headers: {
      'Authorization': `token ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ title, body })
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error(`Failed to create issue for ${finding.file}:`, errText);
  } else {
    const resJson = await response.json();
    console.log(`Successfully created issue: ${resJson.html_url}`);
  }
}

async function main() {
  console.log(`Starting Bug Hunter Bot... (Dry Run: ${isDryRun})`);
  const findings = [];
  
  for (const dir of TARGET_DIRS) {
    await scanDirectory(dir, findings);
  }

  console.log(`Scan complete. Found ${findings.length} potential issues.`);

  for (const finding of findings) {
    await createGitHubIssue(finding);
    // Add a slight delay to avoid hitting rate limits
    if (!isDryRun) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

main().catch(console.error);
