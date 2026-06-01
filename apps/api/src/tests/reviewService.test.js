import test from "node:test";
import assert from "node:assert/strict";
import { createReview } from "../services/reviewService.js";

test("createReview adds a server-side createdAt timestamp", async () => {
  const review = await createReview({
    rating: 5,
    comment: "Great delivery.",
    createdAt: "2000-01-01T00:00:00.000Z"
  });

  assert.match(review.createdAt, /^\d{4}-\d{2}-\d{2}T/);
  assert.notEqual(review.createdAt, "2000-01-01T00:00:00.000Z");
});
