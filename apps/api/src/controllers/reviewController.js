import { ok, fail } from "../utils/response.js";
import { createReviewSchema } from "../validators/review.js";
import { createReview, listReviews } from "../services/reviewService.js";

export async function getReviews(req, res) {
  return ok(res, await listReviews());
}

export async function postReview(req, res) {
  const parsed = createReviewSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, parsed.error.issues.map((i) => i.message).join("; "), 400);
  }
  // Use authenticated user as reviewerId, ignore client-supplied value
  const payload = { ...parsed.data, reviewerId: req.user.sub };
  return ok(res, await createReview(payload), 201);
}
