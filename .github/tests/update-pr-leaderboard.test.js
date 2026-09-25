const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const workflowPath = path.resolve(
  __dirname,
  "../workflows/update-pr-leaderboard.yml"
);

test("leaderboard workflow pins checkout to a full commit SHA", () => {
  const workflow = fs.readFileSync(workflowPath, "utf8");
  const match = workflow.match(/uses:\s*actions\/checkout@([^\s#]+)/);

  assert.ok(match, "expected workflow to use actions/checkout");
  assert.match(
    match[1],
    /^[0-9a-f]{40}$/,
    "actions/checkout should be pinned to an immutable full-length SHA"
  );
});
