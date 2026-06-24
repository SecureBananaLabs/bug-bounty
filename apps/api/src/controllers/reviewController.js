import { ok, fail } from "../utils/response.js";
import { createReview, listReviews } from "../services/reviewService.js";

export async function getReviews(req, res) {
  return ok(res, await listReviews());
}

export async function postReview(req, res) {
  const { rating, comment } = req.body || {};
  if (!rating || typeof rating !== "number" || rating < 1 || rating > 5) {
    return fail(res, "Rating must be a number between 1 and 5.", 400);
  }
  if (comment && typeof comment === "string" && comment.length > 2000) {
    return fail(res, "Comment must be under 2000 characters.", 400);
  }

  return ok(res, await createReview(req.body), 201);
}
