import assert from "node:assert/strict";
import test from "node:test";

import { createReview, listReviews } from "../services/reviewService.js";

test("listReviews returns a snapshot that cannot mutate stored reviews", async () => {
  const before = await listReviews();
  const review = await createReview({
    jobId: "job_snapshot",
    reviewerId: "usr_reviewer",
    revieweeId: "usr_reviewee",
    rating: 5,
    comment: "Great work."
  });

  const listed = await listReviews();
  listed.length = 0;
  listed.push({
    id: "rev_attacker",
    jobId: "job_attacker",
    reviewerId: "usr_attacker",
    revieweeId: "usr_target",
    rating: 1,
    comment: "Injected review"
  });

  const afterMutation = await listReviews();
  assert.equal(afterMutation.length, before.length + 1);
  assert.ok(afterMutation.some((item) => item.id === review.id));
  assert.equal(afterMutation.some((item) => item.id === "rev_attacker"), false);
});
