import path from "node:path";
import { DEFAULT_SCAN_DIRS } from "./constants.js";
import { createGitHubIssue, sleep } from "./create-github-issues.js";
import { formatFindingAsIssue, relatedDirectoriesForFindings } from "./issue-formatter.js";
import { scanRepository } from "./scanner.js";

export function findingKey(finding) {
  return `${finding.id}:${finding.file}:${finding.line}`;
}

function directoriesToScanDirs(rootDir, directories) {
  return [...new Set(directories.map((directory) => path.relative(rootDir, directory)))].filter(
    Boolean
  );
}

export async function runRecursiveIssuePipeline({
  rootDir,
  owner,
  repo,
  token = process.env.GITHUB_TOKEN,
  dryRun = true,
  maxIssues = 1,
  maxDepth = 2,
  issueDelayMs = 1000,
  fetchImpl = globalThis.fetch,
  scan = scanRepository,
  formatIssue = formatFindingAsIssue,
  createIssue = createGitHubIssue
}) {
  const created = [];
  const filedKeys = new Set();
  let scanDirs = null;

  while (created.length < maxIssues) {
    const findings = scan({
      rootDir,
      scanDirs: scanDirs ?? DEFAULT_SCAN_DIRS,
      recursive: true,
      maxDepth
    });

    const nextFinding = findings.find((finding) => !filedKeys.has(findingKey(finding)));
    if (!nextFinding) {
      break;
    }

    const issue = formatIssue(nextFinding);
    const result = await createIssue(
      { owner, repo, token, title: issue.title, body: issue.body, labels: issue.labels },
      { dryRun, fetchImpl }
    );

    filedKeys.add(findingKey(nextFinding));
    created.push({ finding: nextFinding, issue, result });

    const relatedDirectories = relatedDirectoriesForFindings([nextFinding], rootDir);
    const nextScanDirs = directoriesToScanDirs(rootDir, relatedDirectories);
    scanDirs = nextScanDirs.length > 0 ? nextScanDirs : null;

    if (!scanDirs) {
      break;
    }

    if (!dryRun && created.length < maxIssues) {
      await sleep(issueDelayMs);
    }
  }

  return created;
}
