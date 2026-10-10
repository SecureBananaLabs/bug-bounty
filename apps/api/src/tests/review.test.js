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
    await run(port);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

function postReview(port, body) {
  return fetch(`http://127.0.0.1:${port}/api/reviews`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
}

const validReview = {
  reviewerId: "user_reviewer",
  revieweeId: "user_reviewee",
  rating: 5,
  comment: "Great delivery"
};

test("POST /api/reviews creates a valid review", async () => {
  await withServer(async (port) => {
    const response = await postReview(port, validReview);
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.match(payload.data.id, /^rev_/);
    assert.equal(payload.data.reviewerId, validReview.reviewerId);
    assert.equal(payload.data.revieweeId, validReview.revieweeId);
    assert.equal(payload.data.rating, validReview.rating);
    assert.equal(payload.data.comment, validReview.comment);
  });
});

test("POST /api/reviews rejects ratings outside the 1-5 integer range", async () => {
  await withServer(async (port) => {
    for (const rating of [0, -1, 6, 2.5, "5", null]) {
      const response = await postReview(port, { ...validReview, rating });
      const payload = await response.json();

      assert.equal(response.status, 400);
      assert.deepEqual(payload, {
        success: false,
        message: "Invalid review payload"
      });
    }
  });
});

test("POST /api/reviews rejects missing identifiers and empty comments", async () => {
  await withServer(async (port) => {
    for (const body of [
      { ...validReview, reviewerId: "" },
      { ...validReview, revieweeId: "" },
      { ...validReview, comment: "" },
      { rating: 4, comment: "Missing parties" }
    ]) {
      const response = await postReview(port, body);
      const payload = await response.json();

      assert.equal(response.status, 400);
      assert.equal(payload.success, false);
    }
  });
});
