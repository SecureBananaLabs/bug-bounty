import { ok, fail } from "../utils/response.js";
import { createReview, listReviews } from "../services/reviewService.js";
import { createReviewSchema } from "../validators/review.js";

export async function getReviews(req, res) {
  return ok(res, await listReviews());
}

export async function postReview(req, res) {
  const result = createReviewSchema.safeParse(req.body);
  if (!result.success) {
    return fail(res, result.error.issues[0].message, 400);
  }
  return ok(res, await createReview(result.data), 201);
}
