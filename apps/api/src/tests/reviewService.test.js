import test from "node:test";
import assert from "node:assert/strict";
import { createReview } from "../services/reviewService.js";

test("createReview preserves the server-owned id", async () => {
  const review = await createReview({
    id: "client_supplied_id",
    jobId: "job_123",
    reviewerId: "usr_reviewer",
    rating: 5,
    comment: "Great delivery and communication."
  });

  assert.match(review.id, /^rev_\d+$/);
  assert.notEqual(review.id, "client_supplied_id");
  assert.equal(review.jobId, "job_123");
  assert.equal(review.reviewerId, "usr_reviewer");
  assert.equal(review.rating, 5);
  assert.equal(review.comment, "Great delivery and communication.");
});
