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

test("workflow invokes the tested Node updater from the trusted checkout", () => {
  const workflow = readFileSync(workflowPath, "utf8");
  const job = workflow.slice(workflow.indexOf("  update-leaderboard:"));
  const checkoutIndex = job.indexOf("uses: actions/checkout@v4");
  const refIndex = job.indexOf("ref: ${{ github.event.repository.default_branch }}");
  const runIndex = job.indexOf("run: node .github/scripts/update-pr-leaderboard.mjs");

  assert.match(workflow, /^\s*pull_request_target:\s*$/m);
  assert.match(workflow, /^\s*contents:\s*write\s*$/m);
  assert.match(workflow, /^\s*pull-requests:\s*read\s*$/m);
  assert.ok(checkoutIndex >= 0 && checkoutIndex < refIndex && refIndex < runIndex);
  assert.doesNotMatch(workflow, /jq --arg user/);
  assert.doesNotMatch(workflow, /^\s*GITHUB_REPOSITORY:\s*/m);
});

test("leaderboard mutation increments one user and preserves unrelated values", async () => {
  const { incrementLeaderboardText } = await loadUpdater();
  const source = `${JSON.stringify({ alice: 2, bob: 7 }, null, 2)}\n`;

  assert.equal(
    incrementLeaderboardText(source, "alice"),
    `${JSON.stringify({ alice: 3, bob: 7 }, null, 2)}\n`,
  );
});

test("leaderboard mutation preserves numeric-key order and formatting", async () => {
  const { incrementLeaderboardText } = await loadUpdater();
  const source = '{\n  "alice": 2,\n  "2569658930": 7,\n  "bob": 9\n}\n';
  const expected = '{\n  "alice": 2,\n  "2569658930": 8,\n  "bob": 9\n}\n';

  const result = incrementLeaderboardText(source, "2569658930");
  assert.equal(result, expected);
  assert.deepEqual(JSON.parse(result), { alice: 2, "2569658930": 8, bob: 9 });
});

test("leaderboard mutation preserves numeric-key order and formatting with CRLF", async () => {
  const { incrementLeaderboardText } = await loadUpdater();
  const source = '{\r\n  "alice": 2,\r\n  "bob": 9,\r\n  "2569658930": 7\r\n}\r\n';
  const expected = '{\r\n  "alice": 2,\r\n  "bob": 9,\r\n  "2569658930": 8\r\n}\r\n';

  const result = incrementLeaderboardText(source, "2569658930");
  assert.equal(result, expected);
  assert.deepEqual(JSON.parse(result), { alice: 2, "2569658930": 8, bob: 9 });
});

test("leaderboard mutation appends a new key after numeric keys", async () => {
  const { incrementLeaderboardText } = await loadUpdater();
  const source = '{\n  "alice": 2,\n  "2569658930": 7,\n  "bob": 9\n}\n';
  const expected = '{\n  "alice": 2,\n  "2569658930": 7,\n  "bob": 9,\n  "charlie": 1\n}\n';

  const result = incrementLeaderboardText(source, "charlie");
  assert.equal(result, expected);
  assert.deepEqual(JSON.parse(result), { alice: 2, "2569658930": 7, bob: 9, charlie: 1 });
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

function result(status = 0, stdout = "", stderr = "") {
  return { status, stdout, stderr };
}

function makeFile(initial = "{}\n") {
  let contents = initial;
  let writes = 0;
  return {
    exists: () => true,
    read: () => contents,
    write: (_path, next) => {
      contents = next;
      writes += 1;
    },
    snapshot: () => ({ contents, writes }),
  };
}

const inputs = {
  token: "secret-token",
  defaultBranch: "main",
  repository: "owner/repo",
  prUser: "alice",
  prNumber: "123",
};

test("already-counted PR exits before writing or pushing", async () => {
  const { runUpdate } = await loadUpdater();
  const file = makeFile();
  const calls = [];
  const git = (args) => {
    calls.push(args);
    if (args[0] === "log") return result(0, "chore: update leaderboard for PR #123\n");
    return result();
  };

  assert.equal(await runUpdate({ inputs, git, file, sleep: async () => {}, log: () => {} }), "already-counted");
  assert.equal(file.snapshot().writes, 0);
  assert.equal(calls.some((args) => args[0] === "push"), false);
});

test("rejected push resets, recomputes, and succeeds without losing a concurrent increment", async () => {
  const { runUpdate } = await loadUpdater();
  const file = makeFile(`${JSON.stringify({ alice: 4, bob: 2 }, null, 2)}\n`);
  let pushes = 0;
  let resets = 0;
  const git = (args) => {
    if (args[0] === "log") return result();
    if (args[0] === "diff") return result(1);
    if (args[0] === "reset") {
      resets += 1;
      if (resets === 2) {
        file.write("leaderboard.json", `${JSON.stringify({ alice: 4, bob: 3 }, null, 2)}\n`);
      }
      return result();
    }
    if (args[0] === "push") {
      pushes += 1;
      return pushes === 1 ? result(1, "", "non-fast-forward") : result();
    }
    return result();
  };

  assert.equal(await runUpdate({ inputs, git, file, sleep: async () => {}, log: () => {} }), "updated");
  assert.equal(pushes, 2);
  assert.equal(resets, 2);
  assert.deepEqual(JSON.parse(file.snapshot().contents), { alice: 5, bob: 3 });
});

test("retry exhaustion fails visibly without leaking the token", async () => {
  const { runUpdate, MAX_ATTEMPTS } = await loadUpdater();
  const file = makeFile();
  let pushes = 0;
  const git = (args) => {
    if (args[0] === "log") return result();
    if (args[0] === "diff") return result(1);
    if (args[0] === "push") {
      pushes += 1;
      return result(1, "", `rejected secret-token attempt ${pushes}`);
    }
    return result();
  };

  await assert.rejects(
    runUpdate({ inputs, git, file, sleep: async () => {}, log: () => {} }),
    (error) => {
      assert.match(error.message, /failed after 5 attempts/);
      assert.doesNotMatch(error.message, /secret-token/);
      return true;
    },
  );
  assert.equal(pushes, MAX_ATTEMPTS);
});
