import test from "node:test";
import assert from "node:assert/strict";
import { createReview, listReviews } from "../services/reviewService.js";

test("review service returns defensive snapshots", async () => {
  const review = await createReview({
    reviewerId: "usr_client",
    revieweeId: "usr_freelancer",
    rating: 5,
    comment: "Great collaboration"
  });

  review.comment = "mutated through create response";
  review.rating = 1;

  const firstSnapshot = await listReviews();
  const storedReview = firstSnapshot.find((item) => item.id === review.id);

  assert.equal(storedReview.comment, "Great collaboration");
  assert.equal(storedReview.rating, 5);

  firstSnapshot.push({ id: "rev_injected", rating: 1, comment: "injected" });
  storedReview.comment = "mutated through list response";
  storedReview.rating = 2;

  const secondSnapshot = await listReviews();
  const persistedReview = secondSnapshot.find((item) => item.id === review.id);

  assert.equal(secondSnapshot.some((item) => item.id === "rev_injected"), false);
  assert.equal(persistedReview.comment, "Great collaboration");
  assert.equal(persistedReview.rating, 5);
});
