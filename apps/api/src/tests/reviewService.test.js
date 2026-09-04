import test from "node:test";
import assert from "node:assert/strict";
import { createReview } from "../services/reviewService.js";

test("createReview keeps server-owned ids authoritative", async () => {
  const review = await createReview({
    id: "client-controlled-id",
    rating: 5,
    comment: "Great work.",
  });

  assert.match(review.id, /^rev_\d+$/);
  assert.notEqual(review.id, "client-controlled-id");
  assert.equal(review.rating, 5);
  assert.equal(review.comment, "Great work.");
});
