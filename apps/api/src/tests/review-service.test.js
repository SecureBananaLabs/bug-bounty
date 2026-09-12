import test from "node:test";
import assert from "node:assert/strict";
import { createReview } from "../services/reviewService.js";

test("createReview preserves the server-generated id", async () => {
  const review = await createReview({
    id: "client_controlled_id",
    reviewerId: "usr_reviewer",
    revieweeId: "usr_reviewee",
    rating: 5,
    comment: "Great work."
  });

  assert.match(review.id, /^rev_\d+$/);
  assert.notEqual(review.id, "client_controlled_id");
  assert.equal(review.reviewerId, "usr_reviewer");
  assert.equal(review.revieweeId, "usr_reviewee");
  assert.equal(review.rating, 5);
  assert.equal(review.comment, "Great work.");
});
