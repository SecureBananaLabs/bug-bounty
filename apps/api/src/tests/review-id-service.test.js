import test from "node:test";
import assert from "node:assert/strict";
import { createReview } from "../services/reviewService.js";

test("createReview ignores caller-controlled id", async () => {
  const originalNow = Date.now;
  Date.now = () => 7890;

  try {
    const review = await createReview({
      id: "caller_rev",
      reviewerId: "usr_1",
      revieweeId: "usr_2",
      rating: 5
    });

    assert.equal(review.id, "rev_7890");
    assert.equal(review.rating, 5);
    assert.equal(review.revieweeId, "usr_2");
  } finally {
    Date.now = originalNow;
  }
});
