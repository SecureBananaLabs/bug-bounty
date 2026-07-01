import { createReviewSchema } from "../validators/review.js";
import { ok } from "../utils/response.js";
import { createReview, listReviews } from "../services/reviewService.js";

export async function getReviews(req, res) {
  return ok(res, await listReviews());
}

export async function postReview(req, res) {
  return ok(res, await createReview(createReviewSchema.parse(req.body)), 201);
}
