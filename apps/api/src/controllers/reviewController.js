import { ZodError } from "zod";
import { ok, fail } from "../utils/response.js";
import { createReviewSchema } from "../validators/review.js";
import { createReview, listReviews } from "../services/reviewService.js";

export async function getReviews(req, res) {
  return ok(res, await listReviews());
}

export async function postReview(req, res) {
  try {
    const payload = createReviewSchema.parse(req.body);
    return ok(res, await createReview(payload), 201);
  } catch (err) {
    if (err instanceof ZodError) {
      return fail(res, err.errors.map((e) => e.message).join("; "), 400);
    }
    throw err;
  }
}
