import test from "node:test";
import assert from "node:assert/strict";
import { createReview, listReviews } from "../services/reviewService.js";

test("listReviews returns a defensive snapshot", async () => {
  const created = await createReview({ proposalId: "prp_1", rating: 5 });
  const listed = await listReviews();

  listed.push({ id: "rev_injected", proposalId: "prp_2" });

  const listedAgain = await listReviews();

  assert.ok(listedAgain.some((review) => review.id === created.id));
  assert.equal(
    listedAgain.some((review) => review.id === "rev_injected"),
    false,
  );
});
