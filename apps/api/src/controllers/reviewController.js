import { ok, fail } from "../utils/response.js";
import { createReview, listReviews } from "../services/reviewService.js";

export async function getReviews(req, res) {
  return ok(res, await listReviews());
}

export async function postReview(req, res) {
  try {
    return ok(res, await createReview(req.body), 201);
  } catch (err) {
    if (err.statusCode) {
      return fail(res, err.message, err.statusCode);
    }
    throw err;
  }
}
