#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const ISSUE_LIMITATION_NOTICE =
  "This issue is limited only to the creator of this issue. This means that only the issue author can attempt to solve this issue. If you would like to work on it, please create another issue with the same contents and refer to issue #743 for more information.";

const repoRoot = process.cwd();
const maxResults = Number.parseInt(
  getArgValue("--limit") ?? process.env.LOW_FRUIT_LIMIT ?? "12",
  10
);
const jsonMode = process.argv.includes("--json");
const createMode = process.argv.includes("--create");
const dryRunCreateMode = process.argv.includes("--create-dry-run");
const githubRepo = getArgValue("--repo") ?? process.env.LOW_FRUIT_GITHUB_REPO;
const githubToken = process.env.LOW_FRUIT_GITHUB_TOKEN ?? process.env.GITHUB_TOKEN;

const ignoredDirs = new Set([
  ".git",
  ".next",
  "coverage",
  "dist",
  "node_modules",
  "out"
]);

const sourceExtensions = new Set([
  ".cjs",
  ".css",
  ".js",
  ".jsx",
  ".json",
  ".md",
  ".mjs",
  ".prisma",
  ".ts",
  ".tsx"
]);

const lowFruitPatterns = [
  {
    id: "todo",
    severity: "medium",
    regex: /(?:\/\/|#|<!--|\/\*|\*)\s*\b(TODO|FIXME|HACK)\b[:\s-]*(.+)?/i,
    title: (match, file) => `Resolve ${match[1].toUpperCase()} in ${file}`,
    summary: (match) =>
      (match[2] ?? "A placeholder comment is still present.").trim()
  },
  {
    id: "placeholder",
    severity: "medium",
    regex: /\b(placeholder|stub|mock only|not implemented|wire .* later)\b/i,
    title: (_match, file) => `Replace placeholder implementation in ${file}`,
    summary: () =>
      "The file contains placeholder language that can hide incomplete production behavior."
  },
  {
    id: "missing-error-handling",
    severity: "low",
    regex: /catch\s*\([^)]*\)\s*{\s*}/,
    title: (_match, file) => `Handle empty catch block in ${file}`,
    summary: () =>
      "An empty catch block can hide failures and make debugging production issues harder."
  }
];

const scannerSupportFiles = new Set([
  "docs/low-hanging-fruit.md",
  "scripts/low-hanging-fruit.mjs"
]);

const candidates = [];

for (const filePath of walk(repoRoot)) {
  const relativePath = toRepoPath(path.relative(repoRoot, filePath));
  if (scannerSupportFiles.has(relativePath)) {
    continue;
  }

  const text = fs.readFileSync(filePath, "utf8");
  scanTextPatterns(relativePath, text);
}

scanPackageScripts();
scanApiRouteTests();

const ranked = candidates
  .sort((a, b) => scoreCandidate(b) - scoreCandidate(a))
  .slice(0, Number.isFinite(maxResults) && maxResults > 0 ? maxResults : 12)
  .map((candidate, index) => ({
    rank: index + 1,
    ...candidate,
    issueDraft: buildIssueDraft(candidate)
  }));

if (createMode || dryRunCreateMode) {
  await createIssueDrafts(ranked, { dryRun: dryRunCreateMode });
} else if (jsonMode) {
  console.log(JSON.stringify({ issueLimitationNotice: ISSUE_LIMITATION_NOTICE, candidates: ranked }, null, 2));
} else {
  printMarkdown(ranked);
}

function getArgValue(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function* walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!ignoredDirs.has(entry.name)) {
        yield* walk(path.join(directory, entry.name));
      }
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    const filePath = path.join(directory, entry.name);
    if (sourceExtensions.has(path.extname(entry.name))) {
      yield filePath;
    }
  }
}

