# Reliable Leaderboard Updates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent burst PR-open events from being dropped and retry leaderboard pushes without double-counting a PR.

**Architecture:** Give each PR its own GitHub Actions concurrency key, then move the leaderboard mutation into a testable Node ESM script. The script recomputes from the latest remote default branch after a rejected push and uses the existing exact commit subject as its idempotency key.

**Tech Stack:** GitHub Actions YAML, Node.js ESM, `node:test`, Git CLI, JSON.

## Global Constraints

- Preserve the trusted `pull_request_target` default-branch checkout; never execute contributor-branch code.
- Keep `permissions` at `contents: write` and `pull-requests: read`.
- Preserve `leaderboard.json` key order, two-space indentation, and trailing newline.
- Use argument-array Git execution; do not interpolate PR-derived values into a shell command.
- Retry at most five pushes and fail visibly after exhaustion.
- Use the exact idempotency subject `chore: update leaderboard for PR #<number>`.
- Do not add runtime dependencies.

---

## File structure

- Modify `.github/workflows/update-pr-leaderboard.yml`: PR-specific concurrency and invocation of the tested updater.
- Create `.github/scripts/update-pr-leaderboard.mjs`: validation, pure JSON mutation, Git command adapter, idempotent retry loop, and CLI entrypoint.
- Create `.github/scripts/update-pr-leaderboard.test.mjs`: workflow configuration, JSON mutation, idempotency, retry, exhaustion, and command-injection regression tests.

### Task 1: Make workflow concurrency lossless across different PRs

**Files:**
- Modify: `.github/workflows/update-pr-leaderboard.yml:12-14`
- Create: `.github/scripts/update-pr-leaderboard.test.mjs`

**Interfaces:**
- Consumes: GitHub event value `${{ github.event.pull_request.number }}`.
- Produces: concurrency group `leaderboard-json-update-${{ github.event.pull_request.number }}`.

- [ ] **Step 1: Write the failing workflow configuration test**

Create `.github/scripts/update-pr-leaderboard.test.mjs` with:

```js
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
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```powershell
node --test ".github/scripts/update-pr-leaderboard.test.mjs"
```

Expected: one failed test because the workflow still contains `group: leaderboard-json-update` and lacks the PR-number suffix.

- [ ] **Step 3: Make the minimal workflow change**

Replace the concurrency block with:

```yaml
concurrency:
  group: leaderboard-json-update-${{ github.event.pull_request.number }}
  cancel-in-progress: false
```

- [ ] **Step 4: Run the focused test and verify GREEN**

Run:

```powershell
node --test ".github/scripts/update-pr-leaderboard.test.mjs"
```

Expected: one passed test, zero failures.

- [ ] **Step 5: Commit the concurrency fix**

```powershell
git add .github/workflows/update-pr-leaderboard.yml .github/scripts/update-pr-leaderboard.test.mjs
git commit -m "fix: isolate leaderboard workflow concurrency by PR"
```

### Task 2: Add validated, format-preserving leaderboard mutation

**Files:**
- Create: `.github/scripts/update-pr-leaderboard.mjs`
- Modify: `.github/scripts/update-pr-leaderboard.test.mjs`

**Interfaces:**
- Produces: `commitSubject(prNumber: string): string`.
- Produces: `parseInputs(env: Record<string, string | undefined>): Inputs`.
- Produces: `incrementLeaderboardText(source: string, user: string): string`.
- `Inputs` fields: `token`, `defaultBranch`, `repository`, `prUser`, `prNumber`.

- [ ] **Step 1: Add failing behavior tests**

Append:

```js
import { existsSync } from "node:fs";

const updaterUrl = new URL("./update-pr-leaderboard.mjs", import.meta.url);

async function loadUpdater() {
  assert.equal(existsSync(updaterUrl), true, "updater script must exist");
  return import(updaterUrl.href);
}

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
```

- [ ] **Step 2: Run the tests and verify RED**

Run:

```powershell
node --test ".github/scripts/update-pr-leaderboard.test.mjs"
```

Expected: the workflow test passes and the first updater test fails with `updater script must exist`.

- [ ] **Step 3: Implement the pure functions and input validation**

Create `.github/scripts/update-pr-leaderboard.mjs` with these exports before adding Git operations:

```js
import { pathToFileURL } from "node:url";

