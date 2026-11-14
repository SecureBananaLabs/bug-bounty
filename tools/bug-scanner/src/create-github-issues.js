import { ISSUE_LIMITATION_CLAUSE } from "./constants.js";
import { githubHeaders, parseJsonResponse } from "./github-client.js";

export function assertLimitationClause(body) {
  if (!body.includes(ISSUE_LIMITATION_CLAUSE)) {
    throw new Error("Issue body is missing the required bounty limitation clause");
  }
}

export async function createGitHubIssue(
  { owner, repo, token, title, body, labels },
  { dryRun = true, fetchImpl = globalThis.fetch } = {}
) {
  assertLimitationClause(body);

  if (dryRun) {
    return {
      dryRun: true,
      owner,
      repo,
      title,
      body,
      labels
    };
  }

  if (!token) {
    throw new Error("GITHUB_TOKEN is required when creating GitHub issues");
  }

  const response = await fetchImpl(`https://api.github.com/repos/${owner}/${repo}/issues`, {
    method: "POST",
    headers: githubHeaders(token),
    body: JSON.stringify({ title, body, labels })
  });

  const payload = await parseJsonResponse(response);
  if (!response.ok) {
    const message = payload?.message ?? response.statusText;
    throw new Error(`GitHub issue creation failed (${response.status}): ${message}`);
  }

  return {
    dryRun: false,
    number: payload.number,
    html_url: payload.html_url,
    title: payload.title
  };
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
