import { execFileSync } from "node:child_process";
import { formatIssueBody } from "./formatIssue.mjs";

/**
 * @param {string} command
 * @param {string[]} args
 * @param {{ cwd?: string, input?: string }} [options]
 */
function run(command, args, options = {}) {
  return execFileSync(command, args, {
    cwd: options.cwd,
    input: options.input,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"]
  }).trim();
}

/**
 * @param {{ owner: string, repo: string, cwd?: string }} config
 * @returns {Set<string>}
 */
export function listOpenIssueTitles(config) {
  const json = run(
    "gh",
    [
      "issue",
      "list",
      "--repo",
      `${config.owner}/${config.repo}`,
      "--state",
      "open",
      "--limit",
      "500",
      "--json",
      "title"
    ],
    { cwd: config.cwd }
  );

  /** @type {{ title: string }[]} */
  const issues = JSON.parse(json || "[]");
  return new Set(issues.map((issue) => issue.title));
}

/**
 * @param {{
 *   finding: {
 *     id: string,
 *     title: string,
 *     severity: string,
 *     file: string,
 *     description: string,
 *     remediation: string
 *   },
 *   owner: string,
 *   repo: string,
 *   parentIssue?: number,
 *   dryRun?: boolean,
 *   cwd?: string
 * }} options
 */
export function createIssueForFinding(options) {
  const body = formatIssueBody(options.finding, { parentIssue: options.parentIssue });

  if (options.dryRun) {
    return {
      created: false,
      dryRun: true,
      title: options.finding.title,
      body
    };
  }

  const url = run(
    "gh",
    [
      "issue",
      "create",
      "--repo",
      `${options.owner}/${options.repo}`,
      "--title",
      options.finding.title,
      "--body",
      body
    ],
    { cwd: options.cwd }
  );

  return {
    created: true,
    dryRun: false,
    title: options.finding.title,
    url,
    body
  };
}

/**
 * Recursively create issues for findings that do not already exist by title.
 * Re-reads open titles after each batch so repeated runs stay idempotent.
 *
 * @param {{
 *   findings: Array<{
 *     id: string,
 *     title: string,
 *     severity: string,
 *     file: string,
 *     description: string,
 *     remediation: string
 *   }>,
 *   owner?: string,
 *   repo?: string,
 *   parentIssue?: number,
 *   dryRun?: boolean,
 *   cwd?: string,
 *   maxIssues?: number
 * }} options
 */
export function createIssuesRecursively(options) {
  const owner = options.owner ?? "SecureBananaLabs";
  const repo = options.repo ?? "bug-bounty";
  const parentIssue = options.parentIssue ?? 743;
  const maxIssues = options.maxIssues ?? options.findings.length;
  const existingTitles = options.dryRun
    ? new Set()
    : listOpenIssueTitles({ owner, repo, cwd: options.cwd });

  /** @type {ReturnType<typeof createIssueForFinding>[]} */
  const results = [];

  for (const finding of options.findings) {
    if (results.length >= maxIssues) {
      break;
    }

    if (existingTitles.has(finding.title)) {
      results.push({
        created: false,
        dryRun: Boolean(options.dryRun),
        title: finding.title,
        skipped: true,
        reason: "duplicate-title"
      });
      continue;
    }

    const result = createIssueForFinding({
      finding,
      owner,
      repo,
      parentIssue,
      dryRun: options.dryRun,
      cwd: options.cwd
    });

    results.push(result);

    if (result.created) {
      existingTitles.add(finding.title);
    }
  }

  return results;
}
