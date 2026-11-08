import test from "node:test";
import assert from "node:assert/strict";
import { createReview } from "../services/reviewService.js";

test("createReview ignores caller-supplied id", async () => {
  const review = await createReview({
    id: "attacker-controlled",
    rating: 5,
    comment: "great work"
  });

  assert.notEqual(review.id, "attacker-controlled");
  assert.match(review.id, /^rev_\d+$/);
  assert.equal(review.rating, 5);
});

test("createReview rejects out-of-range ratings", async () => {
  await assert.rejects(
    () => createReview({ rating: 6, comment: "inflated rating" }),
    /Review rating must be an integer from 1 to 5/
  );
});
