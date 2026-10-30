import test from "node:test";
import assert from "node:assert/strict";
import { createReview, listReviews } from "../services/reviewService.js";
import { createReviewSchema } from "../validators/review.js";

test("createReview generates server-owned rev_ ID and timestamp", async () => {
  const payload = {
    targetId: "user_freelancer_123",
    rating: 5,
    comment: "Outstanding delivery and code quality!",
  };

  const review = await createReview(payload);

  assert.ok(review.id.startsWith("rev_"), "Review ID must start with rev_");
  assert.equal(review.targetId, payload.targetId);
  assert.equal(review.rating, 5);
  assert.equal(review.comment, payload.comment);
  assert.ok(review.createdAt, "Review must include createdAt timestamp");
});

test("createReview does not allow client-supplied id to override server id", async () => {
  const injectedPayload = {
    id: "injected_rev_999",
    targetId: "user_client_456",
    rating: 4,
    comment: "Great communication throughout the milestone.",
  };

  const review = await createReview(injectedPayload);

  assert.notEqual(review.id, "injected_rev_999", "Injected ID must be overwritten");
  assert.ok(review.id.startsWith("rev_"), "Server must assign a valid rev_ ID");
});

test("createReviewSchema validates rating range between 1 and 5", () => {
  const valid = createReviewSchema.safeParse({
    targetId: "user_1",
    rating: 4,
    comment: "Good job",
  });
  assert.equal(valid.success, true);

  const invalidLow = createReviewSchema.safeParse({
    targetId: "user_1",
    rating: 0,
    comment: "Bad",
  });
  assert.equal(invalidLow.success, false, "Rating 0 must be rejected");

  const invalidHigh = createReviewSchema.safeParse({
    targetId: "user_1",
    rating: 6,
    comment: "Over the top",
  });
  assert.equal(invalidHigh.success, false, "Rating 6 must be rejected");
});

test("listReviews returns accumulated reviews", async () => {
  const reviews = await listReviews();
  assert.ok(Array.isArray(reviews));
  assert.ok(reviews.length >= 2);
});
