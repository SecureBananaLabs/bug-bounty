import { ok } from "../utils/response.js";
import { z } from "zod";
import { createReview, listReviews } from "../services/reviewService.js";

const reviewSchema = z.object({
  jobId: z.string().min(1),
  reviewerId: z.string().min(1),
  rating: z.number().min(1).max(5),
  comment: z.string().min(1).max(2000)
});

export async function getReviews(req, res) {
  return ok(res, await listReviews());
}

export async function postReview(req, res) {
  const payload = reviewSchema.parse(req.body);
  return ok(res, await createReview(payload), 201);
}
