import { ok } from "../utils/response.js";
import { createReview, listReviews } from "../services/reviewService.js";
import { createReviewSchema } from "../validators/review.js";

export async function getReviews(req, res) {
  return ok(res, await listReviews());
}

export async function postReview(req, res) {
  const payload = createReviewSchema.safeParse(req.body);

  if (!payload.success) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: payload.error.issues
    });
  }

  return ok(res, await createReview(payload.data), 201);
}
