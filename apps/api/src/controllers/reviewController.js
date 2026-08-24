import { ok, fail } from "../utils/response.js";
import { validateCreateReview } from "../validators/review.js";
import { createReview, listReviews } from "../services/reviewService.js";

export async function getReviews(req, res) {
  return ok(res, await listReviews());
}

export async function postReview(req, res) {
  const validation = validateCreateReview(req.body);
  if (!validation.ok) {
    return fail(res, validation.error, 400);
  }
  return ok(res, await createReview(validation.data), 201);
}

