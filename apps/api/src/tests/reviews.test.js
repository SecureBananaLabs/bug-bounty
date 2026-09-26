import test from "node:test";
import assert from "node:assert/strict";
import { createReview, listReviews } from "../services/reviewService.js";

test("createReview returns ids with the rev_ prefix", async () => {
  const review = await createReview({ rating: 5, body: "great" });
  assert.match(review.id, /^rev_/);
});

test("createReview keeps the rev_ prefix even for back-to-back creates", async () => {
  const a = await createReview({ rating: 4, body: "a" });
  const b = await createReview({ rating: 3, body: "b" });
  assert.match(a.id, /^rev_/);
  assert.match(b.id, /^rev_/);
});

test("two same-millisecond reviews receive distinct ids", async () => {
  // Force Date.now() to return the same value for both calls so we can prove
  // the collision-resistant counter is what guarantees uniqueness.
  const realNow = Date.now;
  let now = 1700000000000;
  Date.now = () => now;
  try {
    const a = await createReview({ rating: 1, body: "first" });
    now += 0; // same millisecond
    const b = await createReview({ rating: 2, body: "second" });
    assert.notEqual(a.id, b.id, "ids should differ even when created in the same millisecond");
  } finally {
    Date.now = realNow;
  }
});

test("listReviews includes created reviews", async () => {
  const before = (await listReviews()).length;
  await createReview({ rating: 5, body: "listed" });
  const after = (await listReviews()).length;
  assert.equal(after, before + 1);
});
