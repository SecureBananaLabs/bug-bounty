import { ok } from "../utils/response.js";
import { createReview, listReviews } from "../services/reviewService.js";

export async function getReviews(req, res) {
  return ok(res, await listReviews());
}

export async function postReview(req, res) {
  const payload = { ...req.body, reviewerId: req.user.sub };
  return ok(res, await createReview(payload), 201);
}
