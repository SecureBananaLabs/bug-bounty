#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";
import { exportIssues } from "./export-issues.js";
import { formatFindingAsIssue, formatIssuesMarkdown } from "./issue-formatter.js";
import { scanRepository } from "./scanner.js";

function parseArgs(argv) {
  const options = {
    rootDir: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../.."),
    format: "markdown",
    recursive: true,
    maxDepth: 2,
    exportDir: null
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
    if (arg === "--no-recursive") {
      options.recursive = false;
    }
  }

  return options;
}

const options = parseArgs(process.argv.slice(2));
const findings = scanRepository(options);
const issues = findings.map(formatFindingAsIssue);

if (options.exportDir) {
  const manifest = exportIssues(issues, options.exportDir);
  console.error(`Exported ${manifest.length} issue drafts to ${options.exportDir}`);
}

if (options.format === "json") {
  console.log(JSON.stringify({ findings, issues }, null, 2));
  process.exit(0);
}

console.log(`# Bug scanner results (${findings.length} findings)\n`);
console.log(formatIssuesMarkdown(issues));
