import test from "node:test";
import assert from "node:assert/strict";
import { createReview } from "../services/reviewService.js";

test("createReview uses a server-owned createdAt timestamp", async () => {
  const review = await createReview({
    rating: 5,
    comment: "Excellent delivery",
    reviewerId: "usr_reviewer",
    revieweeId: "usr_reviewee",
    createdAt: "2000-01-01T00:00:00.000Z"
  });

  assert.match(review.id, /^rev_\d+$/);
  assert.notEqual(review.createdAt, "2000-01-01T00:00:00.000Z");
  assert.doesNotThrow(() => new Date(review.createdAt).toISOString());
  assert.equal(review.rating, 5);
  assert.equal(review.comment, "Excellent delivery");
});
