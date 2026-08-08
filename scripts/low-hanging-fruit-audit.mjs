#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const REQUIRED_EXCLUSIVITY_TEXT =
  "This issue is limited only to the creator of this issue. This means that only the issue author can attempt to solve this issue. If you would like to work on it, please create another issue with the same contents and refer to issue #743 for more information.";

const DEFAULT_REPO = "SecureBananaLabs/bug-bounty";
const DEFAULT_SCAN_ROOTS = ["apps", "packages", "README.md", ".gitignore"];
const IGNORED_DIRECTORIES = new Set([".git", ".next", "node_modules", "dist", "coverage"]);

let args;
try {
  args = parseArgs(process.argv.slice(2));
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
const repoRoot = process.cwd();
const scanRoots = args.roots.length > 0 ? args.roots : DEFAULT_SCAN_ROOTS;
const sourceFiles = collectSourceFiles(repoRoot, scanRoots);
const candidates = buildIssueCandidates(repoRoot, sourceFiles);
const selectedCandidates = candidates.slice(0, args.limit);

if (selectedCandidates.length === 0) {
  console.log("No low-hanging issue candidates found.");
  process.exit(0);
}

console.log(`Found ${candidates.length} low-hanging issue candidate(s).`);
console.log(`Showing ${selectedCandidates.length}; limit can be changed with --limit N.\n`);

for (const [index, candidate] of selectedCandidates.entries()) {
  console.log(`${index + 1}. ${candidate.title}`);
  console.log(`   ${candidate.summary}`);
  for (const evidence of candidate.evidence) {
    console.log(`   - ${evidence.path}:${evidence.line} ${evidence.detail}`);
  }
  console.log("   Issue body:");
  console.log(indentBlock(formatIssueBody(candidate), "     "));
  console.log("");
}

if (!args.shouldCreateIssues) {
  console.log("Dry run only. Re-run with --create --confirm to open GitHub issues.");
  process.exit(0);
}

if (!args.isConfirmed) {
  console.error("Refusing to create issues without --confirm.");
  process.exit(1);
}

for (const candidate of selectedCandidates) {
  if (issueAlreadyExists(args.repo, candidate.title)) {
    console.log(`Skipped duplicate: ${candidate.title}`);
    continue;
  }

  const issueUrl = execFileSync(
    "gh",
    [
      "issue",
      "create",
      "--repo",
      args.repo,
      "--title",
      candidate.title,
      "--body",
      formatIssueBody(candidate)
    ],
    { encoding: "utf8" }
  ).trim();

  console.log(`Created: ${issueUrl}`);
}

function parseArgs(rawArgs) {
  const parsed = {
    shouldCreateIssues: false,
    isConfirmed: false,
    limit: 5,
    repo: DEFAULT_REPO,
    roots: []
  };

  for (let index = 0; index < rawArgs.length; index += 1) {
    const arg = rawArgs[index];

    if (arg === "--create") {
      parsed.shouldCreateIssues = true;
      continue;
    }

    if (arg === "--confirm") {
      parsed.isConfirmed = true;
      continue;
    }

    if (arg === "--limit") {
      parsed.limit = parsePositiveIntegerOption(readOptionValue(rawArgs, index, "--limit"), "--limit");
      index += 1;
      continue;
    }

    if (arg === "--repo") {
      parsed.repo = readOptionValue(rawArgs, index, "--repo");
      index += 1;
      continue;
    }

    if (arg === "--root") {
      parsed.roots.push(readOptionValue(rawArgs, index, "--root"));
      index += 1;
      continue;
    }

    throw new Error(`Unknown option: ${arg}`);
  }

  return parsed;
}

function readOptionValue(rawArgs, optionIndex, optionName) {
  const value = rawArgs[optionIndex + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`${optionName} requires a value.`);
  }
  return value;
}

function parsePositiveIntegerOption(value, optionName) {
  const parsedValue = Number.parseInt(value, 10);
  if (!Number.isInteger(parsedValue) || parsedValue < 1) {
    throw new Error(`${optionName} must be a positive integer.`);
  }
  return parsedValue;
}

function collectSourceFiles(rootDirectory, rootsToScan) {
  const files = [];

  for (const scanRoot of rootsToScan) {
    const absolutePath = join(rootDirectory, scanRoot);

    if (!existsSync(absolutePath)) {
      continue;
    }

    const stats = statSync(absolutePath);
    if (stats.isFile()) {
      files.push(readTextFile(rootDirectory, absolutePath));
      continue;
    }

    walkDirectory(rootDirectory, absolutePath, files);
  }

  return files;
}

function walkDirectory(rootDirectory, directoryPath, files) {
  const entries = readdirSync(directoryPath, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory() && IGNORED_DIRECTORIES.has(entry.name)) {
      continue;
    }

    const absolutePath = join(directoryPath, entry.name);

    if (entry.isDirectory()) {
      walkDirectory(rootDirectory, absolutePath, files);
      continue;
    }

    if (entry.isFile() && isRelevantFile(entry.name)) {
      files.push(readTextFile(rootDirectory, absolutePath));
    }
  }
}

function readTextFile(rootDirectory, absolutePath) {
  const content = readFileSync(absolutePath, "utf8");
  return {
    path: relative(rootDirectory, absolutePath),
    content,
    lines: content.split(/\r?\n/)
  };
}

function isRelevantFile(fileName) {
  return /\.(js|jsx|ts|tsx|json|md|prisma|gitignore)$/.test(fileName) || fileName === ".gitignore";
}

