import { ok } from "../utils/response.js";
import { createReview, listReviews } from "../services/reviewService.js";
import { createReviewSchema } from "../validators/review.js";

export async function getReviews(req, res, next) {
  try {
    return ok(res, await listReviews());
  } catch (err) {
    return next(err);
  }
}

export async function postReview(req, res, next) {
  try {
    const payload = createReviewSchema.parse(req.body);
    return ok(res, await createReview(payload), 201);
  } catch (err) {
    return next(err);
  }
}
