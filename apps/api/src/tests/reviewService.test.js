import test from "node:test";
import assert from "node:assert/strict";
import { createReview } from "../services/reviewService.js";

test("createReview generates unique ids for same-millisecond reviews", async (t) => {
  const originalDateNow = Date.now;
  t.after(() => {
    Date.now = originalDateNow;
  });

  Date.now = () => 1234567890;

  const first = await createReview({ rating: 5, comment: "great" });
  const second = await createReview({ rating: 4, comment: "good" });

  assert.match(first.id, /^rev_/);
  assert.match(second.id, /^rev_/);
  assert.notEqual(first.id, second.id);
});
