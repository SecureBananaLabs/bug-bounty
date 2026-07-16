# Leaderboard Burst Concurrency Design

## Context

The `Update PR leaderboard` workflow runs for every opened pull request and commits an increment to `leaderboard.json`. It currently places all runs in the fixed `leaderboard-json-update` concurrency group. GitHub Actions retains only one running and one pending run per group, so a burst of three or more PR-open events can replace an older pending run. Because the workflow listens only to the `opened` event, a replaced run is never replayed.

This failure occurred for PR #11181: neighboring PRs #11180 and #11182 produced leaderboard commits, while the #11181 run was cancelled before starting and no matching commit exists on the default branch.

## Goal

Process every PR-open event exactly once from the workflow's perspective, without losing events to concurrency replacement or double-counting a PR after a retry.

## Non-goals

- Rebuilding historical leaderboard counts.
- Changing which PR events qualify for the leaderboard.
- Changing leaderboard ordering or JSON formatting.
- Changing repository permissions or the trusted `pull_request_target` checkout model.

## Considered approaches

### 1. PR-specific concurrency plus optimistic retry — selected

Use the PR number in the concurrency key so different PRs cannot replace one another. Let different PR updates run concurrently, and make each updater retry from the newest default-branch state after a non-fast-forward push.

This preserves prompt event handling, avoids a lossy global queue, and remains correct under push races. It requires a small testable update script rather than the current one-shot inline shell block.

### 2. Remove concurrency without adding retry

Every event would start, but simultaneous runs could race on `leaderboard.json`; one or more pushes would fail. This changes the loss mechanism rather than fixing it.

### 3. Scheduled full reconciliation

A scheduled job could periodically rebuild the leaderboard from GitHub history. This could repair missed events, but it is broader, slower, API-intensive, and changes the current event-driven model.

## Architecture

The workflow retains its trusted default-branch checkout and write permissions. Its concurrency key becomes `leaderboard-json-update-${{ github.event.pull_request.number }}`, preventing pending runs for different PRs from sharing a replaceable slot.

The inline update block moves to `.github/scripts/update-pr-leaderboard.mjs`. The module exposes pure or dependency-injected functions for tests and executes its CLI only when launched directly. It performs these steps:

1. Validate the branch, repository, PR number, and PR user inputs supplied by GitHub Actions.
2. Configure the bot identity and authenticated origin URL.
3. Fetch and hard-reset the ephemeral runner checkout to the latest default branch.
4. Check the exact commit subject `chore: update leaderboard for PR #<number>`; exit successfully if already counted.
5. Parse `leaderboard.json`, increment only the PR author's key, and write two-space-indented JSON with a trailing newline.
6. Commit the update and attempt a direct push to the default branch.
7. If the push loses a race, discard the local attempt, return to step 3, recompute from the new remote state, and retry up to five times with a short bounded delay.
8. Fail the workflow after the fifth rejected push so GitHub surfaces a visible error instead of silently losing the event.

Hard-resetting is safe here because the checkout is an ephemeral GitHub-hosted runner containing only the deterministic leaderboard update. Recomputing avoids merge conflicts and guarantees the increment is based on the latest committed count.

## Data and idempotency

The commit subject is the idempotency key. A retried or manually rerun event checks the remote branch after every fetch and exits without changing the file when that subject already exists.

JSON object insertion order is preserved by parsing and serializing the existing object. Existing users remain in their current order; a new user is appended. No unrelated leaderboard entries are modified.

## Error handling

- Missing or malformed workflow inputs fail before any repository write.
- Missing `leaderboard.json` is treated as an empty object, matching the current workflow.
- Invalid JSON fails loudly without committing.
- A no-diff update exits successfully.
- Push conflicts are retried from a clean copy of the latest remote branch.
- Non-retryable Git failures and retry exhaustion return a non-zero exit code.
- Authentication tokens are never printed in logs or included in command error messages.

## Security

The workflow continues to check out only the repository's default branch under `pull_request_target`; it never executes code from the contributor's PR branch. Git commands are launched with argument arrays rather than a shell command string, so PR-derived values cannot inject shell syntax. The script validates `PR_NUMBER` as digits and treats `PR_USER` only as a JSON key.

## Testing

Add Node `node:test` coverage that:

- rejects the fixed global concurrency key and requires a PR-specific key;
- verifies existing and new users are incremented without changing unrelated values;
- verifies an already-counted PR performs no write or push;
- simulates a rejected first push and proves the script fetches, resets, recomputes, and succeeds on a later attempt;
- verifies retry exhaustion fails visibly;
- verifies shell-like PR user text is stored as data and never executed.

Run the new focused tests, the existing API tests with an explicit test-file path on Windows, the web production build, `git diff --check`, and a YAML parse/static inspection. Browser testing is not applicable because the change has no web UI. Network penetration testing is not applicable; the relevant security boundary is covered by trusted-checkout inspection and command-injection regression tests.

## Success criteria

- Different PR-open events never share one replaceable pending concurrency slot.
- A simulated non-fast-forward push is retried from the newest default-branch state.
- A PR cannot be counted twice after retry or rerun.
- All new tests pass, existing executable tests pass, the web build succeeds, and the workflow remains valid YAML.

