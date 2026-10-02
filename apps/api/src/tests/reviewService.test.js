import test from "node:test";
import assert from "node:assert/strict";
import { createReview } from "../services/reviewService.js";

test("createReview keeps id server-owned", async () => {
  const suppliedId = "rev_attacker_controlled";

  const review = await createReview({
    id: suppliedId,
    rating: 5,
    comment: "solid work",
  });

  assert.notEqual(review.id, suppliedId);
  assert.match(review.id, /^rev_[0-9]+$/);
  assert.equal(review.rating, 5);
  assert.equal(review.comment, "solid work");
});
