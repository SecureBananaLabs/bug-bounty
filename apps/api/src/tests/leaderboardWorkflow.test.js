import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const workflowPath = new URL("../../../../.github/workflows/update-pr-leaderboard.yml", import.meta.url);

test("leaderboard workflow only runs when pull requests close", async () => {
  const workflow = await readFile(workflowPath, "utf8");

  assert.match(workflow, /pull_request_target:\s+types:\s+- closed/s);
  assert.doesNotMatch(workflow, /types:\s+- opened/s);
});

test("leaderboard workflow skips closed pull requests that were not merged", async () => {
  const workflow = await readFile(workflowPath, "utf8");

  assert.match(workflow, /github\.event\.pull_request\.merged/);
  assert.match(workflow, /closed without merge; not counting/);
});

test("leaderboard workflow keeps duplicate-count guard", async () => {
  const workflow = await readFile(workflowPath, "utf8");

  assert.match(workflow, /already counted/);
  assert.match(workflow, /chore: update leaderboard for PR #\$\{PR_NUMBER\}/);
});
