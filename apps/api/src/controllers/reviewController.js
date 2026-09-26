import { ok } from "../utils/response.js";
import { createReview, listReviews } from "../services/reviewService.js";
import { parsePagination, paginate } from "../utils/pagination.js";

export async function getReviews(req, res) {
  const { page, limit, skip } = parsePagination(req.query);
  const { items, total } = await listReviews({ skip, limit });
  return ok(res, paginate(items, total, page, limit));
}

export async function postReview(req, res) {
  return ok(res, await createReview(req.body), 201);
}
