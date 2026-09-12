import test from "node:test";
import assert from "node:assert/strict";
import { createReview } from "../services/reviewService.js";

test("createReview ignores caller supplied id", async () => {
  const review = await createReview({
    id: "rev_attacker_controlled",
    jobId: "job_123",
    reviewerId: "usr_client",
    rating: 5,
    comment: "Great work.",
  });

  assert.match(review.id, /^rev_\d+$/);
  assert.notEqual(review.id, "rev_attacker_controlled");
  assert.equal(review.jobId, "job_123");
  assert.equal(review.reviewerId, "usr_client");
  assert.equal(review.rating, 5);
  assert.equal(review.comment, "Great work.");
});
