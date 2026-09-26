import { ok, fail } from "../utils/response.js";
import { globalSearch } from "../services/searchService.js";

const MAX_QUERY_LENGTH = 200;

export async function search(req, res) {
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  if (q.length === 0) {
    return fail(res, "Query parameter 'q' is required", 400);
  }
  if (q.length > MAX_QUERY_LENGTH) {
    return fail(res, `Query must be ${MAX_QUERY_LENGTH} characters or fewer`, 400);
  }
  return ok(res, await globalSearch(q));
}
