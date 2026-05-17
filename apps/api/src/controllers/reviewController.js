import { ok } from "../utils/response.js";
import { createReview, listReviews } from "../services/reviewService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getReviews = asyncHandler(async (req, res) => {
  return ok(res, await listReviews());
});

export const postReview = asyncHandler(async (req, res) => {
  return ok(res, await createReview(req.body), 201);
});
