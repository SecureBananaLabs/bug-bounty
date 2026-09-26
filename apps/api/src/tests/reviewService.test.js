import test from "node:test";
import assert from "node:assert/strict";
import { createReview } from "../services/reviewService.js";

test("createReview assigns a server-owned createdAt timestamp and preserves review payload", async () => {
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
  assert.equal(review.jobId, "job_123");
  assert.equal(review.reviewerId, "usr_client");
  assert.equal(review.revieweeId, "usr_freelancer");
  assert.equal(review.rating, 5);
  assert.equal(review.comment, "Great work");
});

test("createReview ignores future caller-supplied createdAt values", async () => {
  const futureTimestamp = "2999-01-01T00:00:00.000Z";
  const before = Date.now();

  const review = await createReview({
    jobId: "job_future",
    reviewerId: "usr_reviewer",
    revieweeId: "usr_reviewee",
    rating: 4,
    createdAt: futureTimestamp
  });

  const after = Date.now();
  const createdAt = Date.parse(review.createdAt);

  assert.notEqual(review.createdAt, futureTimestamp);
  assert.ok(Number.isFinite(createdAt));
  assert.ok(createdAt >= before);
  assert.ok(createdAt <= after);
});
