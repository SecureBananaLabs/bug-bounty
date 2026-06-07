import test from "node:test";
import assert from "node:assert/strict";
import { createReview, listReviews } from "../services/reviewService.js";

test("review service keeps records and ids server-owned", async () => {
  const initialReviews = await listReviews();
  const initialCount = initialReviews.length;

  const created = await createReview({
    id: "rev_client_controlled",
    jobId: "job_review_copy",
    reviewerId: "usr_reviewer",
    rating: 5,
    comment: "The work was delivered cleanly"
  });

  assert.match(created.id, /^rev_\d+$/);
  assert.notEqual(created.id, "rev_client_controlled");

  created.comment = "mutated through returned create payload";

  const listedReviews = await listReviews();
  assert.equal(listedReviews.length, initialCount + 1);
  assert.equal(listedReviews.at(-1).comment, "The work was delivered cleanly");

  listedReviews.push({
    id: "rev_client_injected",
    jobId: "job_review_copy",
    reviewerId: "usr_attacker",
    rating: 1,
    comment: "injected through list result"
  });
  listedReviews.at(-2).comment = "mutated through list result";

  const reloadedReviews = await listReviews();
  assert.equal(reloadedReviews.length, initialCount + 1);
  assert.equal(reloadedReviews.at(-1).id, created.id);
  assert.equal(reloadedReviews.at(-1).comment, "The work was delivered cleanly");
  assert.equal(
    reloadedReviews.some((review) => review.id === "rev_client_injected"),
    false
  );
});
