import { ok } from "../utils/response.js";
import { createReview, listReviews } from "../services/reviewService.js";
import { createReviewSchema } from "../validators/review.js";

export async function getReviews(req, res) {
  return ok(res, await listReviews());
}

export async function postReview(req, res) {
  const payload = createReviewSchema.parse(req.body);
  // Reviewer identity comes from the verified JWT, not client-supplied body.
  // This prevents User A from submitting a review as User B by setting
  // reviewerId in the request body.
  return ok(res, await createReview({ ...payload, reviewerId: req.user.sub }), 201);
}

