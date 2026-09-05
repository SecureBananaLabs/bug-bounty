import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ISSUE_LIMITATION_CLAUSE } from "../constants.js";
import { runBugScannerCli } from "../cli-runner.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");

function starredFetchImpl({ starred = true, issueNumber = 12001 } = {}) {
  return async (url, init) => {
    if (url.includes("/user/starred/")) {
      return {
        status: starred ? 204 : 404,
        statusText: starred ? "No Content" : "Not Found",
        async json() {
          return starred ? {} : { message: "Not Found" };
        }
      };
    }

    if (url.endsWith("/issues") && init?.method === "POST") {
      const requestBody = JSON.parse(init.body);
      return {
        ok: true,
        status: 201,
        async json() {
          return {
            number: issueNumber,
            html_url: `https://github.com/SecureBananaLabs/bug-bounty/issues/${issueNumber}`,
            title: requestBody.title
          };
        }
      };
    }

    throw new Error(`Unexpected fetch call: ${init?.method ?? "GET"} ${url}`);
  };
}

test("runBugScannerCli --execute creates an issue when starred and token is present", async () => {
  const stdout = [];
  const stderr = [];
  const calls = [];

  const result = await runBugScannerCli(
    ["--create-issues", "--execute", "--format", "json", "--root", repoRoot, "--max-issues", "1"],
    {
      env: { GITHUB_TOKEN: "test-token" },
      fetchImpl: async (url, init) => {
        calls.push({ url, method: init?.method });
        return starredFetchImpl({ issueNumber: 13001 })(url, init);
      },
      writeStdout: (line) => stdout.push(line),
      writeStderr: (line) => stderr.push(line)
    }
  );

  assert.equal(result.created.length, 1);
  assert.equal(result.created[0].result.dryRun, false);
  assert.equal(result.created[0].result.number, 13001);
  assert.ok(calls[0].url.includes("/user/starred/"));
  assert.ok(calls[1].url.endsWith("/issues") && calls[1].method === "POST");

  const payload = JSON.parse(stdout.join("\n"));
  assert.match(payload.created[0].issue.body, new RegExp(ISSUE_LIMITATION_CLAUSE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.ok(stderr.some((line) => line.includes("Verified SecureBananaLabs/bug-bounty is starred")));
});

test("runBugScannerCli --execute rejects unstarred repositories", async () => {
  await assert.rejects(
    () =>
      runBugScannerCli(
        ["--create-issues", "--execute", "--format", "json", "--root", repoRoot, "--max-issues", "1"],
        {
          env: { GITHUB_TOKEN: "test-token" },
          fetchImpl: starredFetchImpl({ starred: false }),
          writeStdout() {},
          writeStderr() {}
        }
      ),
    /must be starred/
  );
});
