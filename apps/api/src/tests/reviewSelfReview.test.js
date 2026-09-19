import test from "node:test";
import assert from "node:assert/strict";
import { createReview } from "../services/reviewService.js";

function reviewPayload(overrides = {}) {
  return {
    rating: 5,
    comment: "Great collaboration",
    reviewerId: "usr_reviewer",
    revieweeId: "usr_reviewee",
    ...overrides
  };
}

test("createReview accepts reviews between different users", async () => {
  const review = await createReview(reviewPayload());

  assert.equal(review.reviewerId, "usr_reviewer");
  assert.equal(review.revieweeId, "usr_reviewee");
});

test("createReview rejects self-reviews", async () => {
  await assert.rejects(
    () => createReview(reviewPayload({ reviewerId: "usr_same", revieweeId: "usr_same" })),
    /Reviews must be between different users/
  );
});
