import { afterEach, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { createProposal, resetProposalsForTests } from "../services/proposalService.js";
import { signAccessToken } from "../utils/jwt.js";

beforeEach(() => {
  resetProposalsForTests();
});

afterEach(() => {
  resetProposalsForTests();
});

async function withServer(fn) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    return await fn(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("GET /api/proposals rejects anonymous requests", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/proposals`);
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(payload, { success: false, message: "Unauthorized" });
  });
});

test("GET /api/proposals returns only proposals for the authenticated user", async () => {
  const userId = `usr_${Date.now()}`;
  const otherUserId = `usr_other_${Date.now()}`;

  await createProposal({
    title: "Freelancer proposal",
    freelancerId: userId,
    clientId: otherUserId
  });
  await createProposal({
    title: "Client proposal",
    freelancerId: otherUserId,
    clientId: userId
  });
  await createProposal({
    title: "Unrelated proposal",
    freelancerId: otherUserId,
    clientId: `usr_third_${Date.now()}`
  });

  const token = signAccessToken({ sub: userId, role: "freelancer" });

  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/proposals`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(payload.data.length, 2);
    assert.deepEqual(
      payload.data.map((proposal) => proposal.title).sort(),
      ["Client proposal", "Freelancer proposal"]
    );
  });
});
