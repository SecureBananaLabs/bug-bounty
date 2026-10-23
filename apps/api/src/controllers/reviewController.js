import { ok } from "../utils/response.js";
import { createReview, listReviews } from "../services/reviewService.js";
import { createReviewSchema } from "../validators/review.js";

export async function getReviews(req, res) {
  return ok(res, await listReviews());
}

export async function postReview(req, res, next) {
  try {
    const validated = createReviewSchema.parse(req.body);
    const result = await createReview(validated);
    return ok(res, result, 201);
  } catch (err) {
    return next(err);
  }
}
