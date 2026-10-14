import test from "node:test";
import assert from "node:assert/strict";

import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

test("POST /api/reviews rejects unauthenticated requests", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/reviews`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        jobId: "job_1",
        reviewerId: "usr_reviewer",
        rating: 5,
        comment: "Great work"
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

test("POST /api/reviews ignores client-controlled id and keeps service-owned fields", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    const token = signAccessToken({ sub: "usr_reviewer", role: "client" });
    const response = await fetch(`http://127.0.0.1:${port}/api/reviews`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        id: "attacker-controlled-id",
        jobId: "job_1",
        reviewerId: "usr_reviewer",
        rating: 5,
        comment: "Great work",
        injected: true
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.match(payload.data.id, /^rev_/);
    assert.notEqual(payload.data.id, "attacker-controlled-id");
    assert.equal(payload.data.jobId, "job_1");
    assert.equal(payload.data.reviewerId, "usr_reviewer");
    assert.equal(payload.data.rating, 5);
    assert.equal(payload.data.comment, "Great work");
    assert.equal("injected" in payload.data, false);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
