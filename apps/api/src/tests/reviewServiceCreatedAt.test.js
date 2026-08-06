import test from "node:test";
import assert from "node:assert/strict";
import { createReview } from "../services/reviewService.js";

test("createReview keeps createdAt server-owned", async () => {
  const review = await createReview({
    reviewerId: "usr_reviewer",
    revieweeId: "usr_reviewee",
    rating: 5,
    comment: "Excellent work.",
    createdAt: "1999-01-01T00:00:00.000Z"
  });

  assert.match(review.id, /^rev_/);
  assert.notEqual(review.createdAt, "1999-01-01T00:00:00.000Z");
  assert.doesNotThrow(() => new Date(review.createdAt).toISOString());
  assert.equal(review.reviewerId, "usr_reviewer");
  assert.equal(review.revieweeId, "usr_reviewee");
  assert.equal(review.rating, 5);
  assert.equal(review.comment, "Excellent work.");
});
