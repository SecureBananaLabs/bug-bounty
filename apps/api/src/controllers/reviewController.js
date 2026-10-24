import { z } from "zod";
import { ok } from "../utils/response.js";
import { createReview, listReviews } from "../services/reviewService.js";

const createReviewSchema = z.object({
  userId: z.string().min(1),
  freelancerId: z.string().min(1),
  jobId: z.string().min(1),
  rating: z.number().min(1).max(5).int(),
  comment: z.string().min(1).max(2000)
});

export async function getReviews(req, res) {
  return ok(res, await listReviews());
}

export async function postReview(req, res) {
  const payload = createReviewSchema.parse(req.body);
  if (req.user && req.user.id !== payload.userId) {
    return res.status(403).json({ success: false, message: "Cannot create review for another user" });
  }
  return ok(res, await createReview(payload), 201);
}
