import test from "node:test";
import assert from "node:assert/strict";
import { createReview } from "../services/reviewService.js";

test("createReview generates distinct ids within the same millisecond", async () => {
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

    assert.ok(first.id.startsWith("rev_"));
    assert.ok(second.id.startsWith("rev_"));
    assert.notEqual(first.id, second.id);
  } finally {
    Date.now = originalNow;
  }
});
