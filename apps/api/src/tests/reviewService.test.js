import test from "node:test";
import assert from "node:assert/strict";
import { createReview } from "../services/reviewService.js";

test("createReview keeps IDs server-owned and unique", async () => {
  const originalDateNow = Date.now;
  Date.now = () => 1700000000000;

  try {
    const first = await createReview({
      id: "caller-controlled",
      rating: 5,
      comment: "Great work",
    });
    const second = await createReview({ rating: 4, comment: "Solid" });

    assert.match(first.id, /^rev_[0-9a-f-]{36}$/);
    assert.match(second.id, /^rev_[0-9a-f-]{36}$/);
    assert.notEqual(first.id, "caller-controlled");
    assert.notEqual(first.id, second.id);
    assert.equal(first.rating, 5);
    assert.equal(first.comment, "Great work");
  } finally {
    Date.now = originalDateNow;
  }
});
