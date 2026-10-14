import test from "node:test";
import assert from "node:assert/strict";
import { createReview } from "../services/reviewService.js";

test("createReview generates collision-resistant ids", async () => {
  const originalNow = Date.now;
  Date.now = () => 1720000000000;

  try {
    const review1 = await createReview({
      reviewerId: "usr_a",
      revieweeId: "usr_b",
      rating: 5,
      comment: "fast",
    });
    const review2 = await createReview({
      reviewerId: "usr_c",
      revieweeId: "usr_d",
      rating: 4,
      comment: "clear",
    });

    assert.ok(review1.id.startsWith("rev_"), "review1 id has rev_ prefix");
    assert.ok(review2.id.startsWith("rev_"), "review2 id has rev_ prefix");
    assert.notEqual(review1.id, review2.id, "ids must be distinct");
  } finally {
    Date.now = originalNow;
  }
});

test("createReview ignores client-supplied id", async () => {
  const review = await createReview({
    id: "rev_hacked",
    reviewerId: "usr_a",
    revieweeId: "usr_b",
    rating: 5,
    comment: "fast",
  });

  assert.notEqual(review.id, "rev_hacked", "client id must not override server id");
  assert.ok(review.id.startsWith("rev_"), "server id has rev_ prefix");
});
