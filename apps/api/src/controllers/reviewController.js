import { ok, fail } from "../utils/response.js";
import { createReview, listReviews } from "../services/reviewService.js";
import { createReviewSchema } from "../validators/review.js";

export async function getReviews(req, res) {
  return ok(res, await listReviews());
}

export async function postReview(req, res) {
  try {
    const parsed = createReviewSchema.parse(req.body);
    const result = await createReview(parsed);
    return ok(res, result, 201);
  } catch (err) {
    if (err.name === "ZodError") {
      const message = err.issues.map((i) => i.message).join("; ");
      return fail(res, message, 400);
    }
    throw err;
  }
}
