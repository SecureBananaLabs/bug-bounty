import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const workflowPath = fileURLToPath(
  new URL("../../../../.github/workflows/update-pr-leaderboard.yml", import.meta.url)
);

test("leaderboard workflow pins actions/checkout to a full commit SHA", () => {
  const workflow = readFileSync(workflowPath, "utf8");
  const uses = workflow
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("uses:"));

  assert.ok(uses.length > 0, "expected at least one action step");

  for (const line of uses) {
    const [, reference] = line.match(/^uses:\s*(\S+)/);
    const [, sha] = reference.split("@");

    assert.match(sha, /^[0-9a-f]{40}$/, `${line} must pin a full commit SHA`);
  }
});

test("leaderboard workflow keeps a readable release-line comment", () => {
  const workflow = readFileSync(workflowPath, "utf8");

  assert.match(workflow, /uses: actions\/checkout@[0-9a-f]{40} # v\d+/);
});
