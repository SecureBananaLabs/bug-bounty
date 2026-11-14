#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const CREATOR_ONLY_TEXT =
  "This issue is limited only to the creator of this issue. This means that only the issue author can attempt to solve this issue. If you would like to work on it, please create another issue with the same contents and refer to issue #743 for more information.";

const DEFAULT_SCAN_TARGETS = ["apps", "packages", "package.json", "README.md"];
const TEXT_EXTENSIONS = new Set([
  ".cjs",
  ".css",
  ".js",
  ".json",
  ".jsx",
  ".md",
  ".mjs",
  ".prisma",
  ".ts",
  ".tsx"
]);
const SKIPPED_DIRS = new Set([
  ".git",
  ".next",
  "build",
  "coverage",
  "dist",
  "node_modules",
  "out"
]);

const HELP = `Usage: node scripts/recursive-issue-scout.mjs [options]

Find low-hanging issues recursively, dedupe against GitHub issues, and optionally
create guarded follow-up issues for bounty #743.

Options:
  --format markdown|json       Output format. Default: markdown
  --output <file>              Write the report to a file
  --limit <number>             Limit reported or created non-duplicate candidates
  --only <rule[,rule]>         Only include specific rule ids
  --include-duplicates         Include candidates that appear to duplicate issues
  --existing-issues-json <f>   Read issue list JSON instead of calling gh
  --no-refresh-existing        Skip GitHub issue refresh
  --repo <owner/repo>          GitHub repo for issue refresh/create.
                              Defaults to upstream remote, then origin.
  --root <path>                Repository root. Default: current directory
  --create --confirm           Create non-duplicate GitHub issues via gh
  --help                       Show this help
`;

const args = parseArgs(process.argv.slice(2));

if (args.help) {
  process.stdout.write(HELP);
  process.exit(0);
}

const root = path.resolve(args.root ?? process.cwd());
const repo = args.repo ?? detectRepo(root);
const files = collectTextFiles(root);
const discovered = sortCandidates([
  ...findJwtDefaultSecret(files),
  ...findMemoryUploadWithoutLimits(files),
  ...findUnauthenticatedMutationRoutes(files),
  ...findPaymentStub(files),
  ...findDirectoryTestScript(files),
  ...findTodoClusters(files)
]);

const selectedRuleIds = args.only
  ? new Set(
      args.only
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    )
  : null;
const filteredByRule = selectedRuleIds
  ? discovered.filter((candidate) => selectedRuleIds.has(candidate.ruleId))
  : discovered;
const existingIssues = loadExistingIssues({ root, repo, args });
const deduped = markDuplicates(filteredByRule, existingIssues);
const reportCandidates = args.includeDuplicates
  ? deduped
  : deduped.filter((candidate) => !candidate.duplicateOf);
const limited = args.limit ? reportCandidates.slice(0, Number(args.limit)) : reportCandidates;

if (args.create) {
  createIssues({ candidates: limited, repo, args });
}

const report =
  args.format === "json"
    ? JSON.stringify(
        {
          repo,
          generatedAt: new Date().toISOString(),
          creatorOnlyText: CREATOR_ONLY_TEXT,
          candidateCount: deduped.length,
          nonDuplicateCount: deduped.filter((candidate) => !candidate.duplicateOf).length,
          duplicateCount: deduped.filter((candidate) => candidate.duplicateOf).length,
          candidates: limited
        },
        null,
        2
      )
    : renderMarkdown({ repo, candidates: limited, allCandidates: deduped, existingIssues });

if (args.output) {
  fs.writeFileSync(path.resolve(root, args.output), `${report}\n`);
} else {
  process.stdout.write(`${report}\n`);
}

