import test from "node:test";
import assert from "node:assert/strict";
import { createReview } from "../services/reviewService.js";

test("createReview uses a server-owned createdAt timestamp", async () => {
  const staleTimestamp = "2000-01-01T00:00:00.000Z";

  const result = await createReview({
    reviewerId: "usr_reviewer",
    revieweeId: "usr_reviewee",
    rating: 5,
    comment: "Great work",
    createdAt: staleTimestamp
  });

  assert.notEqual(result.createdAt, staleTimestamp);
  assert.equal(new Date(result.createdAt).toISOString(), result.createdAt);
});
