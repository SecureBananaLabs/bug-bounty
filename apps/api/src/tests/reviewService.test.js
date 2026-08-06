import test from "node:test";
import assert from "node:assert/strict";
import { createReview } from "../services/reviewService.js";

test("createReview ignores caller-supplied ids", async () => {
  const review = await createReview({
    id: "rev_attacker",
    freelancerId: "user_1",
    clientId: "user_2",
    rating: 5,
    comment: "great work"
  });

  assert.match(review.id, /^rev_\d+$/);
  assert.notEqual(review.id, "rev_attacker");
  assert.equal(review.rating, 5);
});

test("createReview rejects out-of-range ratings", async () => {
  await assert.rejects(
    () =>
      createReview({
        freelancerId: "user_1",
        clientId: "user_2",
        rating: 6,
        comment: "inflated rating"
      }),
    /between 1 and 5/
  );
});

test("createReview rejects non-integer ratings", async () => {
  await assert.rejects(
    () =>
      createReview({
        freelancerId: "user_1",
        clientId: "user_2",
        rating: 4.5,
        comment: "fractional rating"
      }),
    /between 1 and 5/
  );
});
