import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

const reviewPayload = {
  id: "rev_client_controlled",
  jobId: "job_123",
  reviewerId: "usr_456",
  rating: 5,
  comment: "Delivered exactly what was promised.",
  extra: "ignore-me"
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

test("POST /api/reviews rejects unauthenticated requests", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/reviews`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(reviewPayload)
    });
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(payload, { success: false, message: "Unauthorized" });
  });
});

test("POST /api/reviews ignores client-controlled id and extra fields", async () => {
  await withServer(async (port) => {
    const token = signAccessToken({ sub: "usr_456", role: "client" });
    const response = await fetch(`http://127.0.0.1:${port}/api/reviews`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json"
      },
      body: JSON.stringify(reviewPayload)
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.notEqual(payload.data.id, reviewPayload.id);
    assert.equal(payload.data.jobId, reviewPayload.jobId);
    assert.equal(payload.data.reviewerId, reviewPayload.reviewerId);
    assert.equal(payload.data.rating, reviewPayload.rating);
    assert.equal(payload.data.comment, reviewPayload.comment);
    assert.equal("extra" in payload.data, false);
  });
});
