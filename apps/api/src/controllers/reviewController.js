import { ok } from "../utils/response.js";
import { createReview, listReviews } from "../services/reviewService.js";
import { reviewSchema } from "../validators/review.js";

export async function getReviews(req, res) {
  return ok(res, await listReviews());
}

export async function postReview(req, res) {
  const payload = reviewSchema.parse(req.body);
  return ok(res, await createReview(payload), 201);
}

