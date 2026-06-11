import test from "node:test";
import assert from "node:assert/strict";

import { createReview } from "../services/reviewService.js";

test("createReview preserves the server-generated id", async () => {
  const review = await createReview({
    id: "client-controlled-id",
    jobId: "job_123",
    reviewerId: "usr_456",
    rating: 5,
    comment: "Clear communication"
  });

  assert.match(review.id, /^rev_\d+$/);
  assert.notEqual(review.id, "client-controlled-id");
  assert.equal(review.jobId, "job_123");
  assert.equal(review.reviewerId, "usr_456");
  assert.equal(review.rating, 5);
  assert.equal(review.comment, "Clear communication");
});