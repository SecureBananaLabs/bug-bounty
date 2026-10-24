import test from "node:test";
import assert from "node:assert/strict";
import { createReview, listReviews } from "../services/reviewService.js";

test("generated review id wins over a caller supplied one", async () => {
  const created = await createReview({
    id: "caller-owned",
    jobId: "job_55",
    freelancerId: "usr_55",
    rating: 5,
    comment: "Delivered early"
  });

  assert.match(created.id, /^rev_\d+$/);
  assert.equal(created.jobId, "job_55");
  assert.equal(created.rating, 5);

  const listed = await listReviews();
  assert.ok(listed.some((item) => item.id === created.id));
});

test("review creation still generates an id when the payload has none", async () => {
  const created = await createReview({
    jobId: "job_56",
    freelancerId: "usr_56",
    rating: 4,
    comment: "Good communication"
  });

  assert.match(created.id, /^rev_\d+$/);
  assert.equal(created.freelancerId, "usr_56");
});
