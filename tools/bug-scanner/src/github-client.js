const GITHUB_API_VERSION = "2022-11-28";

export function githubHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
    "User-Agent": "freelanceflow-bug-scanner",
    "X-GitHub-Api-Version": GITHUB_API_VERSION
  };
}

export async function parseJsonResponse(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

export async function assertRepositoryStarred(
  { owner, repo, token },
  { fetchImpl = globalThis.fetch } = {}
) {
  if (!token) {
    throw new Error("GITHUB_TOKEN is required to verify repository star status");
  }

  const response = await fetchImpl(`https://api.github.com/user/starred/${owner}/${repo}`, {
    method: "GET",
    headers: githubHeaders(token)
  });

  if (response.status === 204) {
    return true;
  }

  if (response.status === 404) {
    throw new Error(
      `Repository ${owner}/${repo} must be starred before creating issues (see README.md).`
    );
  }

  const payload = await parseJsonResponse(response);
  const message = payload?.message ?? response.statusText;
  throw new Error(`Unable to verify repository star status (${response.status}): ${message}`);
}
