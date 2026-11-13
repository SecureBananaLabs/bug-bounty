import { fail, ok } from "../utils/response.js";
import { createReviewSchema } from "../validators/body.js";
import { createReview, listReviews } from "../services/reviewService.js";

export async function getReviews(req, res) {
  return ok(res, await listReviews());
}

export async function postReview(req, res) {
  const parsed = createReviewSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, "Invalid request body", 400, { issues: parsed.error.issues });
  }

  return ok(res, await createReview(parsed.data), 201);
}
