import { ok } from "../utils/response.js";
import { createReview, listReviews } from "../services/reviewService.js";

export async function getReviews(req, res) {
  return ok(res, await listReviews());
}

export async function postReview(req, res) {
  const { authorId: _ignoredAuthorId, ...payload } = req.body ?? {};
  return ok(res, await createReview({ ...payload, authorId: req.user.sub }), 201);
}
