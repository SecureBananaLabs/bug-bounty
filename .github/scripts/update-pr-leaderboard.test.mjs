import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const workflowPath = new URL("../workflows/update-pr-leaderboard.yml", import.meta.url);

test("different PRs do not share a replaceable pending concurrency slot", () => {
  const workflow = readFileSync(workflowPath, "utf8");

  assert.doesNotMatch(
    workflow,
    /^\s*group:\s*leaderboard-json-update\s*$/m,
  );
  assert.match(
    workflow,
    /^\s*group:\s*leaderboard-json-update-\$\{\{\s*github\.event\.pull_request\.number\s*\}\}\s*$/m,
  );
});
