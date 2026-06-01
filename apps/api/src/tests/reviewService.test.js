import test from "node:test";
import assert from "node:assert/strict";
import { createReview } from "../services/reviewService.js";

test("createReview assigns a server-owned createdAt timestamp", async () => {
  const callerTimestamp = "1999-01-01T00:00:00.000Z";
  const before = Date.now();

  const review = await createReview({
    jobId: "job_123",
    reviewerId: "usr_client",
    revieweeId: "usr_freelancer",
    rating: 5,
    comment: "Great work",
    createdAt: callerTimestamp
  });

  const after = Date.now();
  const createdAt = Date.parse(review.createdAt);

  assert.notEqual(review.createdAt, callerTimestamp);
  assert.ok(Number.isFinite(createdAt));
  assert.ok(createdAt >= before);
  assert.ok(createdAt <= after);
});