export const MAX_ATTEMPTS = 5;

export function commitSubject(prNumber) {
  return `chore: update leaderboard for PR #${prNumber}`;
}

function required(env, name) {
  const value = env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

export function parseInputs(env) {
  const token = required(env, "GH_TOKEN");
  const defaultBranch = required(env, "DEFAULT_BRANCH");
  const repository = required(env, "GITHUB_REPOSITORY");
  const prUser = required(env, "PR_USER");
  const prNumber = required(env, "PR_NUMBER");

  if (!/^\d+$/.test(prNumber)) {
    throw new Error("PR_NUMBER must contain digits only");
  }
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository)) {
    throw new Error("GITHUB_REPOSITORY must be owner/name");
  }
  if (defaultBranch.startsWith("-") || defaultBranch.includes("\0")) {
    throw new Error("DEFAULT_BRANCH is invalid");
  }

  return { token, defaultBranch, repository, prUser, prNumber };
}

export function incrementLeaderboardText(source, user) {
  const leaderboard = source.trim() ? JSON.parse(source) : {};
  if (leaderboard === null || Array.isArray(leaderboard) || typeof leaderboard !== "object") {
    throw new Error("leaderboard.json must contain a JSON object");
  }

  const current = leaderboard[user] ?? 0;
  if (typeof current !== "number" || !Number.isFinite(current)) {
    throw new Error(`leaderboard entry for ${user} must be a finite number`);
  }

  leaderboard[user] = current + 1;
  return `${JSON.stringify(leaderboard, null, 2)}\n`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  parseInputs(process.env);
}
```

- [ ] **Step 4: Run the focused tests and verify GREEN**

Run:

```powershell
node --test ".github/scripts/update-pr-leaderboard.test.mjs"
```

Expected: four passed tests, zero failures.

- [ ] **Step 5: Commit the tested mutation layer**

```powershell
git add .github/scripts/update-pr-leaderboard.mjs .github/scripts/update-pr-leaderboard.test.mjs
git commit -m "test: cover leaderboard update inputs and formatting"
```

### Task 3: Add idempotent optimistic push retries

**Files:**
- Modify: `.github/scripts/update-pr-leaderboard.mjs`
- Modify: `.github/scripts/update-pr-leaderboard.test.mjs`

**Interfaces:**
- Produces: `runUpdate(options): Promise<"already-counted" | "no-change" | "updated">`.
- `options.git(args)` returns `{ status: number, stdout: string, stderr: string }`.
- `options.file` supplies `exists(path)`, `read(path)`, and `write(path, text)`.
- `options.sleep(milliseconds)` returns a promise.
- `options.log(message)` records retry information without credentials.

- [ ] **Step 1: Add failing idempotency and retry tests**

Append tests that use an in-memory file and scripted Git adapter:

```js
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
```

- [ ] **Step 2: Run the tests and verify RED**

Run:

```powershell
node --test ".github/scripts/update-pr-leaderboard.test.mjs"
```

Expected: the new tests fail because `runUpdate` is not exported.

- [ ] **Step 3: Implement Git execution, idempotency, and bounded retry**

Extend `.github/scripts/update-pr-leaderboard.mjs` with:

```js
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

function defaultGit(args) {
  const completed = spawnSync("git", args, { encoding: "utf8" });
  return {
    status: completed.status ?? 1,
    stdout: completed.stdout ?? "",
    stderr: completed.stderr ?? completed.error?.message ?? "",
  };
}

const defaultFile = {
  exists: existsSync,
  read: (path) => readFileSync(path, "utf8"),
  write: (path, contents) => writeFileSync(path, contents, "utf8"),
};

function requireGit(result, operation, token) {
  if (result.status === 0) return result;
  const detail = result.stderr.replaceAll(token, "[redacted]").trim();
  throw new Error(`${operation} failed${detail ? `: ${detail}` : ""}`);
}

