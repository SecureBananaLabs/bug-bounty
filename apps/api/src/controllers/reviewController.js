import { createReviewSchema } from "../validators/review.js";
import { fail, ok } from "../utils/response.js";
import { createReview, listReviews } from "../services/reviewService.js";

export async function getReviews(req, res) {
  return ok(res, await listReviews());
}

export async function postReview(req, res) {
  const parsed = createReviewSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, "Invalid review payload", 400);
  }

  return ok(res, await createReview(parsed.data), 201);
}
