import { fail, ok } from "../utils/response.js";
import { createReview, listReviews } from "../services/reviewService.js";

export async function getReviews(req, res) {
  return ok(res, await listReviews());
}

export async function postReview(req, res) {
  const { reviewerId, revieweeId } = req.body ?? {};

  if (
    reviewerId !== undefined &&
    revieweeId !== undefined &&
    reviewerId === revieweeId
  ) {
    return fail(res, "Reviewer and reviewee must be different users", 400);
  }

  return ok(res, await createReview(req.body), 201);
}
