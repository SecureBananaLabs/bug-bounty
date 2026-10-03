import test from "node:test";
import assert from "node:assert/strict";
import { ISSUE_LIMITATION_CLAUSE } from "../constants.js";
import { assertLimitationClause, createGitHubIssue } from "../create-github-issues.js";
import { findingKey, runRecursiveIssuePipeline } from "../recursive-issue-pipeline.js";
import { formatFindingAsIssue } from "../issue-formatter.js";

const sampleIssue = {
  owner: "SecureBananaLabs",
  repo: "bug-bounty",
  token: "test-token",
  title: "[bug-scanner] Example",
  body: `Summary\n\n${ISSUE_LIMITATION_CLAUSE}`,
  labels: ["bug"]
};

test("assertLimitationClause requires the exact bounty string", () => {
  assert.doesNotThrow(() => assertLimitationClause(sampleIssue.body));
  assert.throws(
    () => assertLimitationClause("missing clause"),
    /required bounty limitation clause/
  );
});

test("createGitHubIssue dry-run returns a plan without network access", async () => {
  const result = await createGitHubIssue(sampleIssue, { dryRun: true });

  assert.equal(result.dryRun, true);
  assert.equal(result.title, sampleIssue.title);
  assert.match(result.body, /11398/);
});

test("createGitHubIssue execute posts to the GitHub REST API", async () => {
  let requestBody;
  const fetchImpl = async (url, init) => {
    requestBody = JSON.parse(init.body);
    return {
      ok: true,
      async json() {
        return {
          number: 12001,
          html_url: "https://github.com/SecureBananaLabs/bug-bounty/issues/12001",
          title: requestBody.title
        };
      }
    };
  };

  const result = await createGitHubIssue(sampleIssue, {
    dryRun: false,
    fetchImpl
  });

  assert.equal(result.dryRun, false);
  assert.equal(result.number, 12001);
  assert.equal(requestBody.title, sampleIssue.title);
  assert.equal(requestBody.body, sampleIssue.body);
});

test("createGitHubIssue execute requires GITHUB_TOKEN", async () => {
  await assert.rejects(
    () => createGitHubIssue({ ...sampleIssue, token: "" }, { dryRun: false }),
    /GITHUB_TOKEN is required/
  );
});

test("createGitHubIssue surfaces GitHub API errors", async () => {
  const fetchImpl = async () => ({
    ok: false,
    status: 422,
    statusText: "Unprocessable Entity",
    async json() {
      return {
        message: "Validation Failed",
        errors: [{ field: "title", code: "invalid" }]
      };
    }
  });

  await assert.rejects(
    () => createGitHubIssue(sampleIssue, { dryRun: false, fetchImpl }),
    /GitHub issue creation failed \(422\): Validation Failed/
  );
});

test("runRecursiveIssuePipeline dry-run creates one issue by default", async () => {
  const created = await runRecursiveIssuePipeline({
    rootDir: process.cwd(),
    owner: "SecureBananaLabs",
    repo: "bug-bounty",
    dryRun: true,
    maxIssues: 1,
    maxDepth: 2,
    scan: () => [
      {
        id: "demo",
        severity: "high",
        title: "First finding",
        file: "apps/api/src/example.js",
        line: 1,
        description: "desc",
        recommendation: "fix",
        relatedFiles: ["apps/api/src/other.js"]
      },
      {
        id: "demo",
        severity: "medium",
        title: "Second finding",
        file: "apps/api/src/other.js",
        line: 2,
        description: "desc",
        recommendation: "fix",
        relatedFiles: []
      }
    ]
  });

  assert.equal(created.length, 1);
  assert.equal(created[0].result.dryRun, true);
  assert.match(created[0].issue.body, new RegExp(ISSUE_LIMITATION_CLAUSE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
});

test("runRecursiveIssuePipeline respects maxIssues across recursive passes", async () => {
  let scanCount = 0;
  const created = await runRecursiveIssuePipeline({
    rootDir: process.cwd(),
    owner: "SecureBananaLabs",
    repo: "bug-bounty",
    dryRun: true,
    maxIssues: 2,
    maxDepth: 2,
    scan: () => {
      scanCount += 1;
      if (scanCount === 1) {
        return [
          {
            id: "a",
            severity: "high",
            title: "First",
            file: "apps/a.js",
            line: 1,
            description: "d",
            recommendation: "r",
            relatedFiles: ["apps/b.js"]
          }
        ];
      }

      return [
        {
          id: "b",
          severity: "high",
          title: "Second",
          file: "apps/b.js",
          line: 2,
          description: "d",
          recommendation: "r",
          relatedFiles: []
        }
      ];
    }
  });

  assert.equal(created.length, 2);
  assert.equal(scanCount, 2);
  assert.notEqual(findingKey(created[0].finding), findingKey(created[1].finding));
});

test("formatFindingAsIssue always embeds the exact limitation clause", () => {
  const issue = formatFindingAsIssue({
    id: "demo",
    severity: "high",
    title: "Example",
    file: "apps/api/src/example.js",
    line: 3,
    description: "Example",
    recommendation: "Fix it"
  });

  assert.equal(issue.body.includes(ISSUE_LIMITATION_CLAUSE), true);
});
