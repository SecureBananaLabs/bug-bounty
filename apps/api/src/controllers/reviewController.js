import { ZodError } from "zod";
import { ok } from "../utils/response.js";
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
      return res.status(400).json({
        error: "Validation failed",
        details: err.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message
        }))
      });
    }
    throw err;
  }
}
