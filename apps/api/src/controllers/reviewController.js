import { ok } from "../utils/response.js";
import { createReview, listReviews } from "../services/reviewService.js";

export async function getReviews(req, res) {
  return ok(res, await listReviews());
}

export async function postReview(req, res) {
  const { reviewerId, targetId, rating, comment } = req.body;
  
  if (!reviewerId || !targetId || rating === undefined || !comment || typeof comment !== 'string' || comment.trim() === '') {
    return res.status(400).json({
      success: false,
      message: "Missing or invalid required fields: reviewerId, targetId, rating, and comment are required."
    });
  }

  if (typeof rating !== 'number' || rating < 1 || rating > 5) {
    return res.status(400).json({
      success: false,
      message: "Invalid rating: must be a number between 1 and 5."
    });
  }

  return ok(res, await createReview(req.body), 201);
}
