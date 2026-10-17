import { z } from "zod";
import { ok } from "../utils/response.js";
import { createReview, listReviews } from "../services/reviewService.js";

export async function getReviews(req, res) {
  return ok(res, await listReviews());
}

const schema = z.object({ rating: z.number().min(1).max(5), comment: z.string().optional(), targetId: z.string().min(1) }).strict();

export async function postReview(req, res) {
  let payload;
  try {
    payload = schema.parse(req.body);
  } catch (err) {
    return res.status(400).json({ success: false, message: "Validation failed" });
  }
  return ok(res, await createReview(payload));
}
