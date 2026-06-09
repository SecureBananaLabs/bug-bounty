import test from "node:test";
import assert from "node:assert/strict";
import { createReview } from "../services/reviewService.js";

test("createReview owns the creation timestamp", async () => {
  const clientTimestamp = "1999-01-01T00:00:00.000Z";

  const review = await createReview({
    id: "client-review-id",
    jobId: "job_1",
    reviewerId: "user_1",
    rating: 5,
    comment: "Great work",
    createdAt: clientTimestamp
  });

  assert.notEqual(review.id, "client-review-id");
  assert.notEqual(review.createdAt, clientTimestamp);
  assert.equal(review.jobId, "job_1");
  assert.equal(review.rating, 5);
  assert.doesNotThrow(() => new Date(review.createdAt).toISOString());
});
