const test = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");

const workflow = readFileSync(join(__dirname, "../workflows/update-pr-leaderboard.yml"), "utf8");

test("leaderboard workflow does not persist the GitHub token in origin URL", () => {
  assert.doesNotMatch(workflow, /git remote set-url origin "https:\/\/x-access-token:\$\{GH_TOKEN\}@github\.com/);
  assert.match(workflow, /git remote set-url origin "https:\/\/github\.com\/\$\{GITHUB_REPOSITORY\}\.git"/);
});

test("leaderboard workflow authenticates push with an ephemeral header", () => {
  assert.match(workflow, /auth_header="\$\(printf 'x-access-token:%s' "\$\{GH_TOKEN\}" \| base64 -w0\)"/);
  assert.match(workflow, /http\.https:\/\/github\.com\/\.extraheader=AUTHORIZATION: basic \$\{auth_header\}/);
  assert.match(workflow, /git .* push origin "HEAD:\$\{DEFAULT_BRANCH\}"/);
});
