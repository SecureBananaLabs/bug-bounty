import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const workflowPath = new URL("./update-pr-leaderboard.yml", import.meta.url);

test("leaderboard workflow keeps credentials out of the origin remote", async () => {
  const workflow = await readFile(workflowPath, "utf8");

  assert.equal(workflow.includes("git remote set-url origin"), false);
  assert.equal(workflow.includes("x-access-token"), false);
  assert.match(workflow, /http\.https:\/\/github\.com\/\.extraheader=AUTHORIZATION: bearer \$\{GH_TOKEN\}/);
  assert.match(workflow, /git -c "[^"]+" push origin "HEAD:\$\{DEFAULT_BRANCH\}"/);
});
