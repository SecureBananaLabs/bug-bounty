import path from "node:path";
import { BOUNTY_PARENT_ISSUE, ISSUE_LIMITATION_CLAUSE } from "./constants.js";

const SEVERITY_ORDER = { high: 0, medium: 1, low: 2 };

export function formatFindingAsIssue(finding) {
  const related = finding.relatedFiles?.length
    ? finding.relatedFiles.map((file) => `- \`${file}\``).join("\n")
    : `- \`${finding.file}\``;

  return {
    title: `[bug-scanner] ${finding.title}`,
    body: [
      `## Severity`,
      finding.severity,
      ``,
      `## Summary`,
      finding.description,
      ``,
      `## Affected files`,
      related,
      ``,
      `## Location`,
      `- File: \`${finding.file}\``,
      `- Line: ${finding.line}`,
      ``,
      `## Recommendation`,
      finding.recommendation,
      ``,
      `## Reproduction`,
      `1. Run \`npm run scan:bugs -- --format json\` from the repository root.`,
      `2. Confirm detector id \`${finding.id}\` reports this finding.`,
      ``,
      `## Parent bounty`,
      `Automated by bug-scanner for bounty issue #${BOUNTY_PARENT_ISSUE}.`,
      ``,
      ISSUE_LIMITATION_CLAUSE
    ].join("\n"),
    labels: ["bug", "bug bounty", "AI agent friendly"]
  };
}

export function sortFindings(findings) {
  return [...findings].sort((left, right) => {
    const severityDelta =
      (SEVERITY_ORDER[left.severity] ?? 99) - (SEVERITY_ORDER[right.severity] ?? 99);
    if (severityDelta !== 0) {
      return severityDelta;
    }

    return `${left.file}:${left.line}`.localeCompare(`${right.file}:${right.line}`);
  });
}

export function dedupeFindings(findings) {
  const seen = new Set();
  const unique = [];

  for (const finding of findings) {
    const key = `${finding.id}:${finding.file}:${finding.line}:${finding.title}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    unique.push(finding);
  }

  return unique;
}

export function formatIssuesMarkdown(issues) {
  return issues
    .map((issue, index) => {
      return [
        `### Issue ${index + 1}: ${issue.title}`,
        "",
        "```markdown",
        `# ${issue.title}`,
        "",
        issue.body,
        "```",
        ""
      ].join("\n");
    })
    .join("\n");
}

export function relatedDirectoriesForFindings(findings, rootDir) {
  const directories = new Set();

  for (const finding of findings) {
    const absoluteFile = path.join(rootDir, finding.file);
    directories.add(path.dirname(absoluteFile));
    for (const relatedFile of finding.relatedFiles ?? []) {
      directories.add(path.dirname(path.join(rootDir, relatedFile)));
    }
  }

  return [...directories];
}
