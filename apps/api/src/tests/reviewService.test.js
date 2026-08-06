import test from "node:test";
import assert from "node:assert/strict";
import { createReview } from "../services/reviewService.js";

test("createReview keeps id server-owned", async () => {
  const review = await createReview({
    id: "caller-controlled",
    jobId: "job_123",
    reviewerId: "usr_456",
    revieweeId: "usr_789",
    rating: 5,
    comment: "Excellent delivery"
  });

  assert.match(review.id, /^rev_\d+$/);
  assert.notEqual(review.id, "caller-controlled");
  assert.equal(review.jobId, "job_123");
  assert.equal(review.rating, 5);
  assert.equal(review.comment, "Excellent delivery");
});
