import test from "node:test";
import assert from "node:assert/strict";
import { createReview, listReviews } from "../services/reviewService.js";

const baseReview = {
  reviewerId: "user_reviewer",
  revieweeId: "user_reviewee",
  comment: "Delivered the work on time."
};

test("createReview accepts integer ratings from 1 through 5", async () => {
  for (const rating of [1, 2, 3, 4, 5]) {
    const review = await createReview({ ...baseReview, rating });

    assert.equal(review.rating, rating);
  }
});

test("createReview rejects ratings outside the 1-5 integer range", async () => {
  const invalidRatings = [0, 6, -1, 3.5, "5", Number.NaN, Infinity, -Infinity, null, undefined];

  for (const rating of invalidRatings) {
    const listLengthBefore = (await listReviews()).length;

    await assert.rejects(
      () => createReview({ ...baseReview, rating }),
      /Review rating must be an integer from 1 to 5/
    );
    assert.equal((await listReviews()).length, listLengthBefore);
  }
});
