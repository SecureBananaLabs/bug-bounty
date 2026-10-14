import test from "node:test";
import assert from "node:assert/strict";
import { createReviewSchema } from "../validators/review.js";

test("createReviewSchema rejects rating below 1", () => {
  const result = createReviewSchema.safeParse({
    rating: 0, comment: "bad", reviewerId: "usr_a", revieweeId: "usr_b"
  });
  assert.equal(result.success, false);
  assert.ok(result.error.issues.some(i => i.path.includes("rating")));
});

test("createReviewSchema rejects rating above 5", () => {
  const result = createReviewSchema.safeParse({
    rating: 6, comment: "great", reviewerId: "usr_a", revieweeId: "usr_b"
  });
  assert.equal(result.success, false);
  assert.ok(result.error.issues.some(i => i.path.includes("rating")));
});

test("createReviewSchema rejects negative rating", () => {
  const result = createReviewSchema.safeParse({
    rating: -1, comment: "terrible", reviewerId: "usr_a", revieweeId: "usr_b"
  });
  assert.equal(result.success, false);
});

test("createReviewSchema accepts valid rating 1", () => {
  const result = createReviewSchema.safeParse({
    rating: 1, comment: "poor", reviewerId: "usr_a", revieweeId: "usr_b"
  });
  assert.equal(result.success, true);
  assert.equal(result.data.rating, 1);
});

test("createReviewSchema accepts valid rating 5", () => {
  const result = createReviewSchema.safeParse({
    rating: 5, comment: "excellent", reviewerId: "usr_a", revieweeId: "usr_b"
  });
  assert.equal(result.success, true);
  assert.equal(result.data.rating, 5);
});

test("createReviewSchema rejects non-integer rating", () => {
  const result = createReviewSchema.safeParse({
    rating: 3.5, comment: "okay", reviewerId: "usr_a", revieweeId: "usr_b"
  });
  assert.equal(result.success, false);
});

test("createReviewSchema rejects missing rating", () => {
  const result = createReviewSchema.safeParse({
    comment: "no rating", reviewerId: "usr_a", revieweeId: "usr_b"
  });
  assert.equal(result.success, false);
});
