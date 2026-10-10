import { ok, fail } from "../utils/response.js";
import { createReview, listReviews } from "../services/reviewService.js";
import { validateCreateReview } from "../validators/review.js";

export async function getReviews(req, res) {
  return ok(res, await listReviews());
}

export async function postReview(req, res) {
  const validation = validateCreateReview(req.body);
  if (!validation.valid) {
    return fail(res, validation.error, 400);
  }
  return ok(res, await createReview(validation.data), 201);
}
