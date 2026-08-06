import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import os from "node:os";

const argv = new Set(process.argv.slice(2));
const apply = argv.has("--apply");
const createPr = argv.has("--create-pr");

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const draftPath = path.resolve(repoRoot, "..", "..", "securebanana-743", "issue-draft.md");

function extractSection(markdown, heading) {
  const lines = markdown.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim() === `## ${heading}`);
  if (start === -1) throw new Error(`Missing section: ${heading}`);
  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    if (lines[index].startsWith("## ")) {
      end = index;
      break;
    }
  }
  return lines.slice(start + 1, end).join("\n").trim();
}

function run(cmd, args, options = {}) {
  return execFileSync(cmd, args, {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
    ...options,
  });
}

function parseRepoNameWithOwner(remoteUrl) {
  const httpsMatch = remoteUrl.match(/github\.com[:/](?<owner>[^/]+)\/(?<repo>[^/.]+)(?:\.git)?$/i);
  if (httpsMatch?.groups) {
    return `${httpsMatch.groups.owner}/${httpsMatch.groups.repo}`;
  }
  throw new Error(`Unable to derive GitHub repository from origin URL: ${remoteUrl}`);
}

async function main() {
  const draft = await fs.readFile(draftPath, "utf8");
  const title = extractSection(draft, "Title");
  const body = extractSection(draft, "Body");

  const originUrl = run("git", ["remote", "get-url", "origin"]).trim();
  const repo = parseRepoNameWithOwner(originUrl);
  const defaultBranch = "main";
  const currentBranch = run("git", ["branch", "--show-current"]).trim();
  const desiredBranchPattern = "feat/todo-triage-report-issue-<NEW_ISSUE_NUMBER>";

  if (!apply) {
    console.log("# Dry run only\n");
    console.log(`Repository: ${repo}`);
    console.log(`Default branch: ${defaultBranch}`);
    console.log(`Current branch: ${currentBranch}`);
    console.log(`Planned issue title: ${title}`);
    console.log(`Planned branch pattern: ${desiredBranchPattern}`);
    console.log("\nIssue create command:");
    console.log(`gh api repos/${repo}/issues -X POST -f title=\"${title}\" -f body=@bounty-radar/github-deliverables/securebanana-743/issue-draft.md`);
    console.log("\nAfter the issue is created, use its number in the PR body and branch name.");
    console.log("PR body should reference both the new issue and #743.");
    return;
  }

  const payloadPath = path.join(os.tmpdir(), `securebanana-743-issue-${Date.now()}.json`);
  await fs.writeFile(payloadPath, JSON.stringify({ title, body }, null, 2) + "\n");

  let issue;
  try {
    const issueJson = run("gh", ["api", `repos/${repo}/issues`, "-X", "POST", "--input", payloadPath]);
    issue = JSON.parse(issueJson);
  } finally {
    await fs.rm(payloadPath, { force: true });
  }

  const issueNumber = issue.number;
  const issueUrl = issue.html_url;
  const branch = `feat/todo-triage-report-issue-${issueNumber}`;

  if (currentBranch !== branch) {
    run("git", ["branch", "-m", branch]);
  }

  console.log(`Created issue #${issueNumber}: ${issueUrl}`);
  console.log(`Branch ready: ${branch}`);

  if (createPr) {
    const prBody = [
      `Linked issue: #${issueNumber}`,
      `Coordinator issue: #743`,
      "",
      "This PR implements the TODO/FIXME/XXX triage report pack with a generated markdown artifact.",
    ].join("\n");

    const prJson = run("gh", [
      "pr",
      "create",
      "--repo",
      repo,
      "--base",
      defaultBranch,
      "--head",
      branch,
      "--title",
      title,
      "--body",
      prBody,
    ]);
    process.stdout.write(prJson);
  } else {
    console.log("\nPR command to run next:");
    console.log(
      `gh pr create --repo ${repo} --base ${defaultBranch} --head ${branch} --title \"${title}\" --body \"Linked issue: #${issueNumber}\\nCoordinator issue: #743\\n\\nThis PR implements the TODO/FIXME/XXX triage report pack with a generated markdown artifact.\"`
    );
  }
}

await main();