export async function runUpdate({
  inputs,
  git = defaultGit,
  file = defaultFile,
  sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)),
  log = (message) => console.log(message),
} = {}) {
  const { token, defaultBranch, repository, prUser, prNumber } = inputs;
  const subject = commitSubject(prNumber);
  const remoteUrl = `https://x-access-token:${token}@github.com/${repository}.git`;

  requireGit(git(["config", "user.name", "github-actions[bot]"]), "configure Git user", token);
  requireGit(git(["config", "user.email", "41898282+github-actions[bot]@users.noreply.github.com"]), "configure Git email", token);
  requireGit(git(["remote", "set-url", "origin", remoteUrl]), "configure authenticated origin", token);

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    requireGit(git(["fetch", "origin", defaultBranch]), "fetch default branch", token);
    requireGit(git(["reset", "--hard", `origin/${defaultBranch}`]), "reset to default branch", token);

    const existing = requireGit(
      git(["log", "--format=%s", `--grep=^${subject}$`, "-n", "1"]),
      "check idempotency commit",
      token,
    );
    if (existing.stdout.trim()) return "already-counted";

    const source = file.exists("leaderboard.json") ? file.read("leaderboard.json") : "{}\n";
    file.write("leaderboard.json", incrementLeaderboardText(source, prUser));
    requireGit(git(["add", "leaderboard.json"]), "stage leaderboard", token);

    const diff = git(["diff", "--cached", "--quiet", "--", "leaderboard.json"]);
    if (diff.status === 0) return "no-change";
    if (diff.status !== 1) requireGit(diff, "inspect staged leaderboard", token);

    requireGit(git(["commit", "-m", subject]), "commit leaderboard", token);
    const push = git(["push", "origin", `HEAD:${defaultBranch}`]);
    if (push.status === 0) return "updated";

    if (attempt === MAX_ATTEMPTS) {
      const detail = push.stderr.replaceAll(token, "[redacted]").trim();
      throw new Error(`leaderboard push failed after ${MAX_ATTEMPTS} attempts${detail ? `: ${detail}` : ""}`);
    }

    log(`Push attempt ${attempt} lost a race; recomputing from origin/${defaultBranch}.`);
    await sleep(attempt * 250);
  }

  throw new Error("unreachable retry state");
}
```

Replace the direct-execution block with:

```js
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const inputs = parseInputs(process.env);
  runUpdate({ inputs }).then(
    (status) => console.log(`Leaderboard update: ${status}`),
    (error) => {
      console.error(error.message);
      process.exitCode = 1;
    },
  );
}
```

- [ ] **Step 4: Run the focused tests and verify GREEN**

Run:

```powershell
node --test ".github/scripts/update-pr-leaderboard.test.mjs"
```

Expected: seven passed tests, zero failures.

- [ ] **Step 5: Commit the retry implementation**

```powershell
git add .github/scripts/update-pr-leaderboard.mjs .github/scripts/update-pr-leaderboard.test.mjs
git commit -m "fix: retry concurrent leaderboard pushes"
```

### Task 4: Wire the tested updater into GitHub Actions

**Files:**
- Modify: `.github/workflows/update-pr-leaderboard.yml:28-66`
- Modify: `.github/scripts/update-pr-leaderboard.test.mjs`

**Interfaces:**
- Consumes environment variables `GH_TOKEN`, `DEFAULT_BRANCH`, `GITHUB_REPOSITORY`, `PR_USER`, and `PR_NUMBER`.
- Invokes `node .github/scripts/update-pr-leaderboard.mjs` from the trusted default-branch checkout.

- [ ] **Step 1: Add a failing workflow invocation test**

Append:

```js
test("workflow invokes the tested Node updater from the trusted checkout", () => {
  const workflow = readFileSync(workflowPath, "utf8");

  assert.match(workflow, /^\s*run:\s*node \.github\/scripts\/update-pr-leaderboard\.mjs\s*$/m);
  assert.doesNotMatch(workflow, /jq --arg user/);
  assert.match(workflow, /ref:\s*\$\{\{ github\.event\.repository\.default_branch \}\}/);
});
```

- [ ] **Step 2: Run the tests and verify RED**

Run:

```powershell
node --test ".github/scripts/update-pr-leaderboard.test.mjs"
```

Expected: the new invocation test fails because the workflow still contains the inline `jq` block.

- [ ] **Step 3: Replace the inline shell block**

Keep the existing checkout step and replace the update step with:

```yaml
      - name: Increment PR count in leaderboard.json
        env:
          GH_TOKEN: ${{ github.token }}
          DEFAULT_BRANCH: ${{ github.event.repository.default_branch }}
          PR_USER: ${{ github.event.pull_request.user.login }}
          PR_NUMBER: ${{ github.event.pull_request.number }}
        run: node .github/scripts/update-pr-leaderboard.mjs
