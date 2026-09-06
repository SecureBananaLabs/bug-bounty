import test from "node:test";
import assert from "node:assert/strict";
import { createReview, listReviews } from "../services/reviewService.js";

const validReview = {
  reviewerId: "usr_reviewer",
  revieweeId: "usr_reviewee",
  rating: 5,
  comment: "Great collaboration."
};

test("createReview preserves reviews between different users", async () => {
  const review = await createReview(validReview);

  assert.equal(review.reviewerId, validReview.reviewerId);
  assert.equal(review.revieweeId, validReview.revieweeId);
  assert.notEqual(review.reviewerId, review.revieweeId);
});

test("createReview rejects self-review payloads without storing them", async () => {
  const listLengthBefore = (await listReviews()).length;

  await assert.rejects(
    () =>
      createReview({
        ...validReview,
        reviewerId: "usr_same",
        revieweeId: "usr_same"
      }),
    /Review reviewer and reviewee must be different users/
  );
  assert.equal((await listReviews()).length, listLengthBefore);
});
