import { createReviewSchema } from "../validators/review.js";
import { fail, ok } from "../utils/response.js";
import { createReview, listReviews } from "../services/reviewService.js";

export async function getReviews(req, res) {
  return ok(res, await listReviews());
}

export async function postReview(req, res) {
  const payload = createReviewSchema.safeParse(req.body);

  if (!payload.success) {
    return fail(res, "Invalid review request", 400);
  }

  return ok(res, await createReview(payload.data), 201);
}
