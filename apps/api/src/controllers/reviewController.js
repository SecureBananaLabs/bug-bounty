import { fail, ok } from "../utils/response.js";
import { listReviews, submitReview } from "../services/reviewService.js";

export async function getReviews(req, res) {
  return ok(res, await listReviews());
}

export async function postReview(req, res) {
  try {
    const result = await submitReview(req.body);
    return ok(res, result, 201);
  } catch (err) {
    return fail(res, err.message, 400);
  }
}
