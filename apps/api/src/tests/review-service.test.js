import test from "node:test";
import assert from "node:assert/strict";
import { createReview } from "../services/reviewService.js";

test("createReview preserves the server-generated id", async () => {
  const result = await createReview({
    jobId: "job_1",
    reviewerId: "usr_1",
    rating: 5,
    comment: "great work",
    id: "rev_attacker_supplied"
  });

  assert.equal(result.jobId, "job_1");
  assert.equal(result.reviewerId, "usr_1");
  assert.equal(result.rating, 5);
  assert.equal(result.comment, "great work");
  assert.match(result.id, /^rev_\d+$/);
  assert.notEqual(result.id, "rev_attacker_supplied");
});
