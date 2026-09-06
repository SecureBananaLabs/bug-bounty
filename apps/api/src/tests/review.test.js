import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(callback) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    return await callback(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function postReview(baseUrl, payload) {
  return fetch(`${baseUrl}/api/reviews`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });
}

test("POST /api/reviews rejects missing targetId", async () => {
  await withServer(async (baseUrl) => {
    const response = await postReview(baseUrl, {
      reviewerId: "user_reviewer",
      rating: 5,
      comment: "Excellent work"
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, { success: false, message: "Invalid review payload" });
  });
});

test("POST /api/reviews rejects ratings outside the accepted range", async () => {
  await withServer(async (baseUrl) => {
    const response = await postReview(baseUrl, {
      reviewerId: "user_reviewer",
      targetId: "user_target",
      rating: 6,
      comment: "Excellent work"
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, { success: false, message: "Invalid review payload" });
  });
});

test("POST /api/reviews preserves generated ids over caller supplied ids", async () => {
  await withServer(async (baseUrl) => {
    const response = await postReview(baseUrl, {
      id: "rev_client",
      reviewerId: "user_reviewer",
      targetId: "user_target",
      rating: 5,
      comment: "Excellent work"
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.match(payload.data.id, /^rev_\d+$/);
    assert.notEqual(payload.data.id, "rev_client");
    assert.equal(payload.data.reviewerId, "user_reviewer");
    assert.equal(payload.data.targetId, "user_target");
    assert.equal(payload.data.rating, 5);
    assert.equal(payload.data.comment, "Excellent work");
  });
});
