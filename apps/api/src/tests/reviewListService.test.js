import test from "node:test";
import assert from "node:assert/strict";
import { createReview, listReviews } from "../services/reviewService.js";

test("listReviews returns a defensive array copy", async () => {
  const review = await createReview({ rating: 5 });
  const listedReviews = await listReviews();

  listedReviews.length = 0;

  const nextListedReviews = await listReviews();

  assert.equal(nextListedReviews.length, 1);
  assert.equal(nextListedReviews[0], review);
});
