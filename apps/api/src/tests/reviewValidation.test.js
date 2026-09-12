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

async function postReview(port, body) {
  return fetch(`http://127.0.0.1:${port}/api/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}

test("POST /api/reviews creates a valid review", async () => {
  await withServer(async (port) => {
    const response = await postReview(port, {
      reviewerId: "usr_reviewer",
      revieweeId: "usr_reviewee",
      rating: 5,
      comment: "Excellent collaboration and communication."
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.reviewerId, "usr_reviewer");
    assert.equal(payload.data.revieweeId, "usr_reviewee");
    assert.equal(payload.data.rating, 5);
    assert.equal(payload.data.comment, "Excellent collaboration and communication.");
    assert.match(payload.data.id, /^rev_/);
  });
});

test("POST /api/reviews rejects invalid rating values", async () => {
  await withServer(async (port) => {
    for (const rating of [0, -1, 2.5, 6]) {
      const response = await postReview(port, {
        reviewerId: "usr_reviewer",
        revieweeId: "usr_reviewee",
        rating,
        comment: "Rating should be rejected."
      });
      const payload = await response.json();

      assert.equal(response.status, 400);
      assert.deepEqual(payload, {
        success: false,
        message: "Invalid review payload"
      });
    }
  });
});
