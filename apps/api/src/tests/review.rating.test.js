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

test("POST /api/reviews rejects ratings below 1", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/reviews`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(createValidReview({ rating: 0 }))
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "rating must be an integer between 1 and 5"
    });
  });
});

test("POST /api/reviews rejects ratings above 5", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/reviews`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(createValidReview({ rating: 6 }))
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "rating must be an integer between 1 and 5"
    });
  });
});

test("POST /api/reviews rejects non-integer ratings", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/reviews`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(createValidReview({ rating: 4.5 }))
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "rating must be an integer between 1 and 5"
    });
  });
});

test("POST /api/reviews keeps valid ratings working", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/reviews`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(createValidReview({ rating: 4 }))
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.rating, 4);
    assert.equal(payload.data.comment, "Great work");
    assert.equal(payload.data.reviewerId, "user_1");
    assert.equal(payload.data.revieweeId, "user_2");
    assert.match(payload.data.id, /^rev_/);
  });
});
