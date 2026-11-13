import { ok } from "../utils/response.js";
import { createReview, listReviews } from "../services/reviewService.js";
import { createReviewSchema } from "../validators/review.js";
import { ZodError } from "zod";

export async function getReviews(req, res) {
  return ok(res, await listReviews());
}

export async function postReview(req, res) {
  try {
    const validated = createReviewSchema.parse(req.body);
    return ok(res, await createReview(validated), 201);
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: err.errors
      });
    }
    return res.status(500).json({
      success: false,
      message: err.message || "Internal server error"
    });
  }
}
