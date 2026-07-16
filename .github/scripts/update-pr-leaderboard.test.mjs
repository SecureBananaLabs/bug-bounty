import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { existsSync } from "node:fs";

const workflowPath = new URL("../workflows/update-pr-leaderboard.yml", import.meta.url);
const updaterUrl = new URL("./update-pr-leaderboard.mjs", import.meta.url);

async function loadUpdater() {
  assert.equal(existsSync(updaterUrl), true, "updater script must exist");
  return import(updaterUrl.href);
}

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

test("leaderboard mutation increments one user and preserves unrelated values", async () => {
  const { incrementLeaderboardText } = await loadUpdater();
  const source = `${JSON.stringify({ alice: 2, bob: 7 }, null, 2)}\n`;

  assert.equal(
    incrementLeaderboardText(source, "alice"),
    `${JSON.stringify({ alice: 3, bob: 7 }, null, 2)}\n`,
  );
});

test("leaderboard mutation appends a new user and keeps shell text as data", async () => {
  const { incrementLeaderboardText } = await loadUpdater();
  const user = "$(touch-not-executed)";
  const result = JSON.parse(incrementLeaderboardText("{}\n", user));

  assert.deepEqual(result, { [user]: 1 });
});

test("workflow inputs reject malformed PR numbers", async () => {
  const { parseInputs } = await loadUpdater();

  assert.throws(
    () => parseInputs({
      GH_TOKEN: "token",
      DEFAULT_BRANCH: "main",
      GITHUB_REPOSITORY: "owner/repo",
      PR_USER: "alice",
      PR_NUMBER: "12; echo injected",
    }),
    /PR_NUMBER must contain digits only/,
  );
});
