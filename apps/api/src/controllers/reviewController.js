import { fail, ok } from "../utils/response.js";
import { createReviewSchema } from "../validators/review.js";
import { createReview, listReviews } from "../services/reviewService.js";

export async function getReviews(req, res) {
  return ok(res, await listReviews());
}

export async function postReview(req, res) {
  const parsed = createReviewSchema.safeParse(req.body);

  if (!parsed.success) {
    const issue = parsed.error.issues[0];

    return fail(res, `${issue.path.join(".")} must be valid`, 400);
  }

  return ok(res, await createReview(parsed.data), 201);
}
