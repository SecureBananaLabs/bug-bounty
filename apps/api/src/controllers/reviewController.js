import { fail, ok } from "../utils/response.js";
import { createReview, listReviews } from "../services/reviewService.js";
import { createReviewSchema } from "../validators/review.js";

export async function getReviews(req, res) {
  return ok(res, await listReviews());
}

export async function postReview(req, res) {
  const payload = createReviewSchema.safeParse(req.body);

  if (!payload.success) {
    return fail(
      res,
      "Review payload must include targetUserId, jobId, and rating from 1 to 5",
      400
    );
  }

  return ok(res, await createReview(payload.data), 201);
}