function buildIssueCandidates(rootDirectory, files) {
  const candidates = [];

  addMemoryUploadCandidate(candidates, files);
  addPublicMutationCandidate(candidates, files);
  addEnvExampleCandidate(candidates, rootDirectory, files);
  addTimestampIdCandidate(candidates, files);
  addTodoStubCandidate(candidates, files);

  return candidates;
}

function addMemoryUploadCandidate(candidates, files) {
  const evidence = findLineMatches(files, /multer\.memoryStorage\(\)/);
  if (evidence.length === 0) {
    return;
  }

  const hasLimits = findLineMatches(files, /limits\s*:/).some((match) =>
    evidence.some((uploadMatch) => uploadMatch.path === match.path)
  );

  if (hasLimits) {
    return;
  }

  candidates.push({
    title: "Bound memory-backed upload size and file validation",
    summary: "The upload route stores incoming files in memory without a file-size limit or file-type validation.",
    evidence,
    suggestedFix:
      "Add multer limits, reject empty or unsupported files, and cover oversized uploads with an API test."
  });
}

function addPublicMutationCandidate(candidates, files) {
  const routeFiles = files.filter((file) => file.path.includes("apps/api/src/routes/"));
  const evidence = [];

  for (const file of routeFiles) {
    if (file.path.endsWith("authRoutes.js")) {
      continue;
    }

    const hasRouteWideAuth = file.content.includes(".use(authMiddleware)");
    if (hasRouteWideAuth) {
      continue;
    }

    for (const [lineIndex, line] of file.lines.entries()) {
      if (/\.(post|put|patch|delete)\s*\(/.test(line) && !line.includes("authMiddleware")) {
        evidence.push({
          path: file.path,
          line: lineIndex + 1,
          detail: line.trim()
        });
      }
    }
  }

  if (evidence.length === 0) {
    return;
  }

  candidates.push({
    title: "Require auth on mutating API routes outside auth",
    summary: "Several non-auth API routers expose write endpoints without route-level or handler-level auth middleware.",
    evidence,
    suggestedFix:
      "Add the existing auth middleware to mutating routers or individual write handlers, then add 401/authorized-path API tests."
  });
}

function addEnvExampleCandidate(candidates, rootDirectory, files) {
  const gitignore = files.find((file) => file.path === ".gitignore");
  if (!gitignore || !gitignore.lines.some((line) => line.trim() === ".env.*")) {
    return;
  }

  const envExampleExists =
    existsSync(join(rootDirectory, ".env.example")) ||
    existsSync(join(rootDirectory, "apps/api/.env.example")) ||
    existsSync(join(rootDirectory, "apps/web/.env.example"));

  if (envExampleExists) {
    return;
  }

  const lineIndex = gitignore.lines.findIndex((line) => line.trim() === ".env.*");

  candidates.push({
    title: "Allow checked-in env examples for local setup",
    summary: "The README says packages need env values, but .gitignore blocks .env.example and no env template is present.",
    evidence: [
      {
        path: gitignore.path,
        line: lineIndex + 1,
        detail: ".env.* currently also ignores .env.example"
      }
    ],
    suggestedFix:
      "Add negated .env.example ignore rules and commit sanitized app/package env templates with placeholder values only."
  });
}

function addTimestampIdCandidate(candidates, files) {
  const evidence = findLineMatches(files, /`[a-z]{2,4}_\$\{Date\.now\(\)\}`/).filter(
    (match) => !match.path.endsWith("paymentService.js")
  );

  if (evidence.length === 0) {
    return;
  }

  candidates.push({
    title: "Replace timestamp-generated IDs in service stubs",
    summary: "Multiple service stubs create IDs from Date.now(), which can collide and does not match persistent model IDs.",
    evidence,
    suggestedFix:
      "Centralize ID generation with crypto.randomUUID() or database-created IDs, then update service tests around ID format and uniqueness."
  });
}

function addTodoStubCandidate(candidates, files) {
  const evidence = findLineMatches(files, /\bTODO\b|placeholder/i).filter(
    (match) =>
      !match.path.endsWith("paymentService.js") &&
      !match.path.endsWith("README.md") &&
      !match.path.endsWith("admin/page.tsx")
  );

  if (evidence.length === 0) {
    return;
  }

  candidates.push({
    title: "Resolve remaining backend TODO stubs",
    summary: "Core backend configuration and service paths still return placeholder behavior instead of production-ready implementation.",
    evidence,
    suggestedFix:
      "Replace TODO stubs one issue at a time, starting with DB client wiring or auth persistence, and add focused tests for the chosen slice."
  });
}

function findLineMatches(files, pattern) {
  const matches = [];

  for (const file of files) {
    for (const [lineIndex, line] of file.lines.entries()) {
      if (pattern.test(line)) {
        matches.push({
          path: file.path,
          line: lineIndex + 1,
          detail: line.trim()
        });
      }
    }
  }

  return matches;
}

function formatIssueBody(candidate) {
  const evidence = candidate.evidence
    .map((item) => `- \`${item.path}:${item.line}\` - ${item.detail}`)
    .join("\n");

  return `## Problem
${candidate.summary}

## Evidence
${evidence}

## Suggested fix
${candidate.suggestedFix}

## Source
Generated by the low-hanging-fruit automation from #743 after scanning the current repository.

${REQUIRED_EXCLUSIVITY_TEXT}
`;
}

function indentBlock(content, prefix) {
  return content
    .trimEnd()
    .split("\n")
    .map((line) => `${prefix}${line}`)
    .join("\n");
}

function issueAlreadyExists(repo, title) {
  const output = execFileSync(
    "gh",
    ["issue", "list", "--repo", repo, "--state", "open", "--search", title, "--json", "title"],
    { encoding: "utf8" }
  );
  const issues = JSON.parse(output);
  return issues.some((issue) => issue.title === title);
}
