import test from "node:test";
import assert from "node:assert/strict";
import { createReview, listReviews } from "../services/reviewService.js";

test("listReviews returns a defensive array snapshot", async () => {
  await createReview({ reviewerId: "usr_1", revieweeId: "usr_2", rating: 5 });

  const firstResult = await listReviews();
  firstResult.length = 0;
  firstResult.push({ id: "injected" });

  const secondResult = await listReviews();

  assert.ok(secondResult.some((review) => review.rating === 5));
  assert.equal(secondResult.some((review) => review.id === "injected"), false);
});
