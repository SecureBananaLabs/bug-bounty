import test from "node:test";
import assert from "node:assert/strict";
import { createReview } from "../services/reviewService.js";

test("createReview preserves the server-generated id", async () => {
  const review = await createReview({
    id: "rev_client_supplied",
    rating: 5,
    comment: "Clear delivery",
  });

  assert.match(review.id, /^rev_\d+$/);
  assert.notEqual(review.id, "rev_client_supplied");
  assert.equal(review.rating, 5);
  assert.equal(review.comment, "Clear delivery");
});
