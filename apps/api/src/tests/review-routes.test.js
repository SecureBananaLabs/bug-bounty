import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

function createAuthToken() {
  return signAccessToken({ sub: "usr_reviews", role: "client" });
}

test("POST /api/reviews requires authentication", async () => {
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
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jobId: "job_1",
        reviewerId: "usr_1",
        rating: 5,
        comment: "Great work"
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

test("POST /api/reviews preserves server-owned id", async () => {
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
        "content-type": "application/json",
        Authorization: `Bearer ${createAuthToken()}`
      },
      body: JSON.stringify({
        jobId: "job_2",
        reviewerId: "usr_2",
        rating: 4,
        comment: "Solid delivery",
        id: "rev_attacker_supplied",
        ignored: "drop-me"
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.jobId, "job_2");
    assert.equal(payload.data.reviewerId, "usr_2");
    assert.equal(payload.data.rating, 4);
    assert.equal(payload.data.comment, "Solid delivery");
    assert.match(payload.data.id, /^rev_\d+$/);
    assert.notEqual(payload.data.id, "rev_attacker_supplied");
    assert.equal("ignored" in payload.data, false);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
