import test from "node:test";
import assert from "node:assert/strict";
import { createReview } from "../services/reviewService.js";

test("createReview assigns distinct rev_ ids for same-millisecond creates", async (t) => {
  t.mock.method(Date, "now", () => 1700000000000);

  const first = await createReview({ rating: 5, comment: "Great work" });
  const second = await createReview({ rating: 4, comment: "Solid delivery" });

  assert.match(first.id, /^rev_/);
  assert.match(second.id, /^rev_/);
  assert.notEqual(first.id, second.id);
});

test("createReview ignores a client-supplied id", async () => {
  const review = await createReview({ id: "rev_client", rating: 3 });

  assert.notEqual(review.id, "rev_client");
  assert.match(review.id, /^rev_/);
});
