import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

const proposalPayload = {
  id: "prp_client_controlled",
  jobId: "job_123",
  freelancerId: "usr_freelancer",
  coverLetter: "I can take this on quickly.",
  estimatedDuration: "3 days",
  unexpected: "ignore-me"
};

async function withServer(run) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await run(port);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("POST /api/proposals rejects unauthenticated requests", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/proposals`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(proposalPayload)
    });
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(payload, { success: false, message: "Unauthorized" });
  });
});

test("POST /api/proposals ignores client-controlled id and extra fields", async () => {
  await withServer(async (port) => {
    const token = signAccessToken({ sub: "usr_freelancer", role: "freelancer" });
    const response = await fetch(`http://127.0.0.1:${port}/api/proposals`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json"
      },
      body: JSON.stringify(proposalPayload)
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.notEqual(payload.data.id, proposalPayload.id);
    assert.equal(payload.data.jobId, proposalPayload.jobId);
    assert.equal(payload.data.freelancerId, proposalPayload.freelancerId);
    assert.equal(payload.data.coverLetter, proposalPayload.coverLetter);
    assert.equal(payload.data.estimatedDuration, proposalPayload.estimatedDuration);
    assert.equal("unexpected" in payload.data, false);
  });
});
