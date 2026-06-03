import { ok } from "../utils/response.js";
import { createReview, listReviews } from "../services/reviewService.js";

function asyncHandler(fn) {
  return (req, res, next) => fn(req, res, next).catch(next);
}

export const getReviews = asyncHandler(async (req, res) => {
  return ok(res, await listReviews());
});

export const postReview = asyncHandler(async (req, res) => {
  return ok(res, await createReview(req.body), 201);
});
