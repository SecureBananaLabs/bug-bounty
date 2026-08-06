import test from "node:test";
import assert from "node:assert/strict";
import { createReview } from "../services/reviewService.js";

test("createReview preserves generated ids", async () => {
  const originalNow = Date.now;
  Date.now = () => 1710000000000;

  try {
    const review = await createReview({
      id: "rev_client_controlled",
      reviewerId: "usr_reviewer",
      revieweeId: "usr_reviewee",
      rating: 5,
      comment: "Great work."
    });

    assert.equal(review.id, "rev_1710000000000");
    assert.equal(review.reviewerId, "usr_reviewer");
    assert.equal(review.revieweeId, "usr_reviewee");
    assert.equal(review.rating, 5);
    assert.equal(review.comment, "Great work.");
  } finally {
    Date.now = originalNow;
  }
});