function scanTextPatterns(relativePath, text) {
  const lines = text.split(/\r?\n/);
  for (const [lineIndex, line] of lines.entries()) {
    for (const pattern of lowFruitPatterns) {
      if (pattern.id === "placeholder" && path.extname(relativePath) === ".md") {
        continue;
      }

      const match = line.match(pattern.regex);
      if (!match) {
        continue;
      }

      candidates.push({
        type: pattern.id,
        severity: pattern.severity,
        title: pattern.title(match, relativePath),
        file: relativePath,
        line: lineIndex + 1,
        summary: pattern.summary(match, line),
        evidence: line.trim(),
        suggestedFix:
          "Replace the incomplete path with a focused implementation and add a regression check where practical."
      });
    }
  }
}

function scanPackageScripts() {
  for (const packagePath of findPackageManifests(repoRoot)) {
    const relativePath = toRepoPath(path.relative(repoRoot, packagePath));
    const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));

    for (const [scriptName, command] of Object.entries(packageJson.scripts ?? {})) {
      if (/^echo\s+/i.test(command)) {
        candidates.push({
          type: "placeholder-script",
          severity: "low",
          title: `Replace placeholder npm script "${scriptName}"`,
          file: relativePath,
          line: findLine(packagePath, `"${scriptName}"`),
          summary: `The "${scriptName}" script only echoes text instead of running a real check.`,
          evidence: `"${scriptName}": "${command}"`,
          suggestedFix:
            "Wire the script to the package-specific command it describes, or document why the root script must remain informational."
        });
      }

      const fragileNodeTest = command.match(/^node\s+--test\s+([^*]+\btests?)$/);
      if (fragileNodeTest) {
        candidates.push({
          type: "fragile-test-script",
          severity: "medium",
          title: `Make npm script "${scriptName}" target test files explicitly`,
          file: relativePath,
          line: findLine(packagePath, `"${scriptName}"`),
          summary: `The "${scriptName}" script points node --test at a directory, which can fail in environments that do not expand directories into test files.`,
          evidence: `"${scriptName}": "${command}"`,
          suggestedFix:
            "Point node --test at an explicit glob such as src/tests/*.test.js and verify the workspace test command still passes."
        });
      }
    }
  }
}

function* findPackageManifests(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!ignoredDirs.has(entry.name)) {
        yield* findPackageManifests(path.join(directory, entry.name));
      }
      continue;
    }

    if (entry.isFile() && entry.name === "package.json") {
      yield path.join(directory, entry.name);
    }
  }
}

function scanApiRouteTests() {
  const routesDir = path.join(repoRoot, "apps", "api", "src", "routes");
  const testsDir = path.join(repoRoot, "apps", "api", "src", "tests");
  const appFile = path.join(repoRoot, "apps", "api", "src", "app.js");
  if (!fs.existsSync(routesDir) || !fs.existsSync(testsDir) || !fs.existsSync(appFile)) {
    return;
  }

  const routeNames = fs
    .readdirSync(routesDir)
    .filter((file) => file.endsWith("Routes.js"))
    .map((file) => file.replace(/Routes\.js$/, ""));

  const testText = fs
    .readdirSync(testsDir)
    .filter((file) => file.endsWith(".test.js"))
    .map((file) => fs.readFileSync(path.join(testsDir, file), "utf8"))
    .join("\n");
  const appText = fs.readFileSync(appFile, "utf8");

  for (const routeName of routeNames) {
    const mountedPath = appText.match(
      new RegExp(`app\\.use\\(\\s*["']([^"']+)["']\\s*,\\s*${routeName}Routes\\s*\\)`)
    )?.[1];

    if (!mountedPath || routeName === "auth") {
      continue;
    }

    if (!testText.includes(mountedPath)) {
      const routeFile = `apps/api/src/routes/${routeName}Routes.js`;
      candidates.push({
        type: "route-test-gap",
        severity: "medium",
        title: `Add API route smoke coverage for ${mountedPath}`,
        file: routeFile,
        line: 1,
        summary: `The ${mountedPath} route is mounted in app.js, but no direct route smoke test references it.`,
        evidence: routeFile,
        suggestedFix:
          "Add a node:test coverage case that starts the Express app and asserts the route returns the expected status and JSON shape."
      });
    }
  }
}

