import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const reportPath = path.join(repoRoot, "reports", "todo-triage-report.md");
const terms = ["TODO", "FIXME", "XXX"];
const termRegex = /\b(todo|fixme|xxx)\b/i;
const ignoredDirs = new Set([
  ".git",
  ".codex_tmp",
  ".codex",
  ".pytest_cache",
  "node_modules",
  "coverage",
  "dist",
  "build",
  ".next",
  "reports"
]);
const textExtensions = new Set([
  ".js",
  ".mjs",
  ".cjs",
  ".ts",
  ".tsx",
  ".jsx",
  ".md",
  ".mdx",
  ".json",
  ".yml",
  ".yaml",
  ".txt",
  ".sh",
  ".ps1",
  ".py",
  ".css",
  ".html",
  ".htm",
  ".toml",
  ".ini",
  ".conf",
  ".prisma",
  ".graphql",
  ".sql",
  ".env"
]);
const specialNames = new Set([
  "README",
  "LICENSE",
  "Dockerfile",
  "Makefile",
  "CONTRIBUTING",
  "CHANGELOG",
  "TODO"
]);
const ignoredFiles = new Set(["scripts/todo-triage-report.mjs"]);
const maxBytes = 1024 * 1024;

const stats = {
  filesVisited: 0,
  filesScanned: 0,
  filesSkippedIgnored: 0,
  filesSkippedBinary: 0,
  filesSkippedTooLarge: 0,
  hits: 0
};

const entries = new Map();

function isProbablyTextFile(filePath) {
  const base = path.basename(filePath);
  const ext = path.extname(base).toLowerCase();
  if (textExtensions.has(ext)) return true;
  if (!ext && specialNames.has(base.toUpperCase())) return true;
  if (!ext && base.startsWith(".")) return false;
  return false;
}

function normalizeSnippet(snippet) {
  return snippet.replace(/\s+/g, " ").trim();
}

function recordMatch(relPath, lineNumber, term, lineText) {
  const snippet = normalizeSnippet(lineText).slice(0, 220);
  const key = `${relPath}::${snippet}`;
  const existing = entries.get(key);
  if (existing) {
    existing.occurrences += 1;
    return;
  }

  entries.set(key, {
    file: relPath,
    line: lineNumber,
    term,
    snippet,
    occurrences: 1
  });
  stats.hits += 1;
}

async function scanFile(absPath) {
  const relPath = path.relative(repoRoot, absPath).replaceAll("\\", "/");
  const stat = await fs.stat(absPath);
  if (stat.size > maxBytes) {
    stats.filesSkippedTooLarge += 1;
    return;
  }

  const buffer = await fs.readFile(absPath);
  if (buffer.includes(0)) {
    stats.filesSkippedBinary += 1;
    return;
  }

  const text = buffer.toString("utf8");
  const lines = text.split(/\r?\n/);
  stats.filesScanned += 1;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const match = termRegex.exec(line);
    if (!match) continue;
    recordMatch(relPath, index + 1, match[1].toUpperCase(), line);
  }
}

async function walk(dir) {
  const dirents = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of dirents) {
    if (ignoredDirs.has(entry.name)) {
      stats.filesSkippedIgnored += 1;
      continue;
    }

    const absPath = path.join(dir, entry.name);
    if (entry.isSymbolicLink()) continue;
    if (entry.isDirectory()) {
      await walk(absPath);
      continue;
    }
    const relPath = path.relative(repoRoot, absPath).replaceAll("\\", "/");
    if (ignoredFiles.has(relPath)) continue;
    if (!isProbablyTextFile(absPath)) continue;
    stats.filesVisited += 1;
    await scanFile(absPath);
  }
}

function buildReport() {
  const byFile = new Map();
  for (const entry of entries.values()) {
    if (!byFile.has(entry.file)) byFile.set(entry.file, []);
    byFile.get(entry.file).push(entry);
  }

  const fileNames = [...byFile.keys()].sort((a, b) => a.localeCompare(b));
  for (const list of byFile.values()) {
    list.sort((a, b) => a.line - b.line || a.term.localeCompare(b.term));
  }

  const termCounts = Object.fromEntries(terms.map((term) => [term, 0]));
  for (const entry of entries.values()) {
    termCounts[entry.term] += entry.occurrences;
  }

  const lines = [];
  lines.push("# TODO triage report");
  lines.push("");
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push(`Root: \`${repoRoot.replaceAll("\\", "/")}\``);
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push(`- Files visited: ${stats.filesVisited}`);
  lines.push(`- Files scanned: ${stats.filesScanned}`);
  lines.push(`- Unique matches: ${entries.size}`);
  lines.push(`- Raw matches: ${stats.hits}`);
  lines.push(`- Skipped ignored directories: ${stats.filesSkippedIgnored}`);
  lines.push(`- Skipped binary files: ${stats.filesSkippedBinary}`);
  lines.push(`- Skipped oversized files: ${stats.filesSkippedTooLarge}`);
  lines.push("");
  lines.push("## Term counts");
  lines.push("");
  for (const term of terms) {
    lines.push(`- ${term}: ${termCounts[term]}`);
  }
  lines.push("");
  lines.push("## Matches by file");
  lines.push("");

  if (fileNames.length === 0) {
    lines.push("_No TODO/FIXME/XXX markers found._");
    lines.push("");
    return lines.join("\n");
  }

  for (const file of fileNames) {
    lines.push(`### \`${file}\``);
    for (const entry of byFile.get(file)) {
      const suffix = entry.occurrences > 1 ? ` (x${entry.occurrences})` : "";
      lines.push(`- L${entry.line} [${entry.term}] \`${entry.snippet}\`${suffix}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

async function main() {
  await walk(repoRoot);
  const report = buildReport();
  await fs.mkdir(path.dirname(reportPath), { recursive: true });
  await fs.writeFile(reportPath, report + "\n");
  console.log(
    JSON.stringify(
      {
        reportPath,
        filesVisited: stats.filesVisited,
        filesScanned: stats.filesScanned,
        uniqueMatches: entries.size,
        rawMatches: stats.hits
      },
      null,
      2
    )
  );
}

await main();
