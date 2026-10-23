import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  createReview,
  getFreelancerRating,
  _resetReviewsForTesting
} from "../services/reviewService.js";

describe("Freelancer Aggregate Rating Service (getFreelancerRating)", () => {
  beforeEach(() => {
    _resetReviewsForTesting();
  });

  it("returns { averageRating: 0, totalReviews: 0 } when freelancer has no reviews", async () => {
    const stats = await getFreelancerRating("user_non_existent");
    assert.deepEqual(stats, { averageRating: 0, totalReviews: 0 });
  });

  it("computes aggregate rating average rounded to 1 decimal place across multiple reviews", async () => {
    await createReview({ freelancerId: "freelancer_123", rating: 5, comment: "Excellent" });
    await createReview({ freelancerId: "freelancer_123", rating: 4, comment: "Very good" });
    await createReview({ freelancerId: "freelancer_123", rating: 4, comment: "Solid" });
    await createReview({ freelancerId: "other_user", rating: 1, comment: "Unrelated" });

    const stats = await getFreelancerRating("freelancer_123");
    assert.deepEqual(stats, { averageRating: 4.3, totalReviews: 3 });
  });

  it("ignores malformed or out-of-range ratings and handles invalid freelancerId safely", async () => {
    await createReview({ freelancerId: "f_1", rating: 5 });
    await createReview({ freelancerId: "f_1", rating: 99 });
    await createReview({ freelancerId: "f_1", rating: "invalid" });

    assert.deepEqual(await getFreelancerRating("f_1"), { averageRating: 5, totalReviews: 1 });
    assert.deepEqual(await getFreelancerRating(null), { averageRating: 0, totalReviews: 0 });
  });
});
