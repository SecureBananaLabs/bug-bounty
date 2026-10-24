import { createReview, listReviews } from "../services/reviewService.js";
import { createReviewSchema } from "../validators/review.js";

function validationErrorResponse(error) {
  return {
    error: "Invalid review payload.",
    details: error.issues.map((issue) => ({
      field: issue.path.join(".") || "body",
      message: issue.message,
    })),
  };
}

export function createReviewController(req, res) {
  const parsedPayload = createReviewSchema.safeParse(req.body);

  if (!parsedPayload.success) {
    return res.status(400).json(validationErrorResponse(parsedPayload.error));
  }

  const review = createReview(parsedPayload.data);
  return res.status(201).json(review);
}

export function listReviewsController(req, res) {
  return res.status(200).json(listReviews());
}

// Aliases for backwards compatibility
export const getReviews = listReviewsController;
export const postReview = createReviewController;
