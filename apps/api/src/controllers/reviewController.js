import { z } from "zod";
import { ok } from "../utils/response.js";
import { createReview, listReviews } from "../services/reviewService.js";

export async function getReviews(req, res) {
  return ok(res, await listReviews());
}

const schema = z.object({}).passthrough();

export async function postReview(req, res) {
  const payload = schema.parse(req.body);
  return ok(res, await createReview(payload));
}
