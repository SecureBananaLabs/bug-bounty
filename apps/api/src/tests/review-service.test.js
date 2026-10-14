import assert from "node:assert/strict";
import test from "node:test";

import { createReview } from "../services/reviewService.js";

test("createReview ignores caller-supplied ids", async () => {
  const review = await createReview({
    id: "rev_client_supplied",
    rating: 5,
    comment: "Fast turnaround"
  });

  assert.notEqual(review.id, "rev_client_supplied");
  assert.match(review.id, /^rev_\d+$/);
  assert.equal(review.rating, 5);
  assert.equal(review.comment, "Fast turnaround");
});
