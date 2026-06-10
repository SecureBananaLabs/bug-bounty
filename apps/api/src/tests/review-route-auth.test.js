import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

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

test("POST /api/reviews rejects missing token", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/reviews`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        reviewerId: "usr_spoofed",
        revieweeId: "usr_bob",
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
  });
});

test("POST /api/reviews stores the authenticated user as reviewerId", async () => {
  await withServer(async (port) => {
    const token = signAccessToken({ sub: "usr_alice", role: "client" });
    const response = await fetch(`http://127.0.0.1:${port}/api/reviews`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        reviewerId: "usr_spoofed",
        revieweeId: "usr_bob",
        rating: 5,
        comment: "Great work"
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.reviewerId, "usr_alice");
    assert.equal(payload.data.revieweeId, "usr_bob");
    assert.equal(payload.data.rating, 5);
    assert.equal(payload.data.comment, "Great work");
  });
});

test("POST /api/reviews rejects invalid payloads", async () => {
  await withServer(async (port) => {
    const token = signAccessToken({ sub: "usr_alice", role: "client" });
    const response = await fetch(`http://127.0.0.1:${port}/api/reviews`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        revieweeId: "",
        rating: 6,
        comment: ""
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.match(payload.message, /revieweeId|rating|comment/);
  });
});
