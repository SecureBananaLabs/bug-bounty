import { fail, ok } from "../utils/response.js";
import { createReview, listReviews } from "../services/reviewService.js";

export async function getReviews(req, res) {
  return ok(res, await listReviews());
}

export async function postReview(req, res) {
  const rating = req.body?.rating;

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return fail(res, "rating must be an integer between 1 and 5", 400);
  }

  return ok(res, await createReview(req.body), 201);
}
