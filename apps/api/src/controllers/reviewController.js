import { ok } from "../utils/response.js";
import { createReview, listReviews } from "../services/reviewService.js";

export async function getReviews(req, res) {
  return ok(res, await listReviews());
}

export async function postReview(req, res) {
  // reviewerId must come from the verified JWT, not from the request body.
  // Trusting req.body.reviewerId allows any authenticated user to impersonate
  // another reviewer — a classic IDOR: I can post a review as any user ID.
  const payload = { ...req.body, reviewerId: req.user.sub };
  return ok(res, await createReview(payload), 201);
}

