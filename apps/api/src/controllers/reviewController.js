import { ok } from "../utils/response.js";
import { createReview, listReviews } from "../services/reviewService.js";

export async function getReviews(req, res) {
  return ok(res, await listReviews());
}

export async function postReview(req, res, next) {
  try {
    const { reviewerId, revieweeId } = req.body;
    if (reviewerId && revieweeId && reviewerId === revieweeId) {
      return res.status(400).json({
        success: false,
        message: "Reviewer and reviewee must be different users"
      });
    }
    return ok(res, await createReview(req.body), 201);
  } catch (error) {
    next(error);
  }
}
