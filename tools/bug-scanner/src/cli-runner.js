import path from "node:path";
import { fileURLToPath } from "node:url";
import { exportIssues } from "./export-issues.js";
import { assertRepositoryStarred } from "./github-client.js";
import { formatFindingAsIssue, formatIssuesMarkdown } from "./issue-formatter.js";
import { runRecursiveIssuePipeline } from "./recursive-issue-pipeline.js";
import { scanRepository } from "./scanner.js";

export const DEFAULT_GITHUB_REPO = "SecureBananaLabs/bug-bounty";

export function parseGithubRepo(value) {
  const [owner, repo] = value.split("/");
  if (!owner || !repo) {
    throw new Error(`Invalid --github-repo value: ${value}`);
  }
  return { owner, repo };
}

export function parseArgs(argv, defaults = {}) {
  const options = {
    rootDir: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../.."),
    format: "markdown",
    recursive: true,
    maxDepth: 2,
    exportDir: null,
    createIssues: false,
    dryRun: true,
    maxIssues: 1,
    githubRepo: DEFAULT_GITHUB_REPO,
    ...defaults
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--format" && argv[index + 1]) {
      options.format = argv[++index];
      continue;
    }
    if (arg === "--root" && argv[index + 1]) {
      options.rootDir = path.resolve(argv[++index]);
      continue;
    }
    if (arg === "--max-depth" && argv[index + 1]) {
      options.maxDepth = Number(argv[++index]);
      continue;
    }
    if (arg === "--export-dir" && argv[index + 1]) {
      options.exportDir = path.resolve(argv[++index]);
      continue;
    }
    if (arg === "--github-repo" && argv[index + 1]) {
      options.githubRepo = argv[++index];
      continue;
    }
    if (arg === "--max-issues" && argv[index + 1]) {
      options.maxIssues = Number(argv[++index]);
      continue;
    }
    if (arg === "--create-issues") {
      options.createIssues = true;
      continue;
    }
    if (arg === "--execute") {
      options.dryRun = false;
      continue;
    }
    if (arg === "--no-recursive") {
      options.recursive = false;
    }
  }

  return options;
}

export async function runBugScannerCli(argv, deps = {}) {
  const env = deps.env ?? process.env;
  const fetchImpl = deps.fetchImpl ?? globalThis.fetch;
  const writeStdout = deps.writeStdout ?? ((text) => console.log(text));
  const writeStderr = deps.writeStderr ?? ((text) => console.error(text));
  const options = parseArgs(argv, deps.defaults);
  const findings = scanRepository(options);
  const issues = findings.map(formatFindingAsIssue);

  if (options.exportDir) {
    const manifest = exportIssues(issues, options.exportDir);
    writeStderr(`Exported ${manifest.length} issue drafts to ${options.exportDir}`);
  }

  if (options.createIssues) {
    const { owner, repo } = parseGithubRepo(options.githubRepo);
    const token = env.GITHUB_TOKEN;

    if (!options.dryRun) {
      await assertRepositoryStarred({ owner, repo, token }, { fetchImpl });
      writeStderr(`Verified ${owner}/${repo} is starred by the authenticated user.`);
    }

    const created = await runRecursiveIssuePipeline({
      rootDir: options.rootDir,
      owner,
      repo,
      token,
      dryRun: options.dryRun,
      maxIssues: options.maxIssues,
      maxDepth: options.maxDepth,
      fetchImpl
    });

    if (options.format === "json") {
      writeStdout(JSON.stringify({ findings, issues, created }, null, 2));
      return { findings, issues, created };
    }

    writeStdout(`# Recursive issue pipeline (${created.length} issue(s))\n`);
    for (const entry of created) {
      const status = entry.result.dryRun ? "dry-run" : `created #${entry.result.number}`;
      writeStdout(`- ${status}: ${entry.issue.title}`);
      if (entry.result.html_url) {
        writeStdout(`  ${entry.result.html_url}`);
      }
    }

    return { findings, issues, created };
  }

  if (options.format === "json") {
    writeStdout(JSON.stringify({ findings, issues }, null, 2));
    return { findings, issues };
  }

  writeStdout(`# Bug scanner results (${findings.length} findings)\n`);
  writeStdout(formatIssuesMarkdown(issues));
  return { findings, issues };
}
