import { fail, ok } from "../utils/response.js";
import { createReviewSchema } from "../validators/review.js";
import { createReview, listReviews } from "../services/reviewService.js";

export async function getReviews(req, res) {
  return ok(res, await listReviews());
}

export async function postReview(req, res) {
  const result = createReviewSchema.safeParse(req.body);

  if (!result.success) {
    return fail(res, "Invalid review payload", 400);
  }

  return ok(res, await createReview(result.data), 201);
}
