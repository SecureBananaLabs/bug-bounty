import { ok } from "../utils/response.js";
import { createReview, getReviewById, listReviews } from "../services/reviewService.js";

export async function getReviews(req, res, next) {
  try {
    return ok(res, await listReviews());
  } catch (err) {
    next(err);
  }
}

export async function getReview(req, res, next) {
  try {
    const review = await getReviewById(req.params.id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found"
      });
    }
    return ok(res, review);
  } catch (err) {
    next(err);
  }
}

export async function postReview(req, res, next) {
  try {
    return ok(res, await createReview(req.body), 201);
  } catch (err) {
    next(err);
  }
}
