import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(run) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

function createValidReview(overrides = {}) {
  return {
    rating: 5,
    comment: "Great work",
    reviewerId: "user_1",
    revieweeId: "user_2",
    ...overrides
  };
}

test("POST /api/reviews rejects missing comments", async () => {
  await withServer(async (baseUrl) => {
    const review = createValidReview();
    delete review.comment;

    const response = await fetch(`${baseUrl}/api/reviews`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(review)
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "comment is required"
    });
  });
});

test("POST /api/reviews rejects blank comments", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/reviews`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(createValidReview({ comment: "   " }))
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "comment is required"
    });
  });
});

test("POST /api/reviews keeps valid comments working", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/reviews`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(createValidReview({ comment: "Delivered exactly what was requested." }))
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.comment, "Delivered exactly what was requested.");
    assert.equal(payload.data.rating, 5);
    assert.equal(payload.data.reviewerId, "user_1");
    assert.equal(payload.data.revieweeId, "user_2");
    assert.match(payload.data.id, /^rev_/);
  });
});
