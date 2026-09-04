import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withApiServer(callback) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await callback(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function postReview(baseUrl, payload) {
  const response = await fetch(`${baseUrl}/api/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  return {
    response,
    payload: await response.json()
  };
}

test("POST /api/reviews accepts a valid review payload", async () => {
  await withApiServer(async (baseUrl) => {
    const { response, payload } = await postReview(baseUrl, {
      rating: 5,
      comment: "Great collaboration and clear requirements.",
      reviewerId: "user_client",
      revieweeId: "user_freelancer"
    });

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.rating, 5);
    assert.equal(payload.data.comment, "Great collaboration and clear requirements.");
    assert.equal(payload.data.reviewerId, "user_client");
    assert.equal(payload.data.revieweeId, "user_freelancer");
    assert.match(payload.data.id, /^rev_/);
  });
});

test("POST /api/reviews rejects ratings outside 1 to 5", async () => {
  await withApiServer(async (baseUrl) => {
    const { response, payload } = await postReview(baseUrl, {
      rating: 6,
      comment: "Invalid rating should not be stored.",
      reviewerId: "user_client",
      revieweeId: "user_freelancer"
    });

    assert.equal(response.status, 400);
    assert.deepEqual(payload, { success: false, message: "Invalid review payload" });
  });
});

test("POST /api/reviews rejects unexpected payload fields", async () => {
  await withApiServer(async (baseUrl) => {
    const { response, payload } = await postReview(baseUrl, {
      rating: 4,
      comment: "Extra fields should not be persisted.",
      reviewerId: "user_client",
      revieweeId: "user_freelancer",
      adminOverride: true
    });

    assert.equal(response.status, 400);
    assert.deepEqual(payload, { success: false, message: "Invalid review payload" });
  });
});
