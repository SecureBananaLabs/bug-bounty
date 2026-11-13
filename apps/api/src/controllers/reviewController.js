import { fail, ok } from "../utils/response.js";
import { createReview, listReviews } from "../services/reviewService.js";

export async function getReviews(req, res) {
  return ok(res, await listReviews());
}

export async function postReview(req, res) {
  const revieweeId = req.body?.revieweeId;

  if (typeof revieweeId !== "string" || revieweeId.trim() === "") {
    return fail(res, "revieweeId is required", 400);
  }

  return ok(res, await createReview(req.body), 201);
}
