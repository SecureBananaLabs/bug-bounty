import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validateCreateReview } from "./review.js";

describe("Review Validation & Rating Bounds (#743)", () => {
  it("rejects self-review where reviewerId equals revieweeId", () => {
    const res = validateCreateReview({
      reviewerId: "user_123",
      revieweeId: "user_123",
      rating: 5,
      comment: "Great work!"
    });
    assert.equal(res.ok, false);
    assert.equal(res.error, "Users cannot submit reviews for themselves");
  });

  it("rejects invalid rating (< 1 or > 5 or non-integer)", () => {
    const res1 = validateCreateReview({
      reviewerId: "user_1",
      revieweeId: "user_2",
      rating: 0,
      comment: "Poor job"
    });
    assert.equal(res1.ok, false);
    assert.equal(res1.error, "Rating must be an integer between 1 and 5");

    const res2 = validateCreateReview({
      reviewerId: "user_1",
      revieweeId: "user_2",
      rating: 6,
      comment: "Overly great"
    });
    assert.equal(res2.ok, false);
    assert.equal(res2.error, "Rating must be an integer between 1 and 5");
  });

  it("accepts valid review with rating between 1 and 5", () => {
    const res = validateCreateReview({
      reviewerId: "user_1",
      revieweeId: "user_2",
      rating: 5,
      comment: "Fantastic delivery on time!"
    });
    assert.equal(res.ok, true);
    assert.equal(res.data.rating, 5);
    assert.equal(res.data.comment, "Fantastic delivery on time!");
  });
});
