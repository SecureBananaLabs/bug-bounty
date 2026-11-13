import test from "node:test";
import assert from "node:assert/strict";
import { createReview, listReviews } from "../services/reviewService.js";

test("createReview preserves generated ids and stores normal review fields", async () => {
  const beforeCount = (await listReviews()).length;
  const originalNow = Date.now;
  Date.now = () => 1710000000000;

  try {
    const review = await createReview({
      id: "rev_client_controlled",
      reviewerId: "usr_reviewer",
      revieweeId: "usr_reviewee",
      rating: 5,
      comment: "Great work."
    });

    assert.match(review.id, /^rev_1710000000000_[0-9a-f-]{36}$/);
    assert.notEqual(review.id, "rev_client_controlled");
    assert.equal(review.reviewerId, "usr_reviewer");
    assert.equal(review.revieweeId, "usr_reviewee");
    assert.equal(review.rating, 5);
    assert.equal(review.comment, "Great work.");

    const reviews = await listReviews();
    assert.equal(reviews.length, beforeCount + 1);
    assert.equal(reviews[reviews.length - 1], review);
  } finally {
    Date.now = originalNow;
  }
});

test("createReview generates unique ids for same-millisecond reviews", async () => {
  const originalNow = Date.now;
  Date.now = () => 1710000000000;

  try {
    const created = await Promise.all(
      Array.from({ length: 20 }, (_, index) => createReview({ rating: 5, comment: `Review ${index}` }))
    );
    const ids = created.map((review) => review.id);

    assert.equal(new Set(ids).size, ids.length);
    for (const id of ids) {
      assert.match(id, /^rev_1710000000000_[0-9a-f-]{36}$/);
    }
  } finally {
    Date.now = originalNow;
  }
});
