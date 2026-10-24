import test from "node:test";
import assert from "node:assert/strict";
import { createReview } from "../services/reviewService.js";

test("createReview preserves the server-generated review id", async () => {
  const review = await createReview({
    id: "rev_client_controlled",
    jobId: "job_123",
    reviewerId: "usr_456",
    rating: 5,
    comment: "Fast and accurate"
  });

  assert.match(review.id, /^rev_\d+$/);
  assert.equal(review.jobId, "job_123");
  assert.equal(review.reviewerId, "usr_456");
  assert.equal(review.rating, 5);
  assert.equal(review.comment, "Fast and accurate");
});
