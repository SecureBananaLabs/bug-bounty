import test from "node:test";
import assert from "node:assert/strict";
import { createReview } from "../services/reviewService.js";

test("review creation assigns server-owned createdAt timestamps", async () => {
  const callerCreatedAt = "2000-01-01T00:00:00.000Z";

  const review = await createReview({
    jobId: "job_1",
    freelancerId: "usr_1",
    rating: 5,
    text: "Great work",
    createdAt: callerCreatedAt
  });

  assert.match(review.id, /^rev_/);
  assert.notEqual(review.createdAt, callerCreatedAt);
  assert.doesNotThrow(() => new Date(review.createdAt).toISOString());
});
