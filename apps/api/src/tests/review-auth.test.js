import assert from "node:assert/strict";
import test from "node:test";
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
    const { port } = server.address();
    return await run(port);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("POST /api/reviews requires authentication", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/reviews`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        targetUserId: "usr_2",
        jobId: "job_1",
        rating: 5
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.equal(payload.success, false);
    assert.match(payload.message, /unauthorized/i);
  });
});

test("POST /api/reviews ignores client-controlled ids", async () => {
  await withServer(async (port) => {
    const token = signAccessToken({ sub: "usr_reviewer", role: "freelancer" });
    const response = await fetch(`http://127.0.0.1:${port}/api/reviews`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        id: "client-id",
        targetUserId: "usr_2",
        jobId: "job_1",
        rating: 5,
        comment: "Solid work"
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.match(payload.data.id, /^rev_/);
    assert.notEqual(payload.data.id, "client-id");
    assert.equal(payload.data.targetUserId, "usr_2");
    assert.equal(payload.data.rating, 5);
  });
});
