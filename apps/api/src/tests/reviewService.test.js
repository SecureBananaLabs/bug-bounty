import test from "node:test";
import assert from "node:assert/strict";
import { createReview } from "../services/reviewService.js";

test("createReview returns distinct ids when Date.now is frozen", async () => {
  const originalNow = Date.now;
  Date.now = () => 1720000000000;

  try {
    const first = await createReview({
      reviewerId: "usr_a",
      revieweeId: "usr_b",
      rating: 5,
      comment: "fast",
    });
    const second = await createReview({
      reviewerId: "usr_c",
      revieweeId: "usr_d",
      rating: 4,
      comment: "clear",
    });

    assert.notEqual(first.id, second.id);
    assert.match(first.id, /^rev_/);
    assert.match(second.id, /^rev_/);
    assert.ok(!first.id.includes("1720000000000"));
    assert.ok(!second.id.includes("1720000000000"));
  } finally {
    Date.now = originalNow;
  }
});

test("createReview ignores a caller-supplied id", async () => {
  const review = await createReview({
    id: "rev_custom",
    reviewerId: "usr_e",
    revieweeId: "usr_f",
    rating: 3,
    comment: "ok",
  });

  assert.notEqual(review.id, "rev_custom");
  assert.match(review.id, /^rev_/);
});
