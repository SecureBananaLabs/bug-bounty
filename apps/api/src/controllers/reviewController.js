import { ok, fail } from "../utils/response.js";
import { createReview, listReviews } from "../services/reviewService.js";
import { reviewSchema } from "../validators/review.js";

export async function getReviews(req, res) {
  return ok(res, await listReviews());
}

export async function postReview(req, res) {
  const result = reviewSchema.safeParse(req.body);
  if (!result.success) {
    return fail(res, result.error.flatten(), 422);
  }
  return ok(res, await createReview(result.data), 201);
}
