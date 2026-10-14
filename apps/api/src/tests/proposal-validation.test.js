import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

function createAuthToken() {
  return signAccessToken({ sub: "usr_proposals", role: "freelancer" });
}

async function withServer(run) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    await run(server.address().port);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("POST /api/proposals rejects missing estimatedDuration", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/proposals`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${createAuthToken()}`
      },
      body: JSON.stringify({
        jobId: "job_1",
        freelancerId: "usr_1",
        coverLetter: "I can start today."
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "estimatedDuration is required");
  });
});

test("POST /api/proposals accepts non-empty estimatedDuration", async () => {
  await withServer(async (port) => {
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
        estimatedDuration: "3 days"
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.estimatedDuration, "3 days");
  });
});
