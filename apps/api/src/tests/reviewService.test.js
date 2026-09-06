import test from "node:test";
import assert from "node:assert/strict";
import { createReview, listReviews } from "../services/reviewService.js";

test("createReview generates unique server-controlled review IDs", async () => {
  const r1 = await createReview({ id: "override_attempt_1", rating: 5, comment: "Great work!" });
  assert.notEqual(r1.id, "override_attempt_1");
  assert.ok(r1.id.startsWith("rev_"));
  assert.equal(r1.rating, 5);
  assert.equal(r1.comment, "Great work!");

  const r2 = await createReview({ rating: 4, comment: "Good communication" });
  assert.notEqual(r1.id, r2.id);
  assert.ok(r2.id.startsWith("rev_"));
});

test("createReview creates distinct IDs even under simultaneous creation", async () => {
  const creations = await Promise.all(
    Array.from({ length: 20 }, (_, i) => createReview({ rating: 5, index: i }))
  );
  const ids = creations.map((r) => r.id);
  const uniqueIds = new Set(ids);
  assert.equal(uniqueIds.size, ids.length);
});
