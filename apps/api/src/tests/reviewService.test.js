import test from "node:test";
import assert from "node:assert/strict";
import { createReview, listReviews } from "../services/reviewService.js";

test("createReview rejects self-review payloads", async () => {
  let error;
  try {
    await createReview({ reviewerId: "usr_1", revieweeId: "usr_1", rating: 5 });
  } catch (err) {
    error = err;
  }
  assert.ok(error, "expected self-review to throw");
  assert.equal(error.status, 400);
  assert.equal(error.message, "Self-reviews are not allowed");
});

test("createReview accepts valid different-user review", async () => {
  const review = await createReview({ reviewerId: "usr_1", revieweeId: "usr_2", rating: 4 });
  assert.ok(review.id.startsWith("rev_"));
  assert.equal(review.reviewerId, "usr_1");
  assert.equal(review.revieweeId, "usr_2");
});

test("listReviews returns records without self-reviews", async () => {
  const all = await listReviews();
  const selfReview = all.find(r => r.reviewerId === r.revieweeId);
  assert.equal(selfReview, undefined);
});
