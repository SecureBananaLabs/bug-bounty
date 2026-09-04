const test = require("node:test");
const assert = require("node:assert/strict");
const { readFile } = require("node:fs/promises");
const { join } = require("node:path");

const workflowPath = join(__dirname, "../workflows/update-pr-leaderboard.yml");

test("leaderboard workflow counts merged pull requests only", async () => {
  const workflow = await readFile(workflowPath, "utf8");

  assert.match(workflow, /pull_request_target:\s*\n\s*types:\s*\n\s*-\s*closed/);
  assert.doesNotMatch(workflow, /types:\s*\n\s*-\s*opened/);
  assert.match(workflow, /if:\s*\$\{\{\s*github\.event\.pull_request\.merged\s*==\s*true\s*\}\}/);
  assert.match(workflow, /Increment merged PR count in leaderboard\.json/);
  assert.match(workflow, /chore: update leaderboard for PR #\$\{PR_NUMBER\}/);
  assert.match(workflow, /chore: update leaderboard for merged PR #\$\{PR_NUMBER\}/);
});
