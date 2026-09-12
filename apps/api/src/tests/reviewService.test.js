import test from "node:test";
import assert from "node:assert/strict";
import { createReview } from "../services/reviewService.js";

test("createReview keeps createdAt server-owned", async () => {
  const before = Date.now();
  const review = await createReview({
    reviewerId: "usr_reviewer",
    revieweeId: "usr_reviewee",
    rating: 5,
    comment: "Great collaboration",
    createdAt: "2000-01-01T00:00:00.000Z"
  });
  const after = Date.now();

  const createdAt = Date.parse(review.createdAt);

  assert.match(review.id, /^rev_\d+$/);
  assert.notEqual(review.createdAt, "2000-01-01T00:00:00.000Z");
  assert.ok(createdAt >= before);
  assert.ok(createdAt <= after);
  assert.equal(review.reviewerId, "usr_reviewer");
  assert.equal(review.revieweeId, "usr_reviewee");
  assert.equal(review.rating, 5);
  assert.equal(review.comment, "Great collaboration");
});
