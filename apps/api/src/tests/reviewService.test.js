import test from "node:test";
import assert from "node:assert/strict";
import { listReviews, createReview } from "../services/reviewService.js";

test("listReviews returns the stored reviews", async () => {
  const review = await createReview({ jobId: "job_1", rating: 5 });
  const listed = await listReviews();

  assert.equal(listed.length, 1);
  assert.equal(listed[0].id, review.id);
  assert.equal(listed[0].rating, 5);
});

test("listReviews returns an independent snapshot", async () => {
  const first = await listReviews();
  const before = first.length;

  first.pop();
  first.push({ id: "rev_injected" });

  const after = await listReviews();

  assert.equal(after.length, before);
  assert.deepEqual(
    after.map((review) => review.id),
    (await listReviews()).map((review) => review.id)
  );
});

test("each call returns a fresh array instance", async () => {
  const first = await listReviews();
  const second = await listReviews();

  assert.notEqual(first, second);
  assert.deepEqual(first, second);
});
