import test from "node:test";
import assert from "node:assert/strict";
import { createReview } from "../services/reviewService.js";
import { createReviewJobSchema } from "../validators/review.js";

test("review creation requires a jobId", () => {
  const result = createReviewJobSchema.safeParse({
    reviewerId: "usr_client",
    revieweeId: "usr_freelancer",
    rating: 5,
    comment: "Great work"
  });

  assert.equal(result.success, false);
});

test("review creation preserves its job association", async () => {
  const payload = createReviewJobSchema.parse({
    jobId: "job_123",
    reviewerId: "usr_client",
    revieweeId: "usr_freelancer",
    rating: 5,
    comment: "Great work"
  });

  const review = await createReview(payload);

  assert.equal(review.jobId, "job_123");
});
