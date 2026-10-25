import { ok, fail } from "../utils/response.js";
import { createReview, listReviews } from "../services/reviewService.js";
import { createReviewSchema } from "../validators/review.js";
import { z } from "zod";

export async function getReviews(req, res) {
  return ok(res, await listReviews());
}

export async function postReview(req, res) {
  try {
    const payload = createReviewSchema.parse(req.body);
    const result = await createReview(payload);
    return ok(res, result, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail(res, "Invalid review payload: " + error.errors[0].message, 400);
    }
    return fail(res, "Invalid review payload", 400);
  }
}
