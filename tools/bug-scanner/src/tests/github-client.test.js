import test from "node:test";
import assert from "node:assert/strict";
import { assertRepositoryStarred } from "../github-client.js";

test("assertRepositoryStarred passes when GitHub returns 204", async () => {
  const fetchImpl = async () => ({
    status: 204,
    statusText: "No Content",
    async json() {
      return {};
    }
  });

  await assert.doesNotReject(() =>
    assertRepositoryStarred(
      { owner: "SecureBananaLabs", repo: "bug-bounty", token: "test-token" },
      { fetchImpl }
    )
  );
});

test("assertRepositoryStarred fails when repository is not starred", async () => {
  const fetchImpl = async () => ({
    status: 404,
    statusText: "Not Found",
    async json() {
      return { message: "Not Found" };
    }
  });

  await assert.rejects(
    () =>
      assertRepositoryStarred(
        { owner: "SecureBananaLabs", repo: "bug-bounty", token: "test-token" },
        { fetchImpl }
      ),
    /must be starred/
  );
});

test("assertRepositoryStarred requires GITHUB_TOKEN", async () => {
  await assert.rejects(
    () => assertRepositoryStarred({ owner: "a", repo: "b", token: "" }),
    /GITHUB_TOKEN is required/
  );
});

test("assertRepositoryStarred surfaces non-404 API failures", async () => {
  const fetchImpl = async () => ({
    status: 401,
    statusText: "Unauthorized",
    async json() {
      return { message: "Bad credentials" };
    }
  });

  await assert.rejects(
    () =>
      assertRepositoryStarred(
        { owner: "SecureBananaLabs", repo: "bug-bounty", token: "bad" },
        { fetchImpl }
      ),
    /Unable to verify repository star status \(401\): Bad credentials/
  );
});
