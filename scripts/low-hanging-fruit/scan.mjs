#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";
import { detectLowHangingFruit } from "./detectors.mjs";
import { createIssuesRecursively } from "./createIssues.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");

function parseArgs(argv) {
  const maxFlag = argv.indexOf("--max");
  return {
    createIssues: argv.includes("--create-issues"),
    dryRun: argv.includes("--dry-run"),
    json: argv.includes("--json"),
    maxIssues:
      maxFlag >= 0 && argv[maxFlag + 1] ? Number(argv[maxFlag + 1]) : Number.POSITIVE_INFINITY
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const findings = detectLowHangingFruit(repoRoot);

  process.stdout.write(`Found ${findings.length} low-hanging-fruit issue(s)\n`);
  for (const finding of findings) {
    process.stdout.write(
      `- [${finding.severity}] ${finding.id}: ${finding.title} (${finding.file})\n`
    );
  }

  if (!args.createIssues && !args.dryRun) {
    if (args.json) {
      process.stdout.write(`${JSON.stringify({ findings }, null, 2)}\n`);
    }
    return;
  }

  const results = createIssuesRecursively({
    findings,
    dryRun: args.dryRun || !args.createIssues,
    maxIssues: Number.isFinite(args.maxIssues) ? args.maxIssues : findings.length,
    cwd: repoRoot
  });

  const created = results.filter((result) => result.created).length;
  const skipped = results.filter((result) => result.skipped).length;
  const prepared = results.filter((result) => result.dryRun && !result.skipped).length;

  process.stdout.write(
    `\nIssue creation summary: created=${created}, skipped=${skipped}, dryRunPrepared=${prepared}\n`
  );

  if (args.json) {
    process.stdout.write(`${JSON.stringify({ findings, results }, null, 2)}\n`);
  }
}

main();
