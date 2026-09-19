import test from "node:test";
import assert from "node:assert/strict";
import { createReview, listReviews } from "../services/reviewService.js";

test("createReview returns a defensive snapshot", async () => {
  const created = await createReview({
    jobId: "job_snapshot",
    reviewerId: "client_snapshot",
    revieweeId: "freelancer_snapshot",
    rating: 5,
    comment: "Original review"
  });

  created.rating = 1;
  created.comment = "Mutated review";

  const reviews = await listReviews();

  assert.equal(reviews.some((review) => review.rating === 1), false);
  assert.equal(reviews.some((review) => review.comment === "Mutated review"), false);
  assert.equal(reviews.some((review) => review.comment === "Original review"), true);
});
