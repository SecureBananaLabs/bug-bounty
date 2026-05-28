import { fail, ok } from "../utils/response.js";
import { createReview, listReviews } from "../services/reviewService.js";

export async function getReviews(req, res) {
  return ok(res, await listReviews());
}

export async function postReview(req, res) {
  if (
    typeof req.body?.reviewerId === "string" &&
    req.body.reviewerId === req.body.revieweeId
  ) {
    return fail(res, "Reviewer and reviewee must be different users", 400);
  }

  return ok(res, await createReview(req.body), 201);
}
