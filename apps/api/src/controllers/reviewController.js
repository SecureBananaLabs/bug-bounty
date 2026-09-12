import { ok } from "../utils/response.js";
import { createReview, listReviews } from "../services/reviewService.js";
import { createReviewSchema } from "../validators/workflow.js";

export async function getReviews(req, res) {
  return ok(res, await listReviews());
}

export async function postReview(req, res, next) {
  try {
    const payload = createReviewSchema.parse(req.body);
    return ok(res, await createReview(payload), 201);
  } catch (error) {
    return next(error);
  }
}
