import { ok } from "../utils/response.js";
import { createReview, listReviews } from "../services/reviewService.js";
import { createReviewSchema } from "../validators/review.js";

export async function getReviews(req, res, next) {
  try {
    return ok(res, await listReviews());
  } catch (error) {
    next(error);
  }
}

export async function postReview(req, res, next) {
  try {
    const payload = createReviewSchema.parse(req.body);
    const result = await createReview(payload);
    return ok(res, result, 201);
  } catch (error) {
    next(error);
  }
}
