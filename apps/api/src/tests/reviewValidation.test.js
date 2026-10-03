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

  const { port } = server.address();

  try {
    await callback(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function postReview(baseUrl, body) {
  return fetch(`${baseUrl}/api/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}

test("POST /api/reviews rejects missing reviewerId", async () => {
  await withServer(async (baseUrl) => {
    const response = await postReview(baseUrl, {
      targetId: "user_2",
      rating: 5,
      comment: "Great work"
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Validation failed");
    assert.equal(payload.errors[0].path[0], "reviewerId");
  });
});

test("POST /api/reviews rejects invalid rating", async () => {
  await withServer(async (baseUrl) => {
    const response = await postReview(baseUrl, {
      reviewerId: "user_1",
      targetId: "user_2",
      rating: 6,
      comment: "Great work"
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.equal(payload.errors[0].path[0], "rating");
  });
});

test("POST /api/reviews creates review for valid payload", async () => {
  await withServer(async (baseUrl) => {
    const response = await postReview(baseUrl, {
      reviewerId: "user_1",
      targetId: "user_2",
      rating: 5,
      comment: "Great work"
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.reviewerId, "user_1");
    assert.equal(payload.data.targetId, "user_2");
    assert.equal(payload.data.rating, 5);
    assert.equal(payload.data.comment, "Great work");
    assert.match(payload.data.id, /^rev_/);
  });
});