```

`GITHUB_REPOSITORY` remains available as a default GitHub Actions environment variable and must not be replaced with PR-controlled input.

- [ ] **Step 4: Run focused tests and YAML parsing**

Run:

```powershell
node --test ".github/scripts/update-pr-leaderboard.test.mjs"
@'
import pathlib, yaml
path = pathlib.Path('.github/workflows/update-pr-leaderboard.yml')
with path.open(encoding='utf-8') as stream:
    parsed = yaml.safe_load(stream)
assert isinstance(parsed, dict)
print('workflow yaml parsed')
'@ | python -
```

Expected: eight passed Node tests and `workflow yaml parsed`.

- [ ] **Step 5: Commit workflow wiring**

```powershell
git add .github/workflows/update-pr-leaderboard.yml .github/scripts/update-pr-leaderboard.test.mjs
git commit -m "ci: run tested leaderboard updater"
```

### Task 5: Full verification and publication

**Files:**
- Verify: all changed files
- Update only if verification finds a defect: `.github/scripts/update-pr-leaderboard.mjs`, `.github/scripts/update-pr-leaderboard.test.mjs`, `.github/workflows/update-pr-leaderboard.yml`

**Interfaces:**
- Produces: a pushed branch and PR that closes Issue #11198 and claims parent bounty #743.

- [ ] **Step 1: Run all automated checks**

```powershell
node --test ".github/scripts/update-pr-leaderboard.test.mjs"
node --test "apps/api/src/tests/health.test.js"
npm run build -w apps/web
git diff --check origin/main...HEAD
git status --short
```

Expected:

- leaderboard tests: eight passed, zero failed;
- API health test: one passed, zero failed;
- Next.js production build: completed successfully;
- `git diff --check`: no output;
- `git status --short`: no output.

- [ ] **Step 2: Inspect the security boundary**

```powershell
git diff origin/main...HEAD -- .github/workflows/update-pr-leaderboard.yml .github/scripts/update-pr-leaderboard.mjs
```

Confirm the checkout still pins the default branch, no PR branch is checked out or executed, Git uses argument arrays, and errors redact `GH_TOKEN`.

- [ ] **Step 3: Review the complete branch diff**

```powershell
git log --oneline origin/main..HEAD
git diff --stat origin/main...HEAD
git diff origin/main...HEAD
```

Expected: only the ignore entry, design/plan documentation, workflow, updater, and updater tests are changed.

- [ ] **Step 4: Push the branch**

```powershell
git push -u fork codex/fix-leaderboard-11198
```

Expected: branch created or updated at `qq2401672073-hub/bug-bounty`.

- [ ] **Step 5: Open the pull request**

Create a PR from `qq2401672073-hub:codex/fix-leaderboard-11198` to `SecureBananaLabs:main` with:

```markdown
## Summary
- prevent different PR-open events from sharing GitHub Actions' single replaceable pending concurrency slot
- retry leaderboard updates from the latest default branch after concurrent push races
- preserve idempotency and add regression coverage for retries and command-injection inputs

## Validation
- `node --test .github/scripts/update-pr-leaderboard.test.mjs`
- `node --test apps/api/src/tests/health.test.js`
- `npm run build -w apps/web`
- workflow YAML parse check
- `git diff --check origin/main...HEAD`

Closes #11198

/claim #743
```

- [ ] **Step 6: Verify remote checks and PR state**

Confirm the PR is open, non-draft, mergeable, the changed-file list matches the local diff, and every available GitHub check passes. Address review comments or CI failures before reporting completion.
