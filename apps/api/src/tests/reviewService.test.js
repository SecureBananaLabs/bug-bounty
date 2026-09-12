import test from "node:test";
import assert from "node:assert/strict";
import { createReview } from "../services/reviewService.js";

function validReview(rating) {
  return {
    rating,
    comment: "Great collaboration",
    reviewerId: "usr_reviewer",
    revieweeId: "usr_reviewee"
  };
}

test("createReview accepts integer ratings from one through five", async () => {
  const lowest = await createReview(validReview(1));
  const highest = await createReview(validReview(5));

  assert.equal(lowest.rating, 1);
  assert.equal(highest.rating, 5);
});

test("createReview rejects ratings below one", async () => {
  await assert.rejects(
    () => createReview(validReview(0)),
    /Review rating must be an integer between 1 and 5/
  );
});

test("createReview rejects ratings above five", async () => {
  await assert.rejects(
    () => createReview(validReview(6)),
    /Review rating must be an integer between 1 and 5/
  );
});

test("createReview rejects non-integer ratings", async () => {
  await assert.rejects(
    () => createReview(validReview(4.5)),
    /Review rating must be an integer between 1 and 5/
  );
});

test("createReview rejects non-number ratings", async () => {
  await assert.rejects(
    () => createReview(validReview("5")),
    /Review rating must be an integer between 1 and 5/
  );
});
