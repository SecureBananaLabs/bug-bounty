import test from "node:test";
import assert from "node:assert/strict";
import { createReview } from "../services/reviewService.js";

test("createReview keeps review ids server-owned", async (t) => {
  t.mock.method(Date, "now", () => 1700000000000);

  const review = await createReview({
    id: "rev_client_supplied",
    rating: 5,
    body: "Great collaboration."
  });

  assert.equal(review.id, "rev_1700000000000");
});