function buildIssueDraft(candidate) {
  return [
    `## ${candidate.title}`,
    "",
    ISSUE_LIMITATION_NOTICE,
    "",
    "## Problem",
    candidate.summary,
    "",
    "## Evidence",
    `- File: \`${candidate.file}\``,
    `- Line: ${candidate.line}`,
    `- Signal: \`${candidate.evidence.replaceAll("`", "'")}\``,
    "",
    "## Suggested Fix",
    candidate.suggestedFix,
    "",
    "## Acceptance Criteria",
    "- The incomplete or weak path is replaced with focused behavior.",
    "- A relevant automated check or documented validation step is added.",
    "- The change remains scoped to this issue only."
  ].join("\n");
}

function printMarkdown(candidatesToPrint) {
  console.log("# Low-Hanging Fruit Issue Candidates");
  console.log("");
  console.log(`Generated ${new Date().toISOString()}`);
  console.log("");
  console.log("These are local drafts only. Review before posting to GitHub, or use --create with an explicit repo and token.");
  console.log("");

  for (const candidate of candidatesToPrint) {
    console.log(`## ${candidate.rank}. ${candidate.title}`);
    console.log("");
    console.log(`- Type: ${candidate.type}`);
    console.log(`- Severity: ${candidate.severity}`);
    console.log(`- Location: ${candidate.file}:${candidate.line}`);
    console.log(`- Evidence: \`${candidate.evidence.replaceAll("`", "'")}\``);
    console.log("");
    console.log("```markdown");
    console.log(candidate.issueDraft);
    console.log("```");
    console.log("");
  }
}

async function createIssueDrafts(candidatesToCreate, { dryRun }) {
  if (!githubRepo || !/^[^/\s]+\/[^/\s]+$/.test(githubRepo)) {
    throw new Error("Pass --repo owner/name or set LOW_FRUIT_GITHUB_REPO before creating issues.");
  }

  if (!dryRun && !githubToken) {
    throw new Error("Set LOW_FRUIT_GITHUB_TOKEN or GITHUB_TOKEN before using --create.");
  }

  const created = [];
  for (const candidate of candidatesToCreate) {
    const issue = {
      title: candidate.title,
      body: candidate.issueDraft
    };

    if (dryRun) {
      created.push({ ...issue, dryRun: true });
      continue;
    }

    const existing = await findExistingIssue(issue.title);
    if (existing) {
      created.push({
        title: issue.title,
        skipped: true,
        reason: "open issue with the same title already exists",
        url: existing.html_url
      });
      continue;
    }

    const response = await githubRequest(`/repos/${githubRepo}/issues`, {
      method: "POST",
      body: JSON.stringify(issue)
    });
    created.push({ title: issue.title, url: response.html_url });
  }

  console.log(JSON.stringify({ issueLimitationNotice: ISSUE_LIMITATION_NOTICE, repo: githubRepo, created }, null, 2));
}

async function findExistingIssue(title) {
  const query = encodeURIComponent(`repo:${githubRepo} is:issue is:open in:title "${title}"`);
  const result = await githubRequest(`/search/issues?q=${query}`);
  return result.items?.find((issue) => issue.title === title);
}

async function githubRequest(pathname, options = {}) {
  const response = await fetch(`https://api.github.com${pathname}`, {
    ...options,
    headers: {
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "User-Agent": "low-hanging-fruit-scanner",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(githubToken ? { Authorization: `Bearer ${githubToken}` } : {}),
      ...(options.headers ?? {})
    }
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};
  if (!response.ok) {
    throw new Error(`GitHub API ${response.status}: ${payload.message ?? text}`);
  }
  return payload;
}

function scoreCandidate(candidate) {
  const severityScore = { high: 30, medium: 20, low: 10 }[candidate.severity] ?? 0;
  const typeScore =
    {
      todo: 8,
      placeholder: 7,
      "route-test-gap": 6,
      "placeholder-script": 3,
      "missing-error-handling": 5
    }[candidate.type] ?? 0;

  return severityScore + typeScore;
}

function findLine(filePath, needle) {
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  const index = lines.findIndex((line) => line.includes(needle));
  return index >= 0 ? index + 1 : 1;
}

function toRepoPath(filePath) {
  return filePath.split(path.sep).join("/");
}
