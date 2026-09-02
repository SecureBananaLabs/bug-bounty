#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";
import { exportIssues } from "./export-issues.js";
import { formatFindingAsIssue, formatIssuesMarkdown } from "./issue-formatter.js";
import { runRecursiveIssuePipeline } from "./recursive-issue-pipeline.js";
import { scanRepository } from "./scanner.js";

const DEFAULT_GITHUB_REPO = "SecureBananaLabs/bug-bounty";

function parseGithubRepo(value) {
  const [owner, repo] = value.split("/");
  if (!owner || !repo) {
    throw new Error(`Invalid --github-repo value: ${value}`);
  }
  return { owner, repo };
}

function parseArgs(argv) {
  const options = {
    rootDir: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../.."),
    format: "markdown",
    recursive: true,
    maxDepth: 2,
    exportDir: null,
    createIssues: false,
    dryRun: true,
    maxIssues: 1,
    githubRepo: DEFAULT_GITHUB_REPO
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

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const findings = scanRepository(options);
  const issues = findings.map(formatFindingAsIssue);

  if (options.exportDir) {
    const manifest = exportIssues(issues, options.exportDir);
    console.error(`Exported ${manifest.length} issue drafts to ${options.exportDir}`);
  }

  if (options.createIssues) {
    const { owner, repo } = parseGithubRepo(options.githubRepo);

    if (!options.dryRun) {
      console.error(
        "Reminder: star SecureBananaLabs/bug-bounty before opening a PR (see README.md)."
      );
    }

    const created = await runRecursiveIssuePipeline({
      rootDir: options.rootDir,
      owner,
      repo,
      dryRun: options.dryRun,
      maxIssues: options.maxIssues,
      maxDepth: options.maxDepth
    });

    if (options.format === "json") {
      console.log(JSON.stringify({ findings, issues, created }, null, 2));
      return;
    }

    console.log(`# Recursive issue pipeline (${created.length} issue(s))\n`);
    for (const entry of created) {
      const status = entry.result.dryRun ? "dry-run" : `created #${entry.result.number}`;
      console.log(`- ${status}: ${entry.issue.title}`);
      if (entry.result.html_url) {
        console.log(`  ${entry.result.html_url}`);
      }
    }
    return;
  }

  if (options.format === "json") {
    console.log(JSON.stringify({ findings, issues }, null, 2));
    return;
  }

  console.log(`# Bug scanner results (${findings.length} findings)\n`);
  console.log(formatIssuesMarkdown(issues));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
