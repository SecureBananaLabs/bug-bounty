import test from "node:test";
import assert from "node:assert/strict";

import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

test("POST /api/proposals rejects unauthenticated requests", async () => {
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
        "content-type": "application/json"
      },
      body: JSON.stringify({
        jobId: "job_1",
        freelancerId: "usr_freelancer",
        coverLetter: "I can do this",
        estimatedDuration: "3 days"
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(payload, {
      success: false,
      message: "Unauthorized"
    });
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test("POST /api/proposals ignores client-controlled id and keeps service-owned fields", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    const token = signAccessToken({ sub: "usr_freelancer", role: "freelancer" });
    const response = await fetch(`http://127.0.0.1:${port}/api/proposals`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        id: "attacker-controlled-id",
        jobId: "job_1",
        freelancerId: "usr_freelancer",
        coverLetter: "I can do this",
        estimatedDuration: "3 days",
        injected: true
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.match(payload.data.id, /^prp_/);
    assert.notEqual(payload.data.id, "attacker-controlled-id");
    assert.equal(payload.data.jobId, "job_1");
    assert.equal(payload.data.freelancerId, "usr_freelancer");
    assert.equal(payload.data.coverLetter, "I can do this");
    assert.equal(payload.data.estimatedDuration, "3 days");
    assert.equal("injected" in payload.data, false);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
