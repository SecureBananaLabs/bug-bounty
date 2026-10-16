import { ok, fail } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

export async function search(req, res) {
  const q = req.query.q;

  if (q === undefined || q === null) {
    return fail(res, "Missing required query parameter \"q\".", 400);
  }

  if (typeof q !== "string") {
    return fail(res, "Query parameter \"q\" must be a string.", 400);
  }

  const trimmed = q.trim();

  if (trimmed.length === 0) {
    return fail(res, "Query parameter \"q\" must not be empty.", 400);
  }

  if (trimmed.length > 200) {
    return fail(res, "Query parameter \"q\" must be 200 characters or fewer.", 400);
  }

  return ok(res, await globalSearch(trimmed));
}
