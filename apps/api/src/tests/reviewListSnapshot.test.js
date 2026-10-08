import test from "node:test";
import assert from "node:assert/strict";
import { createReview, listReviews } from "../services/reviewService.js";

test("listReviews returns a snapshot that callers can mutate safely", async () => {
  const created = await createReview({ jobId: "job_1", rating: 5 });
  assert.ok(created.id.startsWith("rev_"));

  const first = await listReviews();
  assert.equal(first.length, 1);

  first.push({ id: "rev_extra" });

  const second = await listReviews();
  assert.equal(second.length, 1);
  assert.deepEqual(second[0], created);
});
