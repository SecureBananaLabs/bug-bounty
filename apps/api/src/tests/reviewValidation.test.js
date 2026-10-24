import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createApp } from "../app.js";

let server;
let baseUrl;

before(async () => {
  const app = createApp();

  await new Promise((resolve) => {
    server = app.listen(0, "127.0.0.1", resolve);
  });

  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

async function postReview(payload) {
  const response = await fetch(`${baseUrl}/api/reviews`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });

  return {
    status: response.status,
    body: await response.json(),
  };
}

test("POST /api/reviews persists a valid, normalized review", async () => {
  const result = await postReview({
    reviewerId: "  reviewer-42  ",
    targetId: "  target-17  ",
    rating: 5,
    comment: "  Excellent delivery and communication.  ",
  });

  assert.equal(result.status, 201);
  assert.equal(result.body.reviewerId, "reviewer-42");
  assert.equal(result.body.targetId, "target-17");
  assert.equal(result.body.rating, 5);
  assert.equal(result.body.comment, "Excellent delivery and communication.");
});

test("POST /api/reviews rejects ratings outside the accepted 1-5 range", async () => {
  for (const rating of [-1, 0, 6, 5.5]) {
    const result = await postReview({
      reviewerId: "reviewer-42",
      targetId: "target-17",
      rating,
    });

    assert.equal(result.status, 400);
    assert.equal(result.body.error, "Invalid review payload.");
    assert.ok(result.body.details.some((detail) => detail.field === "rating"));
  }
});

test("POST /api/reviews rejects missing required identifiers", async () => {
  const missingReviewer = await postReview({
    targetId: "target-17",
    rating: 4,
  });

  assert.equal(missingReviewer.status, 400);
  assert.ok(
    missingReviewer.body.details.some(
      (detail) => detail.field === "reviewerId",
    ),
  );

  const missingTarget = await postReview({
    reviewerId: "reviewer-42",
    rating: 4,
  });

  assert.equal(missingTarget.status, 400);
  assert.ok(
    missingTarget.body.details.some((detail) => detail.field === "targetId"),
  );
});

test("POST /api/reviews rejects unknown and prototype-pollution properties", async () => {
  const payload = JSON.parse(`
    {
      "reviewerId": "reviewer-42",
      "targetId": "target-17",
      "rating": 4,
      "admin": true,
      "__proto__": { "polluted": true }
    }
  `);

  const result = await postReview(payload);

  assert.equal(result.status, 400);
  assert.equal(result.body.error, "Invalid review payload.");
  assert.ok(
    result.body.details.some((detail) => detail.field === "body"),
  );
  assert.equal({}.polluted, undefined);
});

test("POST /api/reviews rejects empty and oversized comments", async () => {
  const emptyComment = await postReview({
    reviewerId: "reviewer-42",
    targetId: "target-17",
    rating: 4,
    comment: "   ",
  });

  assert.equal(emptyComment.status, 400);

  const oversizedComment = await postReview({
    reviewerId: "reviewer-42",
    targetId: "target-17",
    rating: 4,
    comment: "x".repeat(2001),
  });

  assert.equal(oversizedComment.status, 400);
});
