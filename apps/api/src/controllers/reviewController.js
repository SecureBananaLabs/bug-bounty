import { ok, fail } from "../utils/response.js";
import { createReview, listReviews, getReviewById } from "../services/reviewService.js";

export async function getReviews(req, res) {
  return ok(res, await listReviews());
}

export async function postReview(req, res) {
  return ok(res, await createReview(req.body), 201);
}

export async function getReview(req, res) {
  const review = await getReviewById(req.params.id);
  if (!review) {
    return fail(res, "Review not found", 404);
  }
  return ok(res, review);
}
