import { fail, ok } from "../utils/response.js";
import { createReview, listReviews } from "../services/reviewService.js";

export async function getReviews(req, res) {
  return ok(res, await listReviews());
}

export async function postReview(req, res) {
  if (!Number.isInteger(req.body?.rating) || req.body.rating < 1 || req.body.rating > 5) {
    return fail(res, "Rating must be an integer between 1 and 5", 400);
  }

  return ok(res, await createReview(req.body), 201);
}
