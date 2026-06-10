import test from "node:test";
import assert from "node:assert/strict";
import { createReview, listReviews } from "../services/reviewService.js";

test("createReview adds a server-side createdAt timestamp", async () => {
  const review = await createReview({
    rating: 5,
    comment: "Great delivery.",
    createdAt: "2000-01-01T00:00:00.000Z"
  });
  const reviews = await listReviews();
  const storedReview = reviews.find((candidate) => candidate.id === review.id);

  assert.match(review.createdAt, /^\d{4}-\d{2}-\d{2}T/);
  assert.doesNotThrow(() => new Date(review.createdAt).toISOString());
  assert.notEqual(review.createdAt, "2000-01-01T00:00:00.000Z");
  assert.equal(storedReview.createdAt, review.createdAt);
});
