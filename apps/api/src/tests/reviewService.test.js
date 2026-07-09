import test from "node:test";
import assert from "node:assert/strict";
import { createReview, listReviews } from "../services/reviewService.js";

test("createReview rejects invalid ratings", async () => {
  // Reject non-number
  await assert.rejects(
    () => createReview({ rating: "5", reviewerId: "usr_1", revieweeId: "usr_2" }),
    /Rating must be a number/
  );

  // Reject non-integer
  await assert.rejects(
    () => createReview({ rating: 4.5, reviewerId: "usr_1", revieweeId: "usr_2" }),
    /Rating must be an integer/
  );

  // Reject out of range (< 1)
  await assert.rejects(
    () => createReview({ rating: 0, reviewerId: "usr_1", revieweeId: "usr_2" }),
    /Rating must be an integer between 1 and 5/
  );

  // Reject out of range (> 5)
  await assert.rejects(
    () => createReview({ rating: 6, reviewerId: "usr_1", revieweeId: "usr_2" }),
    /Rating must be an integer between 1 and 5/
  );
});

test("createReview rejects self-reviews where reviewerId equals revieweeId", async () => {
  await assert.rejects(
    () => createReview({ rating: 5, reviewerId: "usr_same", revieweeId: "usr_same" }),
    /Reviewer and reviewee cannot be the same user/
  );
});

test("createReview accepts valid ratings and distinct users", async () => {
  const payload = {
    rating: 5,
    reviewerId: "usr_reviewer",
    revieweeId: "usr_reviewee",
    comment: "Excellent work!"
  };

  const review = await createReview(payload);
  assert.ok(review.id.startsWith("rev_"));
  assert.strictEqual(review.rating, 5);
  assert.strictEqual(review.reviewerId, "usr_reviewer");
  assert.strictEqual(review.revieweeId, "usr_reviewee");

  const list = await listReviews();
  const found = list.find(r => r.id === review.id);
  assert.ok(found);
  assert.strictEqual(found.rating, 5);
});
