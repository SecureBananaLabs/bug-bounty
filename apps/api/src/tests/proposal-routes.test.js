import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

function createAuthToken() {
  return signAccessToken({ sub: "usr_proposals", role: "freelancer" });
}

test("POST /api/proposals requires authentication", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/proposals`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jobId: "job_1",
        freelancerId: "usr_1",
        coverLetter: "I can start today.",
        estimatedDuration: "2 weeks"
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Unauthorized");
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test("POST /api/proposals preserves server-owned id", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/proposals`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${createAuthToken()}`
      },
      body: JSON.stringify({
        jobId: "job_2",
        freelancerId: "usr_2",
        coverLetter: "Focused API fix.",
        estimatedDuration: "3 days",
        id: "prp_attacker_supplied",
        ignored: "drop-me"
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.jobId, "job_2");
    assert.equal(payload.data.freelancerId, "usr_2");
    assert.equal(payload.data.coverLetter, "Focused API fix.");
    assert.equal(payload.data.estimatedDuration, "3 days");
    assert.match(payload.data.id, /^prp_\d+$/);
    assert.notEqual(payload.data.id, "prp_attacker_supplied");
    assert.equal("ignored" in payload.data, false);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
