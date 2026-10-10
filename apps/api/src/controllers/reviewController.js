import { fail, ok } from "../utils/response.js";
import { createReview, listReviews } from "../services/reviewService.js";

export async function getReviews(req, res) {
  return ok(res, await listReviews());
}

export async function postReview(req, res) {
  const comment = req.body?.comment;

  if (typeof comment !== "string" || comment.trim() === "") {
    return fail(res, "comment is required", 400);
  }

  return ok(res, await createReview(req.body), 201);
}
