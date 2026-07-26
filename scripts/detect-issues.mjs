#!/usr/bin/env node
import { readFileSync, readdirSync, statSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const REPO_NAME = process.env.GITHUB_REPOSITORY || "bug-bounty/bug-bounty";
const DEFAULT_BRANCH = process.env.GITHUB_DEFAULT_BRANCH || "main";
const ISSUE_REFERENCE = "Automate Bug Detection and Reviews #11398";
const CREATOR_RESTRICTION =
  "This issue is limited only to the creator of this issue. This means that only the issue author can attempt to solve this issue. If you would like to work on it, please create another issue with the same contents and refer to issue " +
  ISSUE_REFERENCE +
  " for more information.";

const EXCLUDE_DIRS = new Set(["node_modules", ".next", "dist", "coverage", ".git"]);
const EXCLUDE_PATHS = [resolve(ROOT, "scripts"), resolve(ROOT, "apps/api/src/tests")];

function walk(dir) {
  const entries = [];
  try {
    for (const name of readdirSync(dir)) {
      if (EXCLUDE_DIRS.has(name)) continue;
      const full = join(dir, name);
      if (EXCLUDE_PATHS.some((p) => full.startsWith(p))) continue;
      if (statSync(full).isDirectory()) {
        entries.push(...walk(full));
      } else if (/\.(js|ts|tsx|jsx|mjs)$/.test(name)) {
        entries.push(full);
      }
    }
  } catch {
  }
  return entries;
}

function readSource(file) {
  try {
    return readFileSync(file, "utf-8");
  } catch {
    return "";
  }
}

function createDetector(name, description, severity, check) {
  return { name, description, severity, check };
}

const DETECTORS = [
  createDetector(
    "zod-parse-without-try-catch",
    "Zod `.parse()` is called without try-catch. On validation failure Zod throws a ZodError that produces a 500 instead of a 400 with proper error details. Use `.safeParse()` or wrap in try-catch.",
    "high",
    (file, src) => {
      const issues = [];
      const lines = src.split("\n");
      for (let i = 0; i < lines.length; i++) {
        if (/\.parse\(/.test(lines[i]) && !/try\s*\{/.test(lines.slice(Math.max(0, i - 3), i + 1).join("\n"))) {
          issues.push({ line: i + 1, match: lines[i].trim() });
        }
      }
      return issues;
    }
  ),

  createDetector(
    "hardcoded-jwt-secret",
    "JWT secret is hardcoded with a fallback default. In production without JWT_SECRET env var, a weak well-known secret is used, allowing token forgery.",
    "critical",
    (file, src) => {
      const issues = [];
      if (/jwtSecret.*\?\?.*["']/.test(src)) {
        const lines = src.split("\n");
        for (let i = 0; i < lines.length; i++) {
          if (/jwtSecret.*\?\?/.test(lines[i])) {
            issues.push({ line: i + 1, match: lines[i].trim() });
          }
        }
      }
      return issues;
    }
  ),

  createDetector(
    "in-memory-array-storage",
    "Service uses in-memory array for data storage. Data is lost on server restart, not thread-safe, and cannot scale. Use a database instead.",
    "high",
    (file, src) => {
      const issues = [];
      if (/^(const|let|var)\s+\w+\s*=\s*\[\s*\]\s*;?\s*$/m.test(src)) {
        const lines = src.split("\n");
        for (let i = 0; i < lines.length; i++) {
          if (/^(const|let|var)\s+\w+\s*=\s*\[\s*\]\s*;?\s*$/.test(lines[i])) {
            issues.push({ line: i + 1, match: lines[i].trim() });
          }
        }
      }
      return issues;
    }
  ),

  createDetector(
    "params-not-awaited-nextjs",
    "In Next.js App Router (14+), `params` should be awaited. Direct synchronous access may break in future versions.",
    "medium",
    (file, src) => {
      const issues = [];
      const lines = src.split("\n");
      for (let i = 0; i < lines.length; i++) {
        if (/\{\s*params\s*\}.*:/.test(lines[i]) && !src.includes("await params") && /\.tsx?$/.test(file)) {
          issues.push({ line: i + 1, match: lines[i].trim() });
        }
      }
      return issues;
    }
  ),

  createDetector(
    "unhandled-zod-error-in-router",
    "Zod validation error not caught in Express route. Controllers call `.parse()` which throws on invalid input, and the error handler does not distinguish ZodError from other errors.",
    "high",
    (file, src) => {
      const issues = [];
      const lines = src.split("\n");
      for (let i = 0; i < lines.length; i++) {
        if (/Schema\.parse\(/.test(lines[i])) {
          let hasCatch = false;
          for (let j = Math.max(0, i - 5); j < Math.min(lines.length, i + 3); j++) {
            if (/try|catch|safeParse/.test(lines[j])) hasCatch = true;
          }
          if (!hasCatch) {
            issues.push({ line: i + 1, match: lines[i].trim() });
          }
        }
      }
      return issues;
    }
  ),

  createDetector(
    "todo-comment",
    "TODO comment indicates incomplete or placeholder functionality that should be addressed.",
    "low",
    (file, src) => {
      const issues = [];
      const lines = src.split("\n");
      for (let i = 0; i < lines.length; i++) {
        if (/\bTODO\b/i.test(lines[i])) {
          issues.push({ line: i + 1, match: lines[i].trim() });
        }
      }
      return issues;
    }
  ),

  createDetector(
    "weak-cors-config",
    "CORS is configured without explicit origin restrictions. In production, this allows any website to make cross-origin requests to the API.",
    "medium",
    (file, src) => {
      const issues = [];
      const lines = src.split("\n");
      for (let i = 0; i < lines.length; i++) {
        if (/cors\(\)/.test(lines[i]) || /app\.use\(cors\)/.test(lines[i])) {
          issues.push({ line: i + 1, match: lines[i].trim() });
        }
      }
      return issues;
    }
  ),

  createDetector(
    "default-development-secret-exposed",
    "A hardcoded development fallback secret is used. If accidentally deployed, an attacker can forge tokens trivially.",
    "critical",
    (file, src) => {
      const issues = [];
      if (/development-secret/.test(src)) {
        const lines = src.split("\n");
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes("development-secret")) {
            issues.push({ line: i + 1, match: lines[i].trim() });
          }
        }
      }
      return issues;
    }
  ),
];

export function scanRepository(rootDir = ROOT) {
  const files = walk(rootDir);
  const findings = [];

  for (const file of files) {
    const src = readSource(file);
    if (!src.trim()) continue;

    const relPath = relative(rootDir, file).replace(/\\/g, "/");

    for (const detector of DETECTORS) {
      try {
        const matches = detector.check(file, src);
        if (matches.length > 0) {
          for (const match of matches) {
            findings.push({
              detector: detector.name,
              severity: detector.severity,
              description: detector.description,
              file: relPath,
              line: match.line,
              match: match.match,
            });
          }
        }
      } catch {
      }
    }
  }

  return findings;
}

export function groupByDetector(findings) {
  const grouped = {};
  for (const f of findings) {
    if (!grouped[f.detector]) grouped[f.detector] = [];
    grouped[f.detector].push(f);
  }
  return grouped;
}

export function generateMarkdownReport(findings) {
  if (findings.length === 0) return "No issues detected.\n";

  const grouped = groupByDetector(findings);
  const parts = [];
  parts.push("# Automated Bug Detection Report\n");
  parts.push(`Generated: ${new Date().toISOString()}\n`);
  parts.push(`Repository: ${REPO_NAME}\n`);
  parts.push(`Total findings: ${findings.length}\n`);
  parts.push(`\n> Auto-generated by the automated bug detection system.\n`);

  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  const sortedDetectors = Object.entries(grouped).sort(
    (a, b) => severityOrder[a[1][0].severity] - severityOrder[b[1][0].severity]
  );

  for (const [detectorName, items] of sortedDetectors) {
    const { severity, description } = items[0];
    parts.push(`\n---\n`);
    parts.push(`## ${detectorName}\n`);
    parts.push(`**Severity:** ${severity}\n`);
    parts.push(`**Description:** ${description}\n`);
    parts.push(`\n### Affected Locations\n`);

    for (const item of items) {
      parts.push(`- \`${item.file}:${item.line}\` — ${item.match}`);
    }
    parts.push("");
  }

  return parts.join("\n");
}

export function generateGitHubIssues(findings, options = {}) {
  const { dryRun = true, label = "bug" } = options;
  const grouped = groupByDetector(findings);
  const issues = [];

  for (const [detectorName, items] of Object.entries(grouped)) {
    const { severity, description } = items[0];
    const title = `[Auto] ${detectorName}: ${description.split(".")[0]}`;

    const bodyParts = [];
    bodyParts.push(`## Automated Bug Report\n`);
    bodyParts.push(`**Detector:** ${detectorName}\n`);
    bodyParts.push(`**Severity:** ${severity}\n`);
    bodyParts.push(`**Description:** ${description}\n`);
    bodyParts.push(`\n---\n`);
    bodyParts.push(`### Affected Files\n`);

    for (const item of items) {
      bodyParts.push(`- \`${item.file}:${item.line}\``);
    }

    bodyParts.push("");
    bodyParts.push("\n---\n");
    bodyParts.push(CREATOR_RESTRICTION);
    bodyParts.push("");

    issues.push({
      title,
      body: bodyParts.join("\n"),
      labels: [label, severity, "automated"],
    });
  }

  return issues;
}

export async function createGitHubIssues(issues, options = {}) {
  const { token = process.env.GITHUB_TOKEN, repo = REPO_NAME, dryRun = false } = options;

  if (!token) {
    console.error("GITHUB_TOKEN not set. Set GITHUB_TOKEN environment variable or pass token option.");
    return { created: 0, errors: ["No token"] };
  }

  const results = { created: 0, errors: [] };

  for (const issue of issues) {
    if (dryRun) {
      console.log(`[DRY RUN] Would create issue: ${issue.title}`);
      results.created++;
      continue;
    }

    try {
      const response = await fetch(`https://api.github.com/repos/${repo}/issues`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "bug-detector-script",
        },
        body: JSON.stringify({
          title: issue.title,
          body: issue.body,
          labels: issue.labels,
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        results.errors.push(`Failed to create issue "${issue.title}": ${err}`);
        console.error(`GitHub API error: ${response.status} ${err}`);
      } else {
        const data = await response.json();
        console.log(`Created issue #${data.number}: ${data.html_url}`);
        results.created++;
      }
    } catch (err) {
      results.errors.push(`Error creating issue "${issue.title}": ${err.message}`);
      console.error(err);
    }
  }

  return results;
}

function main() {
  const args = process.argv.slice(2);
  const shouldCreateIssues = args.includes("--create-issues");
  const dryRun = args.includes("--dry-run") || !shouldCreateIssues;
  const outputJson = args.includes("--json");

  console.log(`Scanning repository: ${ROOT}\n`);

  const findings = scanRepository(ROOT);
  console.log(`Found ${findings.length} potential issues.\n`);

  if (outputJson) {
    const outDir = join(ROOT, "scripts");
    if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
    const outPath = join(outDir, "detect-results.json");
    writeFileSync(outPath, JSON.stringify({ findings, generatedAt: new Date().toISOString() }, null, 2));
    console.log(`JSON report written to ${outPath}\n`);
  }

  const markdown = generateMarkdownReport(findings);

  if (!outputJson) {
    console.log(markdown);
  }

  const outDir = join(ROOT, "scripts");
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  const mdPath = join(outDir, "detect-results.md");
  writeFileSync(mdPath, markdown);
  console.log(`\nMarkdown report written to ${mdPath}`);

  if (shouldCreateIssues) {
    const issues = generateGitHubIssues(findings, { dryRun });
    console.log(`\nGenerated ${issues.length} issues for GitHub.`);

    if (dryRun) {
      console.log("\n--- Issue Preview ---");
      for (const issue of issues) {
        console.log(`\n## ${issue.title}`);
        console.log(issue.body.substring(0, 300) + "...");
      }
      console.log("\nRun with --create-issues and set GITHUB_TOKEN to actually create them.");
      console.log("Or run without --dry-run to create issues.");
    }
  }

  return findings.length;
}

const isMain = process.argv[1] && (process.argv[1].endsWith("detect-issues.mjs") || process.argv[1].endsWith("detect-issues"));
if (isMain) {
  process.exit(main() > 0 ? 0 : 0);
}
