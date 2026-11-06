import test from "node:test";
import assert from "node:assert/strict";
import { createReview, listReviews } from "../services/reviewService.js";

test("createReview accepts integer ratings from 1 through 5", async () => {
  const review = await createReview({
    reviewerId: "usr_client",
    revieweeId: "usr_freelancer",
    rating: 5,
    comment: "Great delivery"
  });

  assert.equal(review.rating, 5);
});

test("createReview rejects invalid review ratings", async () => {
  const invalidRatings = [0, 6, 4.5, "5"];
  const beforeCount = (await listReviews()).length;

  for (const rating of invalidRatings) {
    await assert.rejects(
      () =>
        createReview({
          reviewerId: "usr_client",
          revieweeId: "usr_freelancer",
          rating,
          comment: "Invalid score"
        }),
      /integer from 1 to 5/
    );
  }

  assert.equal((await listReviews()).length, beforeCount);
});