function parseArgs(argv) {
  const parsed = {
    confirm: false,
    create: false,
    format: "markdown",
    help: false,
    includeDuplicates: false,
    noRefreshExisting: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    switch (current) {
      case "--confirm":
        parsed.confirm = true;
        break;
      case "--create":
        parsed.create = true;
        break;
      case "--format":
        parsed.format = requireValue(argv, ++index, current);
        break;
      case "--help":
        parsed.help = true;
        break;
      case "--include-duplicates":
        parsed.includeDuplicates = true;
        break;
      case "--limit":
        parsed.limit = requireValue(argv, ++index, current);
        break;
      case "--only":
        parsed.only = requireValue(argv, ++index, current);
        break;
      case "--existing-issues-json":
        parsed.existingIssuesJson = requireValue(argv, ++index, current);
        break;
      case "--no-refresh-existing":
        parsed.noRefreshExisting = true;
        break;
      case "--output":
        parsed.output = requireValue(argv, ++index, current);
        break;
      case "--repo":
        parsed.repo = requireValue(argv, ++index, current);
        break;
      case "--root":
        parsed.root = requireValue(argv, ++index, current);
        break;
      default:
        throw new Error(`Unknown option: ${current}\n\n${HELP}`);
    }
  }

  if (!["json", "markdown"].includes(parsed.format)) {
    throw new Error("--format must be either markdown or json");
  }
  if (parsed.limit && (!Number.isInteger(Number(parsed.limit)) || Number(parsed.limit) < 1)) {
    throw new Error("--limit must be a positive integer");
  }

  return parsed;
}

function requireValue(argv, index, flag) {
  const value = argv[index];
  if (!value || value.startsWith("--")) {
    throw new Error(`${flag} requires a value`);
  }
  return value;
}

function detectRepo(rootDir) {
  for (const remoteName of ["upstream", "origin"]) {
    const remote = run("git", ["remote", "get-url", remoteName], rootDir, { allowFailure: true });
    if (!remote.ok) {
      continue;
    }
    const detected = parseGitHubRemote(remote.stdout.trim());
    if (detected) {
      return detected;
    }
  }

  return null;
}

function parseGitHubRemote(value) {
  const match = value.match(/github\.com[:/](?<owner>[^/]+)\/(?<repo>[^/.]+)(?:\.git)?$/u);
  return match?.groups ? `${match.groups.owner}/${match.groups.repo}` : null;
}

function collectTextFiles(rootDir) {
  const collected = [];

  for (const target of DEFAULT_SCAN_TARGETS) {
    const absolute = path.join(rootDir, target);
    if (!fs.existsSync(absolute)) {
      continue;
    }
    const stat = fs.statSync(absolute);
    if (stat.isDirectory()) {
      walk(absolute);
    } else if (isTextFile(absolute)) {
      addFile(absolute);
    }
  }

  return collected;

  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (!SKIPPED_DIRS.has(entry.name)) {
          walk(path.join(dir, entry.name));
        }
        continue;
      }
      const absolute = path.join(dir, entry.name);
      if (entry.isFile() && isTextFile(absolute)) {
        addFile(absolute);
      }
    }
  }

  function addFile(absolute) {
    if (absolute.endsWith("package-lock.json")) {
      return;
    }
    const text = fs.readFileSync(absolute, "utf8");
    collected.push({
      absolute,
      relative: path.relative(rootDir, absolute).split(path.sep).join("/"),
      text,
      lines: text.split(/\r?\n/u)
    });
  }
}

function isTextFile(filePath) {
  return TEXT_EXTENSIONS.has(path.extname(filePath));
}

