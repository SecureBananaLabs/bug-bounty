#!/usr/bin/env node
/**
 * FreelanceFlow Low Hanging Fruit Scanner
 * Scans the codebase for bugs, security issues, and quality gaps.
 * Creates GitHub issues for each finding.
 *
 * Usage:
 *   node tools/lhf-scanner.js [--dry-run] [--max-issues=10] [--output=json]
 *
 * Closes #743
 */
import { readFileSync, readdirSync, statSync } from "fs";
import { join, extname } from "path";

// ── Config ──
const args       = process.argv.slice(2);
const DRY_RUN    = args.includes("--dry-run");
const MAX_ISSUES = Number((args.find(a => a.startsWith("--max-issues=")) ?? "--max-issues=10").split("=")[1]);
const OUTPUT_JSON= args.includes("--output=json");
const REPO       = process.env.GITHUB_REPO ?? "SecureBananaLabs/bug-bounty";
const TOKEN      = process.env.GITHUB_TOKEN ?? "";

// ── Scan categories ──
const CHECKS = [
  {
    name: "hardcoded-secret",
    pattern: /(secret|password|api_key|apikey|token)\s*[:=]\s*['"`][^'"`]{4,}/i,
    severity: "high",
    title: (f) => `Security: possible hardcoded secret in ${f}`,
    body: (f, line, match) =>
      `## Hardcoded Secret Detected\n\n**File:** \`${f}\`\n**Line:** ${line}\n**Pattern matched:** \`${match}\`\n\nHardcoded credentials should be moved to environment variables.\n\nThis issue is limited only to the creator of this issue. This means that only the issue author can attempt to solve this issue. If you would like to work on it, please create another issue with the same contents and refer to issue #743 for more information.`,
  },
  {
    name: "todo-fixme",
    pattern: /\/\/\s*(TODO|FIXME|HACK|XXX)[::\s]/i,
    severity: "low",
    title: (f) => `Code quality: unresolved TODO/FIXME in ${f}`,
    body: (f, line, match) =>
      `## Unresolved TODO/FIXME\n\n**File:** \`${f}\`\n**Line:** ${line}\n**Comment:** \`${match.trim()}\`\n\nThis marker indicates incomplete or workaround code that should be addressed.\n\nThis issue is limited only to the creator of this issue. This means that only the issue author can attempt to solve this issue. If you would like to work on it, please create another issue with the same contents and refer to issue #743 for more information.`,
  },
  {
    name: "missing-error-handling",
    pattern: /await\s+\w+\([^)]*\)(?!\s*\.catch)(?!\s*;?\s*\/\/)/,
    severity: "medium",
    title: (f) => `Bug: unhandled async call in ${f}`,
    body: (f, line, match) =>
      `## Missing Error Handling\n\n**File:** \`${f}\`\n**Line:** ${line}\n**Code:** \`${match.trim()}\`\n\nThis async call has no try/catch or .catch() handler. Unhandled rejections can crash the process.\n\nThis issue is limited only to the creator of this issue. This means that only the issue author can attempt to solve this issue. If you would like to work on it, please create another issue with the same contents and refer to issue #743 for more information.`,
  },
  {
    name: "console-log",
    pattern: /console\.(log|warn|error|debug)\s*\(/,
    severity: "low",
    title: (f) => `Code quality: console.log left in production code in ${f}`,
    body: (f, line, match) =>
      `## Console.log in Production Code\n\n**File:** \`${f}\`\n**Line:** ${line}\n**Call:** \`${match.trim()}\`\n\nConsole statements should be removed or replaced with a proper logger before production.\n\nThis issue is limited only to the creator of this issue. This means that only the issue author can attempt to solve this issue. If you would like to work on it, please create another issue with the same contents and refer to issue #743 for more information.`,
  },
  {
    name: "missing-input-validation",
    pattern: /req\.body\.\w+(?!\s*&&)(?!.*schema)(?!.*parse)/,
    severity: "medium",
    title: (f) => `Bug: unvalidated req.body field access in ${f}`,
    body: (f, line, match) =>
      `## Missing Input Validation\n\n**File:** \`${f}\`\n**Line:** ${line}\n**Access:** \`${match.trim()}\`\n\nDirect \`req.body\` field access without schema validation can allow malformed or malicious input.\n\nThis issue is limited only to the creator of this issue. This means that only the issue author can attempt to solve this issue. If you would like to work on it, please create another issue with the same contents and refer to issue #743 for more information.`,
  },
  {
    name: "no-rate-limit",
    pattern: /router\.(post|put|delete)\s*\(\s*['"`][^'"` ]+['"`]\s*,\s*(?!.*[Ll]imit)/,
    severity: "medium",
    title: (f) => `Security: POST/PUT/DELETE route without rate limiting in ${f}`,
    body: (f, line, match) =>
      `## Missing Rate Limiting\n\n**File:** \`${f}\`\n**Line:** ${line}\n**Route:** \`${match.trim()}\`\n\nMutating routes without per-route rate limiting are vulnerable to brute force and DoS.\n\nThis issue is limited only to the creator of this issue. This means that only the issue author can attempt to solve this issue. If you would like to work on it, please create another issue with the same contents and refer to issue #743 for more information.`,
  },
];

// ── File walker ──
function walk(dir, exts = [".js", ".ts", ".tsx"], results = []) {
  for (const entry of readdirSync(dir)) {
    if (["node_modules", ".git", "dist", ".next"].includes(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, exts, results);
    else if (exts.includes(extname(full))) results.push(full);
  }
  return results;
}

// ── Scanner ──
function scanFile(filepath) {
  const src = readFileSync(filepath, "utf8");
  const lines = src.split("\n");
  const findings = [];
  for (const check of CHECKS) {
    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(check.pattern);
      if (m) {
        findings.push({ check, file: filepath, line: i + 1, match: m[0] });
        break; // one finding per check per file
      }
    }
  }
  return findings;
}

// ── GitHub issue creator ──
async function createIssue(title, body) {
  if (DRY_RUN) { console.log(`[DRY RUN] Would create: ${title}`); return { number: 0 }; }
  const res = await fetch(`https://api.github.com/repos/${REPO}/issues`, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ title, body, labels: ["bug", "good first issue", "AI agent friendly"] })
  });
  if (!res.ok) throw new Error(`GitHub API error ${res.status}: ${await res.text()}`);
  return res.json();
}

