import test from "node:test";
import assert from "node:assert/strict";
import { createReview, listReviews } from "../services/reviewService.js";

test("listReviews returns an independent array snapshot", async () => {
  const created = await createReview({
    rating: 5,
    comment: "preserve stored review",
  });

  const snapshot = await listReviews();
  const originalLength = snapshot.length;

  assert.ok(originalLength > 0);
  assert.equal(snapshot.at(-1).id, created.id);

  snapshot.length = 0;

  const stored = await listReviews();
  assert.equal(stored.length, originalLength);
  assert.equal(stored.at(-1).id, created.id);
  assert.equal(stored.at(-1).comment, "preserve stored review");
});
