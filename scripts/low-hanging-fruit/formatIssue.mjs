export const OWNERSHIP_DISCLAIMER =
  "This issue is limited only to the creator of this issue. This means that only the issue author can attempt to solve this issue. If you would like to work on it, please create another issue with the same contents and refer to issue #743 for more information.";

/**
 * @param {{
 *   id: string,
 *   title: string,
 *   severity: string,
 *   file: string,
 *   description: string,
 *   remediation: string
 * }} finding
 * @param {{ parentIssue?: number }} [options]
 */
export function formatIssueBody(finding, options = {}) {
  const parentIssue = options.parentIssue ?? 743;

  return [
    `## Low hanging fruit: ${finding.id}`,
    "",
    `**Severity:** ${finding.severity}`,
    `**File:** \`${finding.file}\``,
    "",
    "### Problem",
    "",
    finding.description,
    "",
    "### Suggested remediation",
    "",
    finding.remediation,
    "",
    "### Detection",
    "",
    "This issue was created by the low-hanging-fruit automation scanner.",
    `Parent / recursion reference: #${parentIssue}`,
    "",
    OWNERSHIP_DISCLAIMER,
    ""
  ].join("\n");
}
