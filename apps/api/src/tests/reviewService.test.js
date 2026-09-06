import test from "node:test";
import assert from "node:assert/strict";
import { createReview } from "../services/reviewService.js";

test("createReview whitelists expected fields", async () => {
  const review = await createReview({
    rating: 5,
    comment: "Clear communication and strong delivery.",
    reviewerId: "usr_reviewer",
    revieweeId: "usr_reviewee",
    admin: true,
    createdAt: "1999-01-01T00:00:00.000Z",
    id: "rev_attacker"
  });

  assert.ok(review.id.startsWith("rev_"));
  assert.deepEqual(review, {
    id: review.id,
    rating: 5,
    comment: "Clear communication and strong delivery.",
    reviewerId: "usr_reviewer",
    revieweeId: "usr_reviewee"
  });
});
