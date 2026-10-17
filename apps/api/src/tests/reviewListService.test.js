import test from "node:test";
import assert from "node:assert/strict";
import { createReview, listReviews } from "../services/reviewService.js";

test("listReviews returns defensive snapshots", async () => {
  await createReview({
    jobId: "job_snapshot",
    reviewerId: "usr_reviewer",
    revieweeId: "usr_reviewee",
    rating: 4,
    comment: "Snapshot review"
  });

  const firstList = await listReviews();
  firstList.push({ id: "injected", comment: "Injected review" });
  firstList[0].comment = "Mutated review";

  const secondList = await listReviews();

  assert.equal(secondList.some((review) => review.id === "injected"), false);
  assert.equal(secondList.some((review) => review.comment === "Mutated review"), false);
  assert.equal(secondList.some((review) => review.comment === "Snapshot review"), true);
});
