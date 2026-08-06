import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { createReview } from "../services/reviewService.js";

async function withServer(run) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("POST /api/reviews rejects invalid and unexpected fields", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rating: 6,
        comment: "",
        reviewerId: "usr_client",
        revieweeId: "usr_freelancer",
        adminOverride: true
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Invalid review payload");
    assert.ok(Array.isArray(payload.issues));
    assert.ok(payload.issues.some((issue) => issue.path.includes("rating")));
    assert.ok(payload.issues.some((issue) => issue.path.includes("comment")));
    assert.ok(payload.issues.some((issue) => issue.code === "unrecognized_keys"));
  });
});

test("POST /api/reviews validates payloads before storage", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rating: 5,
        comment: "Excellent delivery.",
        reviewerId: "usr_client",
        revieweeId: "usr_freelancer"
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.match(payload.data.id, /^rev_\d+$/);
    assert.equal(payload.data.rating, 5);
    assert.equal(payload.data.comment, "Excellent delivery.");
    assert.equal(payload.data.reviewerId, "usr_client");
    assert.equal(payload.data.revieweeId, "usr_freelancer");
  });
});

test("createReview keeps ids server-owned", async () => {
  const review = await createReview({
    id: "rev_attacker_controlled",
    reviewerId: "usr_client",
    revieweeId: "usr_freelancer",
    rating: 5,
    comment: "Excellent delivery."
  });

  assert.notEqual(review.id, "rev_attacker_controlled");
  assert.match(review.id, /^rev_\d+$/);
  assert.equal(review.reviewerId, "usr_client");
  assert.equal(review.revieweeId, "usr_freelancer");
  assert.equal(review.rating, 5);
});
