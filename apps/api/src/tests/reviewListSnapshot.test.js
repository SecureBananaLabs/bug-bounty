import test from "node:test";
import assert from "node:assert/strict";
import { createReview, listReviews } from "../services/reviewService.js";

test("listReviews returns a snapshot that does not alias the backing store", async () => {
  const before = (await listReviews()).length;

  const first = await listReviews();
  first.push({ id: "rev_ghost" });

  const after = await listReviews();
  assert.equal(after.length, before, "a mutated snapshot must not leak into the store");

  const created = await createReview({ jobId: "job_1", rating: 5 });
  assert.equal(created.jobId, "job_1");
  assert.equal((await listReviews()).length, before + 1);
});
