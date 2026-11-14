import { ok } from "../utils/response.js";
import { createReview, listReviews } from "../services/reviewService.js";
import { createReviewSchema } from "../validators/review.js";

export async function getReviews(req, res, next) {
  try {
    return ok(res, await listReviews());
  } catch (err) {
    next(err);
  }
}

export async function postReview(req, res, next) {
  try {
    const validated = createReviewSchema.parse(req.body);
    const review = await createReview(validated);
    return ok(res, review, 201);
  } catch (err) {
    next(err);
  }
}
