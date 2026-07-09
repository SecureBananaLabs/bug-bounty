import { ok, fail } from "../utils/response.js";
import { createReview, listReviews } from "../services/reviewService.js";

export async function getReviews(req, res) {
  return ok(res, await listReviews());
}

export async function postReview(req, res, next) {
  try {
    const { reviewerId, revieweeId } = req.body;
    if (reviewerId && revieweeId && reviewerId === revieweeId) {
      return fail(res, "Reviewer and reviewee must be different", 400);
    }
    return ok(res, await createReview(req.body), 201);
  } catch (err) {
    return next(err);
  }
}
