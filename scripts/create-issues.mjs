#!/usr/bin/env node
import { readFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { generateGitHubIssues, createGitHubIssues, scanRepository } from "./detect-issues.mjs";

const ROOT = resolve(import.meta.dirname, "..");

function loadConfig() {
  let configFile = process.env.CONFIG_PATH || join(ROOT, "scripts", "issue-config.json");
  if (!existsSync(configFile)) {
    configFile = join(ROOT, "scripts", "issue-config.json");
  }

  if (existsSync(configFile)) {
    try {
      return JSON.parse(readFileSync(configFile, "utf-8"));
    } catch {
      return {};
    }
  }
  return {};
}

const HELP = `
Usage: node scripts/create-issues.mjs [options]

Options:
  --help              Show this help message
  --dry-run           Preview issues without creating them (default: true unless --no-dry-run)
  --no-dry-run        Actually create issues on GitHub
  --repo owner/repo   GitHub repository to create issues in (e.g., "myuser/myrepo")
  --token <token>     GitHub personal access token (or set GITHUB_TOKEN env var)
  --label <label>     Label to apply to created issues (default: "bug")
  --rescan            Re-scan the repository before creating issues
  --config <path>     Path to config JSON file

Config file format (scripts/issue-config.json):
  {
    "repo": "owner/repo",
    "token": "ghp_...",
    "label": "bug",
    "dryRun": true,
    "rescan": true
  }

Environment variables:
  GITHUB_TOKEN        GitHub personal access token
  GITHUB_REPOSITORY   GitHub repository (e.g., "owner/repo")
`;

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--help")) {
    console.log(HELP);
    process.exit(0);
  }

  const config = loadConfig();
  const token = args.find((_, i) => args[i - 1] === "--token") || process.env.GITHUB_TOKEN || config.token;
  const repo = args.find((_, i) => args[i - 1] === "--repo") || process.env.GITHUB_REPOSITORY || config.repo;
  const label = args.find((_, i) => args[i - 1] === "--label") || config.label || "bug";
  const rescan = args.includes("--rescan") || config.rescan !== false;
  const dryRun = args.includes("--dry-run") || (args.includes("--no-dry-run") ? false : config.dryRun !== false);

  if (!repo) {
    console.error("Error: No repository specified. Use --repo owner/repo or set GITHUB_REPOSITORY.");
    process.exit(1);
  }

  if (!token && !dryRun) {
    console.error("Error: GITHUB_TOKEN is required when not in dry-run mode.");
    console.error("Set GITHUB_TOKEN environment variable or use --token.");
    process.exit(1);
  }

  let findings;
  if (rescan) {
    console.log("Scanning repository for issues...\n");
    findings = scanRepository(ROOT);
    console.log(`Found ${findings.length} potential issues.\n`);
  } else {
    const resultsPath = join(ROOT, "scripts", "detect-results.json");
    if (!existsSync(resultsPath)) {
      console.error("No scan results found. Run without --rescan or run detect-issues.mjs first.");
      process.exit(1);
    }
    const data = JSON.parse(readFileSync(resultsPath, "utf-8"));
    findings = data.findings;
    console.log(`Loaded ${findings.length} findings from previous scan.\n`);
  }

  const issues = generateGitHubIssues(findings, { dryRun });
  console.log(`Prepared ${issues.length} GitHub issues.\n`);

  if (dryRun) {
    console.log("=== DRY RUN ===");
    console.log(`Repository: ${repo}`);
    console.log(`Token: ${token ? "SET" : "NOT SET"}`);
    console.log(`Label: ${label}`);
    for (const issue of issues) {
      console.log(`\n--- ${issue.title} ---`);
      console.log(`Labels: ${issue.labels.join(", ")}`);
    }
    console.log(`\n${issues.length} issues would be created.`);
    console.log("Run with --no-dry-run to actually create them.");
  } else {
    console.log(`Creating ${issues.length} issues on ${repo}...\n`);
    const results = await createGitHubIssues(issues, { token, repo, dryRun: false });
    console.log(`\nResults: ${results.created} created, ${results.errors.length} errors.`);
    if (results.errors.length > 0) {
      for (const err of results.errors) {
        console.error(`  - ${err}`);
      }
    }
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