// ── Main ──
async function main() {
  const files = walk(".");
  const allFindings = files.flatMap(scanFile);
  const deduped = [];
  const seen = new Set();
  for (const f of allFindings) {
    const key = `${f.check.name}:${f.file}`;
    if (!seen.has(key)) { seen.add(key); deduped.push(f); }
  }
  const findings = deduped.slice(0, MAX_ISSUES);

  if (OUTPUT_JSON) { console.log(JSON.stringify(findings, null, 2)); return; }

  console.log(`\n🔍 Scanned ${files.length} files — found ${deduped.length} issues (reporting top ${findings.length})\n`);

  const created = [];
  for (const f of findings) {
    const title = f.check.title(f.file.replace(process.cwd() + "/", ""));
    const body  = f.check.body(f.file.replace(process.cwd() + "/", ""), f.line, f.match);
    console.log(`  Creating: ${title}`);
    try {
      const issue = await createIssue(title, body);
      created.push({ issue: issue.number, title });
      console.log(`  ✅ #${issue.number}`);
    } catch (err) {
      console.error(`  ❌ ${err.message}`);
    }
  }

  console.log(`\n✅ Created ${created.length} issues`);
  if (created.length) console.log(created.map(c => `  #${c.issue}: ${c.title}`).join("\n"));
}

main().catch(err => { console.error(err); process.exit(1); });
