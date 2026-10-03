import { ok } from "../utils/response.js";
import { createReview, listReviews, listReviewsByJob } from "../services/reviewService.js";

export async function getReviews(req, res) {
  return ok(res, await listReviews());
}

export async function postReview(req, res) {
  return ok(res, await createReview(req.body), 201);
}

export async function getReviewsByJob(req, res) {
  const { jobId } = req.params;
  return ok(res, await listReviewsByJob(jobId));
}
