import test from "node:test";
import assert from "node:assert/strict";

import { createReview } from "../services/reviewService.js";

test("createReview ignores a client-provided id", async () => {
  const review = await createReview({
    id: "client-controlled-id",
    jobId: "job_123",
    reviewerId: "usr_456",
    rating: 5,
    comment: "Clear communication"
  });

  assert.match(review.id, /^rev_[0-9a-f-]+$/);
  assert.notStrictEqual(review.id, "client-controlled-id");
  assert.strictEqual(review.jobId, "job_123");
  assert.strictEqual(review.reviewerId, "usr_456");
  assert.strictEqual(review.rating, 5);
  assert.strictEqual(review.comment, "Clear communication");
});