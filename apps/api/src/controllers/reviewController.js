import { fail, ok } from "../utils/response.js";
import { createReview, listReviews } from "../services/reviewService.js";
import { createReviewSchema } from "../validators/review.js";

export async function getReviews(req, res) {
  return ok(res, await listReviews());
}

export async function postReview(req, res) {
  const result = createReviewSchema.safeParse(req.body);
  if (!result.success) {
    return fail(res, "Validation failed");
  }

  return ok(res, await createReview(result.data), 201);
}
