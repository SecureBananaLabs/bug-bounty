import { ok, fail } from "../utils/response.js";
import { createReview, listReviews } from "../services/reviewService.js";
import { createReviewSchema } from "../validators/content.js";

export async function getReviews(req, res) {
  return ok(res, await listReviews());
}

export async function postReview(req, res) {
  const parsed = createReviewSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, "Invalid review: " + parsed.error.issues.map(i => i.message).join(", "), 400);
  }
  const reviewerId = req.user?.sub ?? "unknown";
  return ok(res, await createReview(reviewerId, parsed.data), 201);
}