function findJwtDefaultSecret(filesToScan) {
  return filesToScan.flatMap((file) => {
    const matches = findLines(file, (line) => /JWT_SECRET\s*\?\?\s*["']development-secret["']/u.test(line));
    if (matches.length === 0) {
      return [];
    }
    return [
      candidate({
        ruleId: "jwt-default-secret",
        title: "Production can silently reuse the development JWT signing secret",
        severity: "high",
        confidence: "high",
        impact:
          "A production deploy that forgets JWT_SECRET would keep accepting tokens signed with a predictable public fallback value.",
        problem:
          "The environment config falls back to `development-secret` whenever JWT_SECRET is missing. That is convenient locally, but risky outside development because startup succeeds with a known signing key.",
        suggestedFix:
          "Keep a local-only fallback, but throw during startup when NODE_ENV is production and JWT_SECRET is missing or still set to the development value.",
        whyLowHanging:
          "The fix is isolated to env validation and can be covered with a small unit test for development versus production configuration.",
        evidence: matches,
        duplicateSignals: ["development-secret", "jwt secret", "jwt_secret", "signing secret", "production secret"],
        duplicateThreshold: 2
      })
    ];
  });
}

function findMemoryUploadWithoutLimits(filesToScan) {
  return filesToScan.flatMap((file) => {
    if (!file.text.includes("multer.memoryStorage")) {
      return [];
    }
    const uploadConfigWindow = file.text.slice(
      Math.max(0, file.text.indexOf("multer(") - 120),
      file.text.indexOf("multer.memoryStorage") + 220
    );
    if (/limits\s*:/u.test(uploadConfigWindow)) {
      return [];
    }
    return [
      candidate({
        ruleId: "upload-memory-limit",
        title: "File uploads use memory storage without size limits",
        severity: "high",
        confidence: "high",
        impact:
          "Large uploads can be buffered entirely in memory, which may exhaust API worker memory before controllers can reject the request.",
        problem:
          "The upload route uses Multer memory storage without a configured file size limit.",
        suggestedFix:
          "Add a conservative `limits.fileSize` value to the Multer config and return a clear 413 response when the upload is too large.",
        whyLowHanging:
          "The vulnerable surface is one route-level Multer configuration and can be validated with a focused upload test.",
        evidence: findLines(file, (line) => line.includes("multer.memoryStorage")),
        duplicateSignals: ["multer", "memory storage", "file upload", "upload limit", "size limit"],
        duplicateThreshold: 2
      })
    ];
  });
}

function findUnauthenticatedMutationRoutes(filesToScan) {
  const routeFindings = [];

  for (const file of filesToScan) {
    if (!/^apps\/api\/src\/routes\/.+Routes\.js$/u.test(file.relative)) {
      continue;
    }
    if (file.relative.endsWith("/authRoutes.js")) {
      continue;
    }
    const mutationLines = findLines(file, (line) => /\.(post|put|patch|delete)\s*\(/u.test(line));
    if (mutationLines.length === 0) {
      continue;
    }
    if (/authMiddleware/u.test(file.text)) {
      continue;
    }
    routeFindings.push(...mutationLines);
  }

  if (routeFindings.length === 0) {
    return [];
  }

  return [
    candidate({
      ruleId: "unauthenticated-mutation-routes",
      title: "Mutation routes can be reached without auth middleware",
      severity: "high",
      confidence: "medium",
      impact:
        "Unauthenticated users may be able to create or mutate marketplace resources such as jobs, proposals, reviews, messages, notifications, payments, and uploads.",
      problem:
        "Several API route modules expose POST, PUT, PATCH, or DELETE handlers without importing or applying the shared auth middleware.",
      suggestedFix:
        "Apply `authMiddleware` to private mutation route groups while keeping intentionally public auth/search/read endpoints explicit.",
      whyLowHanging:
        "The route files already use a shared Express router pattern, so the fix can be applied and tested route-by-route.",
      evidence: routeFindings.slice(0, 12),
      duplicateSignals: [
        "auth middleware",
        "mutating api routes",
        "write endpoints",
        "non-auth api routers",
        "unauthenticated",
        "mutation routes",
        "post routes",
        "private route"
      ],
      duplicateThreshold: 2
    })
  ];
}

function findPaymentStub(filesToScan) {
  return filesToScan.flatMap((file) => {
    if (!/paymentService\.js$/u.test(file.relative)) {
      return [];
    }
    const matches = [
      ...findLines(file, (line) => /TODO: integrate Stripe SDK/u.test(line)),
      ...findLines(file, (line) => /pay_\$\{Date\.now\(\)\}/u.test(line))
    ];
    if (matches.length === 0) {
      return [];
    }
    return [
      candidate({
        ruleId: "payment-stub",
        title: "Payment intent service returns local stub IDs instead of Stripe client secrets",
        severity: "medium",
        confidence: "high",
        impact:
          "Billing flows can look successful locally while never creating a Stripe PaymentIntent or returning the client secret the frontend needs.",
        problem:
          "The payment service still returns a timestamp-based local payment id and has a TODO for Stripe integration.",
        suggestedFix:
          "Create Stripe PaymentIntents with the configured Stripe secret key, validate supported currencies, and return the provider client secret.",
        whyLowHanging:
          "The placeholder is isolated to the payment service and controller response contract.",
        evidence: matches,
        duplicateSignals: ["payment", "stripe", "client secret", "payment intent", "stub"],
        duplicateThreshold: 2
      })
    ];
  });
}

function findDirectoryTestScript(filesToScan) {
  return filesToScan.flatMap((file) => {
    if (file.relative !== "apps/api/package.json") {
      return [];
    }
    const matches = findLines(file, (line) => /"test":\s*"node --test src\/tests"/u.test(line));
    if (matches.length === 0) {
      return [];
    }
    return [
      candidate({
        ruleId: "api-directory-test-script",
        title: "API test script points node --test at a directory",
        severity: "medium",
        confidence: "high",
        impact:
          "The documented `npm run test` path can fail before running health tests because Node's test runner expects files or globs, not this directory target.",
        problem:
          "The API package test script invokes `node --test src/tests`, which can error with EISDIR instead of running `src/tests/health.test.js`.",
        suggestedFix:
          "Point the script at an explicit test glob such as `src/tests/*.test.js`.",
        whyLowHanging:
          "The change is a one-line package script update and is validated by running the existing health test.",
        evidence: matches,
        duplicateSignals: ["node --test", "src/tests", "test script", "health.test"],
        duplicateThreshold: 2
      })
    ];
  });
}

function findTodoClusters(filesToScan) {
  const todoEvidence = [];
  for (const file of filesToScan) {
    if (!file.relative.startsWith("apps/api/src/")) {
      continue;
    }
    todoEvidence.push(...findLines(file, (line) => /\bTODO\b/u.test(line)));
  }

  if (todoEvidence.length < 4) {
    return [];
  }

  return [
    candidate({
      ruleId: "api-service-placeholder-cluster",
      title: "Core API services still rely on placeholder TODO implementations",
      severity: "medium",
      confidence: "medium",
      impact:
        "Major API flows can report successful responses while persistence, authentication verification, search, payments, or database wiring are not implemented.",
      problem:
        "Multiple backend services contain TODO placeholders in production request paths.",
      suggestedFix:
        "Replace one placeholder flow at a time with real persistence/provider wiring and regression tests that prove the flow no longer returns mock success data.",
      whyLowHanging:
        "The scanner groups the TODOs so contributors can carve focused follow-up issues from concrete source locations.",
      evidence: todoEvidence.slice(0, 12),
      duplicateSignals: ["todo", "placeholder", "auth service", "database", "search service"],
      duplicateThreshold: 3
    })
  ];
}

function candidate(fields) {
  return {
    category: "low-hanging-fruit",
    ...fields
  };
}

function findLines(file, predicate) {
  return file.lines.flatMap((line, index) =>
    predicate(line)
      ? [
          {
            file: file.relative,
            line: index + 1,
            excerpt: line.trim()
          }
        ]
      : []
  );
}

function sortCandidates(candidates) {
  const severityWeight = { high: 3, medium: 2, low: 1 };
  const confidenceWeight = { high: 3, medium: 2, low: 1 };
  return candidates.sort((left, right) => {
    const severityDelta = severityWeight[right.severity] - severityWeight[left.severity];
    if (severityDelta !== 0) {
      return severityDelta;
    }
    return confidenceWeight[right.confidence] - confidenceWeight[left.confidence];
  });
}

function loadExistingIssues({ root: rootDir, repo: repoName, args: options }) {
  if (options.existingIssuesJson) {
    return JSON.parse(fs.readFileSync(path.resolve(rootDir, options.existingIssuesJson), "utf8"));
  }
  if (options.noRefreshExisting || !repoName) {
    return [];
  }

  const issueList = run(
    "gh",
    ["issue", "list", "--repo", repoName, "--state", "all", "--limit", "200", "--json", "number,title,body,url"],
    rootDir,
    { allowFailure: true }
  );
  if (!issueList.ok) {
    return [];
  }
  return JSON.parse(issueList.stdout || "[]");
}

function markDuplicates(candidates, existingIssues) {
  return candidates.map((current) => {
    const duplicateOf = existingIssues.find((issue) => isDuplicate(current, issue));
    return duplicateOf
      ? {
          ...current,
          duplicateOf: {
            number: duplicateOf.number,
            title: duplicateOf.title,
            url: duplicateOf.url
          }
        }
      : current;
  });
}

function isDuplicate(current, issue) {
  const title = issue.title ?? "";
  const body = issue.body ?? "";
  const rawHaystack = `${title}\n${body}`.toLowerCase();
  const normalizedHaystack = normalize(`${title}\n${body}`);

  if (rawHaystack.includes(current.ruleId.toLowerCase())) {
    return true;
  }

  let hits = 0;
  for (const signal of current.duplicateSignals) {
    const rawSignal = signal.toLowerCase();
    const normalizedSignal = normalize(signal);
    if (rawHaystack.includes(rawSignal) || normalizedHaystack.includes(normalizedSignal)) {
      hits += 1;
    }
  }
  return hits >= current.duplicateThreshold;
}

function normalize(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/gu, " ").replace(/\s+/gu, " ").trim();
}

function renderMarkdown({ repo, candidates, allCandidates, existingIssues }) {
  const duplicateCount = allCandidates.filter((candidate) => candidate.duplicateOf).length;
  const lines = [
    "# Recursive Low-Hanging-Fruit Issue Scout",
    "",
    `Repository: ${repo ?? "unknown"}`,
    `Generated: ${new Date().toISOString()}`,
    `Existing issues checked: ${existingIssues.length}`,
    `Candidates found: ${allCandidates.length}`,
    `Duplicates filtered: ${duplicateCount}`,
    `Report candidates: ${candidates.length}`,
    ""
  ];

  if (candidates.length === 0) {
    lines.push("No non-duplicate candidates matched the current filters.");
    return lines.join("\n");
  }

  candidates.forEach((current, index) => {
    lines.push(`## ${index + 1}. ${current.title}`);
    lines.push("");
    lines.push(`- Rule: \`${current.ruleId}\``);
    lines.push(`- Severity: ${current.severity}`);
    lines.push(`- Confidence: ${current.confidence}`);
    if (current.duplicateOf) {
      lines.push(`- Duplicate of: #${current.duplicateOf.number} ${current.duplicateOf.url}`);
    }
    lines.push(`- Impact: ${current.impact}`);
    lines.push(`- Suggested fix: ${current.suggestedFix}`);
    lines.push(`- Why low-hanging: ${current.whyLowHanging}`);
    lines.push("- Evidence:");
    for (const item of current.evidence) {
      lines.push(`  - \`${item.file}:${item.line}\` ${inlineCode(item.excerpt)}`);
    }
    lines.push("");
  });

  return lines.join("\n");
}

function inlineCode(value) {
  return `\`${value.replaceAll("`", "'")}\``;
}

function createIssues({ candidates, repo: repoName, args: options }) {
  if (!repoName) {
    throw new Error("--create requires a detectable GitHub repo or --repo owner/repo");
  }
  if (!options.confirm) {
    throw new Error("--create is guarded. Re-run with --create --confirm after reviewing the report.");
  }
  if (candidates.length === 0) {
    process.stderr.write("No non-duplicate candidates to create.\n");
    return;
  }

  for (const current of candidates) {
    if (current.duplicateOf) {
      continue;
    }
    const body = renderIssueBody(current);
    const created = run("gh", ["issue", "create", "--repo", repoName, "--title", current.title, "--body", body], root);
    current.createdUrl = created.stdout.trim();
    process.stderr.write(`Created issue for ${current.ruleId}: ${current.createdUrl}\n`);
  }
}

function renderIssueBody(current) {
  const evidence = current.evidence
    .map((item) => `- \`${item.file}:${item.line}\` ${inlineCode(item.excerpt)}`)
    .join("\n");

  return `${CREATOR_ONLY_TEXT}

## Problem
${current.problem}

## Impact
${current.impact}

## Evidence
${evidence}

## Suggested fix
${current.suggestedFix}

## Why this is low-hanging fruit
${current.whyLowHanging}

## Discovery
Generated by \`npm run audit:recursive-issues\` for #743. Rule id: \`${current.ruleId}\`.`;
}

function run(command, commandArgs, cwd, options = {}) {
  const result = spawnSync(command, commandArgs, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });
  const ok = result.status === 0;
  if (!ok && !options.allowFailure) {
    throw new Error(`${command} ${commandArgs.join(" ")} failed\n${result.stderr}`);
  }
  return {
    ok,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    status: result.status
  };
}
