import test from "node:test";
import assert from "node:assert/strict";
import { createReview } from "../services/reviewService.js";

test("createReview keeps review ids server-owned", async () => {
  const review = await createReview({
    id: "rev_attacker",
    jobId: "job_1",
    reviewerId: "usr_1",
    rating: 5
  });

  assert.match(review.id, /^rev_\d+$/);
  assert.notEqual(review.id, "rev_attacker");
  assert.equal(review.jobId, "job_1");
  assert.equal(review.reviewerId, "usr_1");
  assert.equal(review.rating, 5);
});
