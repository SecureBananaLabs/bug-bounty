import test from "node:test";
import assert from "node:assert/strict";
import { createReview } from "../services/reviewService.js";

test("createReview rejects ratings outside the 1-5 range", async () => {
  await assert.rejects(
    () => createReview({ rating: 0, comment: "too low" }),
    /integer from 1 to 5/
  );

  await assert.rejects(
    () => createReview({ rating: 6, comment: "too high" }),
    /integer from 1 to 5/
  );
});

test("createReview accepts an in-range integer rating", async () => {
  const review = await createReview({ rating: 5, comment: "solid work" });

  assert.equal(review.rating, 5);
  assert.match(review.id, /^rev_/);
});
