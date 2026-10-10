import { fail, ok } from "../utils/response.js";
import { createReview, listReviews } from "../services/reviewService.js";

export async function getReviews(req, res) {
  return ok(res, await listReviews());
}

export async function postReview(req, res) {
  const reviewerId = req.body?.reviewerId;

  if (typeof reviewerId !== "string" || reviewerId.trim() === "") {
    return fail(res, "reviewerId is required", 400);
  }

  return ok(res, await createReview(req.body), 201);
}
