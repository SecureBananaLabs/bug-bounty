import test from "node:test";
import assert from "node:assert/strict";
import { createReview } from "../services/reviewService.js";

test("createReview preserves the server-generated id", async () => {
  const review = await createReview({
    id: "client_review",
    jobId: "job_123",
    reviewerId: "usr_client",
    revieweeId: "usr_freelancer",
    rating: 5,
    comment: "Great work and clear communication."
  });

  assert.match(review.id, /^rev_\d+$/);
  assert.equal(review.rating, 5);
  assert.equal(review.comment, "Great work and clear communication.");
});
