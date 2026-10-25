import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const workflowPath = join(
  here,
  "..",
  "..",
  "..",
  "..",
  ".github",
  "workflows",
  "update-pr-leaderboard.yml"
);

const workflow = readFileSync(workflowPath, "utf8");

test("actions/checkout is pinned to a full-length commit SHA", () => {
  const uses = workflow.match(/uses:\s*actions\/checkout@(\S+)/);
  assert.ok(uses, "checkout step should exist");
  const ref = uses[1];
  assert.match(
    ref,
    /^[0-9a-f]{40}$/,
    `actions/checkout must be pinned to a 40-char SHA, got "${ref}"`
  );
});

test("pinned checkout keeps a readable version comment", () => {
  assert.match(workflow, /actions\/checkout@[0-9a-f]{40}\s+#\s*v4/);
});

test("workflow does not use mutable action tags", () => {
  assert.doesNotMatch(workflow, /uses:\s*actions\/checkout@v\d/);
});
