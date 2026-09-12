import test from "node:test";
import assert from "node:assert/strict";
import { createReview, listReviews } from "../services/reviewService.js";

test("review service returns defensive copies of stored reviews", async () => {
  const created = await createReview({
    jobId: "job_1",
    reviewerId: "client_1",
    freelancerId: "freelancer_1",
    rating: 5,
    comment: "Excellent delivery.",
  });

  created.comment = "mutated returned review";

  const firstList = await listReviews();
  const storedReview = firstList.find((review) => review.id === created.id);

  assert.equal(storedReview.comment, "Excellent delivery.");

  firstList.push({ id: "rev_fake", comment: "injected" });
  storedReview.comment = "mutated list review";

  const secondList = await listReviews();
  const preservedReview = secondList.find((review) => review.id === created.id);

  assert.equal(secondList.some((review) => review.id === "rev_fake"), false);
  assert.equal(preservedReview.comment, "Excellent delivery.");
});
