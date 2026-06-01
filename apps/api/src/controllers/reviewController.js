import { ok, fail } from "../utils/response.js";
import { createReview, listReviews } from "../services/reviewService.js";
import { createReviewSchema } from "../validators/review.js";

export async function getReviews(req, res) {
  return ok(res, await listReviews());
}

export async function postReview(req, res) {
  const parsed = createReviewSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, parsed.error.errors[0]?.message || "Invalid request", 400);
  }

  const payload = parsed.data;
  return ok(res, await createReview(payload), 201);
}
